// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {        
    console.log(event);
    const queryParams = {
        // @ts-ignore
        TableName: process.env.GAME_REQUESTS_TABLE,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": event.pathParameters.requestId
        }
    };
    
    let data = await documentClient.query(queryParams).promise();

	const responseBody = {
		name: "[Success]",
		message: "Request Sucessfull",
		data: JSON.stringify(data)
	};

	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};

	return response;
};
