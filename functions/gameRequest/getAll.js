// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {
    console.dir(event.requestContext.authorizer.claims);
    
    const scanParams = {
        TableName: process.env.GAME_REQUESTS_TABLE,
        FilterExpression: "senderEmail = :em or targetEmail = :em",
        ExpressionAttributeValues: {
            ":em": event.requestContext.authorizer.claims.email
        }
    };
    
    let data = await documentClient.scan(scanParams).promise();
 
	const responseBody = {
		name: "[Success]",
		message: "Update Sucessfull",
		data: JSON.stringify(data)
	};
	
	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};
        
	return response;
};
