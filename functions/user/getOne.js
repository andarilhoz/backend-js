// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) =>
{

	const queryParams = {
		// @ts-ignore
		TableName: process.env.USERS_TABLE,
		Key: {
			'email': event.pathParameters.email.toLowerCase()
		}
	};
	try{
		let queryData = await documentClient.get(queryParams).promise();
		const responseBody = {
			name: "[Success]",
			message: "Request Successful",
			data: JSON.stringify(queryData)
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
	} catch (e)
	{
		const responseBody = {
			name: "[Error]",
			message: "Error on request",
			data: JSON.stringify(e)
		};
	
		const response = {
			statusCode: 500,
			body: JSON.stringify(responseBody),
			headers:
			{
				'Access-Control-Allow-Origin': '*'
			},
			isBase64Encoded: false
		};
	
		return response;
	}


};
