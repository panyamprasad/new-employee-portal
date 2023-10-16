const { GetItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDB } = require("aws-sdk");
const dynamoDb = new DynamoDB.DocumentClient();
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

module.exports.employeeDetails = async function (event) {
  const httpMethod = event.httpMethod;
  switch (httpMethod) {
    case "POST":
      return createEmpDetails(event);
    case "PUT":
      return updateEmpDetails(event);
    case "GET":
      if (event.pathParameters && event.pathParameters.employeeId) {
        return getEmpDetails(event);
      } else {
        return getAllEmpDetails(event);
      }
    case "DELETE":
      if (event.pathParameters && event.pathParameters.employeeId) {
        if (event.resource === "/deleteEmpDetails/{employeeId}") {
          return deleteEmpDetails(event);
        } else if (
          event.resource === "/softDeleteEmpDetails/{employeeId}"
        ) {
          return softDeleteEmpDetails(event);
        }
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "EmployeeId missing in delete request...!",
          }),
        };
      }
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method not allowed" }),
      };
  }

  //Save Record
  async function createEmpDetails(event) {
    console.log(event)
    try {
      const requestBody = JSON.parse(event.body);
      const empId = await getEmpId();
      requestBody.empId = empId.toString();
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: marshall(requestBody || {}),
      };
      await dynamoDb.put(params).promise();
      console.log(params)
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Employee info added successfully...!",
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error,
        }),
      };
    }
  }

  async function getEmpId() {
    try {
      const currentParams = {
        TableName: process.env.EMPLOYEE_ID_TABLE,
        Key: {
          id: { S: 'employeeCounter' },
        },
      };
      const { Item } = await dynamoDb.get(currentParams).promise();
      const initialValue = Item ? parseInt(Item.counter.N, 10) + incrementValue : 5;
  
      const updateParams = {
        TableName: process.env.EMPLOYEE_ID_TABLE,
        Key: {
          id: { S: 'employeeCounter' },
        },
        UpdateExpression: 'SET #counter = :newValue',
        ExpressionAttributeNames: {
          '#counter': 'counter',
        },
        ExpressionAttributeValues: {
          ':newValue': { N: initialValue.toString() },
        },
        ReturnValues: 'UPDATED_NEW',
      };
  
      const { Attributes } = await dynamoDb.update(updateParams).promise();
      return Attributes.counter.N;
    } catch (error) {
      console.error('Error in getEmpId:', error);
      throw new Error('Failed to get or update employee ID');
    }
  }
  
};
