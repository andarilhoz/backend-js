// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
const customErrors = require('../utils/customErrors');

const WOInDays = 3;

const rankedWinPoints = 50;
const loosePoints = -25;
const casualWinPoints = 15;

const rankedType = 2;
const closedStatus = 3;

const senderTurn = 0;
const targetTurn = 1;
const challenge = 2; // Same as Target

module.exports.handler = async (event, context) => {
	console.log(event);
	let gameData = await GetGameRequest(event);	
	if(!IsOutDated(gameData.Items[0])) return errResponse("NotOutOfDate");
	if(!ShouldValidate(gameData.Items[0])) return errResponse("ShouldNotInvalidateThis");
		
	await UpdateGameRequest(gameData.Items[0]);
		
	await generateLog(event);
	const opponentOneSignalID = getOpponentOneSignalId(gameData.Items[0]);
	if(opponentOneSignalID.length > 0 && opponentOneSignalID != "NotFound"){
		console.log("sending push notification");
		sendNotification(message(opponentOneSignalID));
	}				
	GivePlayersRewards(gameData.Items[0]);			
};

const getOpponentOneSignalId = function(gameRequest) 
{
    // @ts-ignore
    return gameRequest.senderEmail == gameRequest.gameStatus == senderTurn ? gameRequest.targetOneSignalID : gameRequest.senderOneSignalID;
};

const GetGameRequest = async function(event){
    console.log("Buscando GameRequest");
    console.log(event)
    const queryParams = {
        TableName: process.env.GAME_REQUESTS_TABLE,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": event.pathParameters.gameRequestId
        }
    };
    
    return await documentClient.query(queryParams).promise();
};

const IsOutDated = function(gameRequest){
	const lastTurn = new Date(gameRequest.lastTurn);
	const now = new Date();
	// @ts-ignore
	return lastTurn < now.setDate( now.getDate() - WOInDays);
};

const ShouldValidate = function(gameRequest)
{
    return gameRequest.gameStatus == senderTurn || gameRequest.gameStatus == targetTurn || gameRequest.gameStatus == challenge;
}


const UpdateGameRequest = async function(gameRequest)
{
    console.log("Atualizando GameRequest");
    const winnerEmail = gameRequest.gameStatus == senderTurn ? gameRequest.targetEmail : gameRequest.senderEmail;
    console.log(gameRequest);
    const params = 
    {
        Key: {
            "id": gameRequest.id,
        },
        UpdateExpression: `set gameStatus = :ga, winnerEmail = :win`,
        ExpressionAttributeValues: {
            ":ga": closedStatus,
            ":win": winnerEmail
        },
        TableName: process.env.GAME_REQUESTS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
    return await documentClient.update(params).promise();
};

const generateLog = async function(event)
{
    console.log("Gerando Log");
    const logId = uuid.v1();
    const params = {
        Item: {
            "id": logId,
            "email": event.requestContext.authorizer.claims.email,
            "gameRequestId": event.pathParameters.gameRequestId,
            "recebeuAlteracao": new Date().toISOString(),
            "extra": "Partida finalizada por tempo"
        },
        TableName: process.env.LOG_TABLE
    };
    
    return await documentClient.put(params).promise();
};

const GivePlayersRewards = async function(gameRequest){
    const winnerEmail = gameRequest.gameStatus == senderTurn ? gameRequest.targetEmail : gameRequest.senderEmail;
    await UpdateUserPoints(winnerEmail, gameRequest.type == rankedType ? rankedWinPoints : casualWinPoints);
	
	console.log("GameType: "+gameRequest.type);
	if(gameRequest.type != rankedType) return successResponse({message: "Success"});
	
	console.log("isRanked");
	const looserEmail = gameRequest.gameStatus == senderTurn ? gameRequest.senderEmail:  gameRequest.targetEmail;
	
	await UpdateUserPoints(looserEmail, loosePoints);
	await RemoveNegativeValue(looserEmail)
	return successResponse({message: "Success"});
};

const UpdateUserPoints = async function(email, points){
    const params = {
        Key: {
            "email": email
        },
        UpdateExpression: "set points = points + :pt",
        ExpressionAttributeValues: {
            ":pt": points
        },
        TableName: process.env.USERS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
    return await documentClient.update(params).promise();
};

const RemoveNegativeValue = async function(email){
    
    const params = {
        Key: {
            "email": email
        },
        ExpressionAttributeNames: {'#pt': 'points'},
        ConditionExpression: "#pt < :min",
        ExpressionAttributeValues: {
            ":min": 0
        },
        UpdateExpression: "set #pt = :min",
        TableName: process.env.USERS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
    
    return await documentClient.update(params).promise();
};

const errResponse = function(data){
    console.log("Error, data: " + data);
    const err = {
        statusCode: 500,
        body: JSON.stringify(new customErrors.InternalServerError(data)),
        isBase64Encoded: false
    };
    return err;
};

const successResponse = function(data){
    console.log("Sucesso, data: " + data);
    const responseBody = {
        name: "[Success]",
        message: "Operation Sucessfull",
        data: JSON.stringify(data)
    };

    const response = {
        statusCode: 200,
        body: JSON.stringify(responseBody),
        isBase64Encoded: false
    };
    return response;
};

var sendNotification = function(data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
  };
  
  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };
  
  var https = require('https');
  var req = https.request(options, function(res) {  
    res.on('data', function(data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();
};

const message =  function(oneSignalPlayerId){
    const template = process.env.ONESIGNAL_TEMPLATE_ID;
    return {
      app_id: process.env.ONESIGNAL_APP_ID,
      template_id: template,
      include_player_ids: [oneSignalPlayerId]
  };
};