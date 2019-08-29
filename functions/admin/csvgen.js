// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const documentClient = new AWS.DynamoDB.DocumentClient();


const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({region: 'us-west-2'});

module.exports.handler = async (event, context) => {    
		
	let param = {
		AccessToken: event.queryStringParameters.token 
	}
	
	try{
		let data = await cognitoidentityserviceprovider.getUser(param).promise();
	}catch(e){
		return errResponse(e);
	}
	
    const scanParams = {
        // @ts-ignore
        TableName: process.env.USERS_TABLE
    };
    
	let scanData = await documentClient.scan(scanParams).promise();
	
	let csv = `name,email,registerTime,pais,planta,unidade,videos\n`
	
	scanData.Items.forEach(item => {
		csv += `${item.name || "Name not found"},`
		csv += `${item.email || "E-mail not found"},`
		csv += `${item.registerTime || "Register time not found"},`
		csv += `${item.userGroup || "pais" },`
		csv += `${item.planta || "planta"},`
		csv += `${item.unidade || "unidade"},`
		csv += `${item.videos != null ? JSON.stringify(item.videos).replace(/,/g,"-") : "Videos not found"}\n`		
	})
	
	const response = {
		statusCode: 200,
		body: csv,
		headers:
		{
			'Content-disposition': 'attachment; filename=relatorio.csv',
			'Content-Type': 'text/csv',
			'Access-Control-Allow-Origin': '*'
		},
		isBase64Encoded: false
	};
    return response;
};


const errResponse = function(data){
    console.log("Error, data: " + data);
    const err = {
        statusCode: 500,
        body: JSON.stringify(new InternalServerError(data)),
		headers:
		{
			'Access-Control-Allow-Origin': '*'
		},
        isBase64Encoded: false
    };
    return err;
};

function InternalServerError(message){
    this.name = "[InternalServerError]";
	this.message = message.message;
	this.code = message.code;
	this.statusCode = message.statusCode;
}

InternalServerError.prototype = new Error();