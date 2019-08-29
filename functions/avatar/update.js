// @ts-ignore
const AWS = require('aws-sdk');
AWS.config.update({region: 'sa-east-1'});
const customErrors = require('../utils/customErrors');
const s3 = new AWS.S3();


module.exports.handler = async (event, context) => {    
    const encodedImage = JSON.parse(event.body).data;
    // @ts-ignore
    const decodedImage = Buffer.from(encodedImage, 'binary');
    const filePath = "avatars/" + event.requestContext.authorizer.claims.email + ".png";

    const s3params = {
       Body: decodedImage,
       // @ts-ignore
       Bucket: process.env.S3_BUCKET_NAME,
       Key: filePath  
    };
    
	let data = await s3.upload(s3params).promise();
	
	const responseBody = {
		name: "[Success]",
		message: "Update Sucessfull"
	};
	
	const response = {
		statusCode: 200,
		body: JSON.stringify(responseBody),
		isBase64Encoded: false
	};
	
	return response;
};