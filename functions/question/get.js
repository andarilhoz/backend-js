// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

module.exports.handler = async (event, context) => {
	
	console.log(event.pathParameters.language)
    const scanParams = {
        TableName: process.env.QUESTIONS_TABLE,
        FilterExpression: "category = :ca and questionStatus = :ap and #lang = :la",
        ExpressionAttributeValues: {
			":ca": parseInt(event.pathParameters.category),
			":ap": 1,
			":la": event.pathParameters.language
		},
		ExpressionAttributeNames: {
			"#lang": "language"
		}
    };
    
    let data = await documentClient.scan(scanParams).promise();
	console.log(data);
	if(data.Items.length == 0)
	{
		const responseErrorNotFound = {
			statusCode: 500,
			body: JSON.stringify("CategoryNotFound"),
			isBase64Encoded: false
		};
		return responseErrorNotFound;
	}
	
	// @ts-ignore
	const question = data.Items[[Math.floor(Math.random()*data.Items.length)]];
	
	if(event.pathParameters.gameRequestId == "MACHINE")
	{
		const responseBody = {
			name: "[Success]",
			message: "Request Sucessfull",
			data: JSON.stringify(question)
		};

		const response = {
			statusCode: 200,
			body: JSON.stringify(responseBody),
			isBase64Encoded: false
		};
		return response;
	}	
	return await generateLog(event, question);
};

const generateLog = async function(event, question)
{
    const logId = uuid.v1();
    const params = {
        Item: {
            "id": logId,
            "email": event.requestContext.authorizer.claims.email,
            "gameRequestId": event.pathParameters.gameRequestId,
            "questionId": question.id,
            "recebeuPerguntaTime": new Date().toISOString()
        },
        TableName: process.env.LOG_TABLE
    };
    
    await documentClient.put(params).promise();
        
	question.logId = logId;
	const responseBody = {
		name: "[Success]",
		message: "Request Sucessfull",
		data: JSON.stringify(question)
	};

	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};
	return response;
};