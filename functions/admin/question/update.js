// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();


module.exports.handler = async (event, context) => {
	const body = JSON.parse(event.body);
	try{
		
		let data = UpdateQuestion(body);
		return successResponse(data);
	}
	catch(e){
		const responseBody = {
			name: "[Error]",
			message: "Error on changing that info",
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

const UpdateQuestion = async function(body){
    const params = {
        Key: {
            "id": body.id
        },
        UpdateExpression: `
            set answers = :an,
                questionStatus = :qs,
                title = :ti,
                hasReward = :hr,
                updateDate = :ud,
                prizeValue = :pv,
                oldQuestion = :ol`,
        ExpressionAttributeValues: {
            ":an": body.answers,
            ":qs": body.questionStatus,
            ":ti": body.title,
            ":hr": true,
            ":ud": new Date().toISOString(),
            ":pv": body.prizeValue,
            ":ol": body.old
        },
        // @ts-ignore
        TableName: process.env.QUESTIONS_TABLE,
        ReturnValues: "UPDATED_NEW"
    };
    return await documentClient.update(params).promise();
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