// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const randomType = 2
const machineType = 1;

module.exports.handler = async (event, context) => {
	const gameRequestId = uuid.v1();
	const body = JSON.parse(event.body);
	
	if(body.type != machineType) await removePlayerEnergy(event)
	if (body.type != randomType) return await createNewGameRequest(event, gameRequestId);
	
	console.log("isRandom");
	let data = await getRandomRequest(event);
	console.dir(data);
	if (data.length > 0) return await updateRandomRequest(event, data[0].id);
	return await createNewGameRequest(event, gameRequestId);	
};

const removePlayerEnergy = async function(event)
{
	const params =
	{
		Key: {
			"email": event.requestContext.authorizer.claims.email,
		},
		ExpressionAttributeNames: {'#e': 'energy', '#ltE': 'lastEnergy'},
		ConditionExpression: "#e > :zero",
		UpdateExpression: `set #e = #e - :en, #ltE = if_not_exists(#ltE, :lte)`,
		ExpressionAttributeValues: {
			":en": 1,
			":zero": 0,
			":lte": new Date().toISOString()
		},
		TableName: process.env.USERS_TABLE,
		ReturnValues: "UPDATED_NEW"
	};

	return await documentClient.update(params).promise();
};

const getRandomRequest = async function(event)
{
	const scanParams = {
		TableName: process.env.GAME_REQUESTS_TABLE,
		FilterExpression: "gameStatus = :gS AND senderEmail <> :em AND targetEmail = :tgE",
		ExpressionAttributeValues: {
			":gS": 1,
			":tgE": "Random",
			":em": event.requestContext.authorizer.claims.email,
		}
	};

	let data = await documentClient.scan(scanParams).promise();
	console.log(event.requestContext.authorizer.claims.email);
	console.dir(data);
	return data.Items;
};

const updateRandomRequest = async function(event, requestId)
{
	console.log("RequestId: " + requestId);
	const body = JSON.parse(event.body);
	const params =
	{
		Key: {
			"id": requestId,
		},
		UpdateExpression: "set targetEmail = :em, targetOneSignalID = :os",
		ExpressionAttributeValues: {
			":em": event.requestContext.authorizer.claims.email,
			":os": body.senderOneSignalID
		},
		TableName: process.env.GAME_REQUESTS_TABLE,
		ReturnValues: "UPDATED_NEW"
	};
	await documentClient.update(params).promise();
	return successResponse(requestId);
};

const createNewGameRequest = async function(event, gameRequestId) 
{
	console.log("Criando novo gameRequest");
	const body = JSON.parse(event.body);
	console.log(body);

	const target = body.target;
	const sender = body.sender;

	clean(target);
	clean(sender);

	body.targetOneSignalID = body.targetOneSignalID || "NotFound";

	const params = {
		Item: {
			"id": gameRequestId,
			"senderEmail": body.senderEmail,
			"targetEmail": body.targetEmail || "Random",
			"senderOneSignalID": body.senderOneSignalID,
			"targetOneSignalID": body.targetOneSignalID,
			"sender": sender,
			"target": target,
			"gameStatus": body.gameStatus,
			"type": body.type,
			"rodada": 1,
			"created": new Date().toISOString(),
			"lastTurn": new Date().toISOString()
		},
		TableName: process.env.GAME_REQUESTS_TABLE
	};

	await documentClient.put(params).promise();	
	return successResponse(gameRequestId);
};

const successResponse = function(data)
{
	console.log("Sucesso, data: " + data);
	const responseBody = {
		name: "[Success]",
		message: "Register Sucessfull",
		data: data
	};

	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};
	return response;
};

const clean = function(obj)
{
	Object.keys(obj).forEach((key) => (obj[key] === "" || obj[key] == null) && delete obj[key]);
};

