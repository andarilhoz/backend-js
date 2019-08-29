// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {        
    const scanParams = {
        // @ts-ignore
        TableName: process.env.QUESTIONS_TABLE,
        FilterExpression: "creatorEmail = :em",
        ExpressionAttributeValues: {
            ":em": event.requestContext.authorizer.claims.email
        }
    };
    
    let data = await documentClient.scan(scanParams).promise();
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
