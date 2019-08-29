// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {
    console.log(event);
    const d = new Date();
    d.setHours(d.getHours() - 1);
    
    const params = {
        Key: {
            "email": event.requestContext.authorizer.claims.email
        },
        ExpressionAttributeNames: {'#ltE': 'lastEnergy'},
        ConditionExpression: "#ltE < :threeAgo",
        UpdateExpression: "set energy = :en, #ltE = :lte",
        ExpressionAttributeValues: {
            ":en": 5, 
            ":threeAgo": d.toISOString(),
            ":lte": new Date().toISOString()
        },
        // @ts-ignore
        TableName: process.env.USERS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
        
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
};
