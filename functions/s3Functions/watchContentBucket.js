// @ts-ignore
const AWS = require('aws-sdk')
AWS.config.update({region: 'sa-east-1'})
const s3 = new AWS.S3()
const csv = require('csv')
const uuid = require('uuid')
const dynamodb = new AWS.DynamoDB()
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) =>
{
	console.log("-----Inicio Event-----")
	console.log(event)
	let key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
	let csvFile = await readFile(key)
	let data = transformCsvToObj(csvFile)
	await deleteAdminData()
	await importData(data)
	console.log("------Fim Event Inicio Context-------")
	console.log(context)
	console.log("------Fim Tudo-------")
}


async function readFile(fileName)
{
	let params = {
		Bucket: process.env.S3_CONTENT_BUCKET_NAME,
		Key: fileName
	}
	console.log(`FileName: ${fileName}`);
	let data = await s3.getObject(params).promise()
	console.log(`data: ${data.Body.toString()}`);
	return await data.Body.toString();
}

function transformCsvToObj(csvFile)
{
	const output = []
	console.log(`csvFile: ${csvFile}`);
	csv.parse(csvFile, (error, data) =>
	{
		for (const [Numero, Pergunta, Alternativas, AlternativaCorreta, isPublic, Category, lingua] of data)
		{
			const category =
				Category === 'PRIMEIRA' ? 0 :
					Category === 'SEGUNDA' ? 1 :
						Category === 'TERCEIRA' ? 2 :
							Category === 'QUARTA' ? 3 :
								Category === 'QUINTA' ? 4 :
									'Categoria desconhecida' + Numero


			const right =
				AlternativaCorreta === 'A' ? 0 :
					AlternativaCorreta === 'B' ? 1 :
						AlternativaCorreta === 'C' ? 2 :
							AlternativaCorreta === 'D' ? 3 :
								5
			const index = Numero - 1;
			if (index == -1)
			{
				continue;
			}
			console.log(`${Numero}, ${Pergunta}, ${Alternativas}, ${AlternativaCorreta}, ${isPublic}, ${Category}, ${lingua}`)
			output[index] = output[index] ||
				{
					id: uuid.v1(),
					numero: Numero,
					creatorEmail: 'administrator',
					title: Pergunta,
					dificulty: 0,
					category,
					questionStatus: 1,
					isPublic: isPublic === 'true' || isPublic === true || isPublic === 'VERDADEIRO' ? true : false,
					hasReward: false,
					creationTime: new Date().toISOString(),
					language: lingua || "empty",
					right
				}

			output[index].answers = output[index].answers || []


			output[index].answers.push(
				{
					description: Alternativas,
					isRight: output[index].answers.length == output[index].right
				}
			);
		}
		output.map(o =>
		{
			delete o.right
		})
	})
	return output
}

async function importData(data)
{
	console.log("Importando data")
	await saveQuestion(0, data);
}

function getQuestion(index, itemArray)
{
	return {
		TableName: process.env.QUESTIONS_TABLE,
		Item: itemArray[index]
	};
}

async function saveQuestion(index, itemArray)
{
	console.log(`Item index: ${index}`);
	if (index == itemArray.length)
	{
		console.log("saved all.");
		return;
	}
	if (itemArray[index] != null)
	{

		var params = getQuestion(index, itemArray);
		//spit out what we are saving for sanity
		console.log(JSON.stringify(params));
		//use the client to execute put request.
		await docClient.put(params).promise()
		console.log("saved Question item " + index);
	} else
	{
		console.log(`${index} index is null`)
		console.dir(itemArray)
		console.log(JSON.stringify(itemArray));
	}
	index += 1;
	await saveQuestion(index, itemArray);
}

async function getTableData()
{
	let params = {
		TableName: process.env.QUESTIONS_TABLE,
		FilterExpression: 'creatorEmail = :ct',
		ExpressionAttributeValues: {
			':ct': {S: 'administrator'}
		}
	};

	return await dynamodb.scan(params).promise()
}

async function deleteAdminData()
{

	let adminQuestions = await getTableData();

	let params = {
		RequestItems: {}
	};

	let requests = []

	params.RequestItems[process.env.QUESTIONS_TABLE] = []

	adminQuestions.Items.forEach((i, index) =>
	{
		let size = Math.ceil(adminQuestions.Items.length / 25)
		requests[index % size] = requests[index % size] != undefined ? requests[index % size] : []
		requests[index % size].push(
			{
				DeleteRequest: {
					Key: {
						"id": i.id
					}
				}
			})
	})
	
	requests.forEach(async r  => {
		params.RequestItems[process.env.QUESTIONS_TABLE] = r;
		console.dir(params)
		await dynamodb.batchWriteItem(params).promise()
	});
	return 
}