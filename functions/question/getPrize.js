// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

module.exports.handler = async (event, context) => {
    const body = JSON.parse(event.body);
    
    await UpdateQuestion(body);
	
	let data = await UpdateUserPoints(event, body.prizeValue);
	generateLog(event,body);
	return successResponse(data);
};

const UpdateQuestion = async function(body, callback){
    const params = {
        Key: {
            "id": body.id
        },
        UpdateExpression: "set hasReward = :hr",
        ExpressionAttributeValues: {
            ":hr": false
        },
        TableName: process.env.QUESTIONS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
    return await documentClient.update(params).promise();
};


const generateLog = function(event, body)
{
    const logId = uuid.v1();
    const params = {
        Item: {
            "id": logId,
            "email": event.requestContext.authorizer.claims.email,
            "questionId": body.id,
            "extra": "Bonus por pergunta enviada"
        },
        TableName: process.env.LOG_TABLE
    };
    
    documentClient.put(params, function(postErr, postData) {});
};

const UpdateUserPoints = async function(event, points){
    const params = {
        Key: {
            "email": event.requestContext.authorizer.claims.email
        },
        UpdateExpression: "set points = points + :pt",
        ExpressionAttributeValues: {
            ":pt": parseInt(points)
        },
        TableName: process.env.USERS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
    return await documentClient.update(params).promise();
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
		headers:
		{
			'Access-Control-Allow-Origin': '*'
		},
        isBase64Encoded: false
    };
    return response;
};