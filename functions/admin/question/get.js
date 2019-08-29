// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

module.exports.handler = async (event, context) => {
    
    const scanParams = {
        TableName: process.env.QUESTIONS_TABLE,
        FilterExpression: "questionStatus = :qs",
        ExpressionAttributeValues: {
            ":qs": 0
        }
    };
    try{
		
		let data = await documentClient.scan(scanParams).promise();
		return successResponse(data);
	}catch(e){
		const responseBody = {
			name: "[Error]",
			message: "Error on getting that info",
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

const successResponse = function(data){
    console.log("Sucesso, data: " + data);
    
    const responseBody = {
        name: "[Success]",
        message: "Operation Sucessfull",
        data: JSON.stringify(data)
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