// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const corectAnswerPoints = 5;
const machineGameType = 1;

module.exports.handler = async (event, context) => {
	
    const body = JSON.parse(event.body);//event (use this to test);
    try{
    let data = await GetGameRequest(event.pathParameters.gameRequestId);
	await UpdateGameRequest(data, body, event);
	if(body.acertou && data.type != machineGameType) await UpdateUserPoints(event.requestContext.authorizer.claims.email, corectAnswerPoints)
	return await generateLog(event, body);
	}catch(e){
		const responseBody = {
			name: "[Success]",
			message: "Register Sucessfull",
			data: JSON.stringify(e)
		};
		
		const response = {
			statusCode: 200,
			body: JSON.stringify(responseBody),
			isBase64Encoded: false
		};
		return response
	}
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

const GetGameRequest = async function(gameRequestId){
	
    console.log("gameRequestId: " + gameRequestId);
    
    const queryParams = {
        TableName: process.env.GAME_REQUESTS_TABLE,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": gameRequestId
        }
    };
  
    let data = await documentClient.query(queryParams).promise();
	return data.Items[0];
};

const UpdateGameRequest = async function(gameRequest, body, event){
	
    console.log("gameRequest: " + gameRequest);
    const userSenderOrTarget = body.userGameState.type == 1 ? "target" : gameRequest.senderEmail == event.requestContext.authorizer.claims.email ?  "sender" : "target";
    
    const params = 
    {
        Key: {
            "id": gameRequest.id,
        },
        UpdateExpression: `set lastTurn = :lt, ${userSenderOrTarget} = :us, iconsWonsThisTurn = :ic`,
        ExpressionAttributeValues: {
            ":lt": new Date().toISOString(),
            ":us": body.userGameState,
            ":ic": body.iconsWonsThisTurn
        },
        TableName: process.env.GAME_REQUESTS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
	let data = await documentClient.update(params).promise();
	
	const responseBody = {
		name: "[Success]",
		message: "Register Sucessfull",
		data: JSON.stringify(data)
	};
	
	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};
	return response
};

const generateLog = async function(event, body)
{
    const logId = uuid.v1();
    const params = {
        Item: {
            "id": logId,
            "email": event.requestContext.authorizer.claims.email,
            "resposta": body.resposta,
			"acertou": body.acertou,
			"questionNumber": body.questionNumber,
            "respondeuPerguntaTime": new Date().toISOString(),
            "gameRequestId": event.pathParameters.gameRequestId,
            "questionId": body.questionId,
            "questionOrigin": body.logId,
            "userGameState": body.userGameState
        },
        TableName: process.env.LOG_TABLE
    };
    
	var resposta = await documentClient.put(params).promise();       
	
	console.log(resposta);
        
	const responseBody = {
		name: "[Success]",
		message: resposta.$response.data
	};

	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};
	return response;
};