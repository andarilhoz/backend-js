// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {    
    const scanParams = {
        // @ts-ignore
        TableName: process.env.USERS_TABLE
    };
    
	let scanData = await documentClient.scan(scanParams).promise();
	
	const responseBody = {
		name: "[Success]",
		message: "Request Successful",
		data: JSON.stringify(scanData)
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
