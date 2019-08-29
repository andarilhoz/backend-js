// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const customErrors = require('../utils/customErrors');
const s3 = new AWS.S3();


module.exports.handler = async (event, context) => {
    const s3params = {
       // @ts-ignore
       Bucket: process.env.S3_BUCKET_NAME,
       Key: event.queryStringParameters.path  
	};
	
    let data = await s3.getObject(s3params).promise();
	const imageBlob = [...data.Body];
	
	let response = {
		"statusCode": 200,
		"body": JSON.stringify({"data": JSON.stringify({"data": imageBlob})}),
		"isBase64Encoded": false
	};    
	return response;
};