// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {
    const params = {
        Item: {
            "email": event.email,
            "name": event.name,
            "nickname": event.nickname,
			"userGroup": event.userGroup,
			"avatarAddress": event.avatarAddress,
			"videos": event.videos,
			"oneSignalUserID": event.oneSignalUserID || "NotFound",
			"planta": event.planta,
			"unidade": event.unidade,
            "league" : 0,
            "points" : 0,
            "experience" : 1,
            "energy" : 5,
			"completedTutorial": false,
			"registerTime": new Date().toISOString(),
			"lastLoginTime": new Date().toISOString(),
			"status": "NORMAL",
            "const": "const"
        },
        // @ts-ignore
        TableName: process.env.USERS_TABLE
    };
	try{
    	let postData = await documentClient.put(params).promise();
		return postData;
	}catch(e){
		console.log("Erro ao cadastrar usuario" + e);
		return e;
	}
};