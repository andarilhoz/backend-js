// @ts-ignore
const AWS = require('aws-sdk')
AWS.config.update({region: 'sa-east-1'})
const documentClient = new AWS.DynamoDB.DocumentClient()

const allowedStatus = ["NORMAL"]

module.exports.handler = async (event, context) =>
{
	let email = event.email;
	let isAdminData = event.isAdminData || false;
	console.log(`isAdminData ${isAdminData}`);
	try
	{
		let userStatus = await checkUserStatus(email)
		console.dir(userStatus)
		
		console.log(`isBadRequest ${!validateStatus(userStatus.Item.status) || (!userStatus.Item.isAdmin && isAdminData)}`);
		if (!validateStatus(userStatus.Item.status) || (!userStatus.Item.isAdmin && isAdminData))
		{
			return response(userStatus.Item, 401, false)
		}
		return response(await updateLoginTime(email), 200, true)
	} catch (e)
	{
		return response(e, 500, false)
	}
}

const checkUserStatus = async function(email)
{
	const getParams = {
		TableName: process.env.USERS_TABLE,
		Key: {
			'email': email
		}
	}
			
	return await documentClient.get(getParams).promise()
}

const validateStatus = function(status)
{
	console.log("status "+ status)
	return allowedStatus.indexOf(status) != -1
}

const updateLoginTime = async function(email)
{
	const params = {
		Key: {
			"email": email
		},
		UpdateExpression: "set lastLoginTime = :lt",
		ExpressionAttributeValues: {
			":lt": new Date().toISOString()
		},
		// @ts-ignore
		TableName: process.env.USERS_TABLE,
		ReturnValues: "UPDATED_NEW"
	}

	await documentClient.update(params).promise()
}


const response = function(data, statusCode, success)
{
	console.log("Retorno, data: ");
	console.dir(data);
	const responseBody = {
		name: success ? "[Success]" : "[Error]",
		message: success ? JSON.stringify(data) : "UserRoutineLocked"
	};

	const response = {
		statusCode: statusCode,
		body: JSON.stringify(responseBody),
		headers:
		{
			'Access-Control-Allow-Origin': '*'
		},
		isBase64Encoded: false
	};
	return response;
};