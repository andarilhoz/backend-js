// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const rankedWinPoints = 50;
const loosePoints = 0;
const casualWinPoints = 15;
const machineWinPoints = 0;

const rankedType = 2;
const machineType = 1;
const closedStatus = 3;
const challengeStatus = 2;

module.exports.handler = async (event, context) => {
    const body = JSON.parse(event.body);//event (use this to test);
    console.log(event);

    await UpdateGameRequest(event.pathParameters.requestId, body, event);    
	await generateLog(body, event);
		
	if(body.opponentOneSignalID.length > 0 && body.opponentOneSignalID != "NotFound"){
		console.log("sending push notification");
		sendNotification(message(body.opponentOneSignalID, body.gameStatus));
	}
	
	if(body.gameStatus == closedStatus){
		return GivePlayersRewards(event, body);
	}
	
	return successResponse({message: "Success"});
};

const GivePlayersRewards = async function(event, body){
    await UpdateUserPoints(event.requestContext.authorizer.claims.email, body.gameType == rankedType ? rankedWinPoints : body.gameType == machineType ? machineWinPoints : casualWinPoints);
	console.log("GameType: "+body.gameType);
	if(body.gameType != rankedType) return successResponse({message: "Success"});
	console.log("isRanked");
	await UpdateUserPoints(body.opponentEmail, loosePoints);	
	await RemoveNegativeValue(body.opponentEmail);
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

const RemoveNegativeValue = async function(email) {
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

const UpdateGameRequest = async function(gameRequestId, body, event)
{
    const userSenderOrTarget = body.isSender ? "sender" : "target";
    console.log("id: " + gameRequestId);
    console.log(body.userGameState);
    const params = 
    {
        Key: {
            "id": gameRequestId,
        },
        UpdateExpression: `set gameStatus = :ga, rodada = :ro, ${userSenderOrTarget} = :us, winnerEmail = :win, iconsWonsThisTurn = :ic`,
        ExpressionAttributeValues: {
            ":ga": body.gameStatus,
            ":ro": body.rodada,
            ":us": body.userGameState,
            ":ic": 0,
            ":win": body.gameStatus == 3 ? event.requestContext.authorizer.claims.email : "NoneYet"
        },
        TableName: process.env.GAME_REQUESTS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
    return await documentClient.update(params).promise();
};

const generateLog = async function(body, event)
{
    const logId = uuid.v1();
    const params = {
        Item: {
            "id": logId,
            "email": event.requestContext.authorizer.claims.email,
            "gameRequestId": event.pathParameters.requestId,
            "userGameState": body.userGameState,
            "recebeuAlteracao": new Date().toISOString(),
            "extra": body.extra
        },
        TableName: process.env.LOG_TABLE
    };
    
    return await documentClient.put(params).promise();
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

const message =  function(oneSignalPlayerId, status){
    const template = status == closedStatus ? process.env.ONESIGNAL_FINALIZADO_TEMPLATE_ID :
                     status == challengeStatus ? process.env.ONESIGNAL_DESAFIO_TEMPLATE_ID :
                     process.env.ONESIGNAL_SUAVEZ_TEMPLATE_ID;
    return {
      app_id: process.env.ONESIGNAL_APP_ID,
      template_id: template,
      include_player_ids: [oneSignalPlayerId]
  };
};