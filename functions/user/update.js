// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) =>
{
	console.log(event);
	const body = JSON.parse(event.body);
	const params = {
		Key: {
			"email": event.requestContext.authorizer.claims.email
		},
		UpdateExpression: "set avatarAddress = :av, nickname = :ni",
		ExpressionAttributeValues: {
			":av": body.avatarAddress,
			":ni": body.nickname
		},
		// @ts-ignore
		TableName: process.env.USERS_TABLE,
		ReturnValues: "UPDATED_NEW"

	};
	try
	{

		await documentClient.update(params).promise();
		const responseBody = {
			name: "[Success]",
			message: "Changes updated sucessfull"
		};

		const response = {
			statusCode: 200,
			body: JSON.stringify(responseBody),
			isBase64Encoded: false
		};
		return response;
	} catch (e)
	{
		const responseBody = {
			name: "[Error]",
			message: "Changes not updated",
			data: JSON.stringify(e)
		};

		const response = {
			statusCode: 500,
			body: JSON.stringify(responseBody),
			isBase64Encoded: false
		};
		return response;
	}
};
