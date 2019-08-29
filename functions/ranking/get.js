// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {
    if(event.pathParameters != null)
		return await GetRanking(groupRanking(event.pathParameters.group.replace(/%20/g,' ')));
    return await GetRanking(globalRanking());
};

const groupRanking = function(group){
    return  {
        IndexName: 'userGroup-points-index',
        KeyConditionExpression: 'userGroup = :e',
        ExpressionAttributeValues: {
            ':e': group
        },
        ProjectionExpression: 'points, nickname',
        ScanIndexForward: false,
        // @ts-ignore
        TableName: process.env.USERS_TABLE,
        Limit: 40
    };
};

const globalRanking = function(){
    return  {
        // @ts-ignore
        TableName: process.env.USERS_TABLE,
        IndexName: 'const-points-index',
        KeyConditionExpression: ' const = :g',
        ExpressionAttributeValues: {
            ':g': 'const'
        },
        ProjectionExpression: 'points, nickname',
        ScanIndexForward: false,
        Limit: 40
    };
};

const GetRanking = async function(scanParams){
    let data =  await documentClient.query(scanParams).promise();
	return successResponse(data);
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
        isBase64Encoded: false
    };
    return response;
};
