// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

module.exports.handler = async (event, context) => {
    //console.log(JSON.parse(event.body));
    
    const body = JSON.parse(event.body);
    console.log(event.body);
    clean(body);
    
    const params = {
        Item: {
            "id": uuid.v1(),
            "creatorEmail": event.requestContext.authorizer.claims.email,
            "title": body.title,
            "answers": body.answers,
            "dificulty": body.dificulty,
            "category": body.category,
            "questionStatus" : 0,
            "hasReward" : false,
            "creationTime": new Date().toISOString()
        },
        TableName: process.env.QUESTIONS_TABLE
    };
    
    console.log("oi");
    
    await documentClient.put(params).promise();

	const responseBody = {
		name: "[Success]",
		message: "Register Sucessfull"
	};

	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};
	
	return response;
};

const clean = function(obj) {
    Object.keys(obj)
    .forEach((key) => 
        (obj[key] === "" || obj[key] == null ) && 
        delete obj[key]
        );
}
