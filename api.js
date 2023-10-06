const { DynamoDB } = require('aws-sdk');
const dynamoDb = new DynamoDB.DocumentClient();

// Create Experience Details
module.exports.createExperience = async (event) => {
  const requestBody = JSON.parse(event.body);
  // Validate StartDate and EndDate
  if (new Date(requestBody.StartDate) >= new Date(requestBody.EndDate)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'EndDate must be after StartDate' }),
    };
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: {
      EmpId: requestBody.EmpId,
      CompanyName: requestBody.CompanyName,
      CompanyLocation: requestBody.CompanyLocation,
      StartDate: requestBody.StartDate,
      EndDate: requestBody.EndDate,
      PerformedRole: requestBody.PerformedRole,
      Responsibilities: requestBody.Responsibilities,
      TechnologiesWorked: requestBody.TechnologiesWorked,
      IsActive: requestBody.IsActive,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Experience details created successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while creating experience details' }),
    };
  }
};

// Update Experience Details
module.exports.updateExperience = async (event) => {
  const employeeId = event.pathParameters.employeeId;
  const requestBody = JSON.parse(event.body);

  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Key: { EmpId: employeeId },
    UpdateExpression:
      'SET CompanyName = :companyName, CompanyLocation = :companyLocation, StartDate = :startDate, EndDate = :endDate, ' +
      'PerformedRole = :performedRole, Responsibilities = :responsibilities, TechnologiesWorked = :technologiesWorked, IsActive = :isActive',
    ExpressionAttributeValues: {
      ':companyName': requestBody.CompanyName,
      ':companyLocation': requestBody.CompanyLocation,
      ':startDate': requestBody.StartDate,
      ':endDate': requestBody.EndDate,
      ':performedRole': requestBody.PerformedRole,
      ':responsibilities': requestBody.Responsibilities,
      ':technologiesWorked': requestBody.TechnologiesWorked,
      ':isActive': requestBody.IsActive,
    },
  };

  try {
    await dynamoDb.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Experience details updated successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while updating experience details' }),
    };
  }
};

//Get the Specific Employee Experience info
module.exports.getExperience = async (event) => {
  const employeeId = event.pathParameters.employeeId;
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Key:{
      EmpId: employeeId
    },    
  };
  try{
    const result = await dynamoDb.get(params).promise();
    return{
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  }catch(error){
    return{
      statusCode: 500,
      body: JSON.stringify({error: 'An error occurred while getting experience details...!'})
    };
  }
}

// // Get All Experience Details
module.exports.getAllExperience = async () => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    const items = result.Items.map((item) => DynamoDB.Converter.unmarshall(item));

    console.log('Retrieved items:', items); // Log the retrieved items for debugging

    return {
      statusCode: 200,
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error('Error fetching experience details:', error); // Log the error for debugging
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while fetching experience details' }),
    };
  }
};

