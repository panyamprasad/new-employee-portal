const {
  GetItemCommand,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { DynamoDB } = require("aws-sdk");
const dynamoDb = new DynamoDB.DocumentClient();

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
        } else if (event.resource === "/softDeleteEmpDetails/{employeeId}") {
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
        Item: requestBody,
      };
      await dynamoDb.put(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Employee info added successfully...!",
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
        })
      };
    }
  }
  //Create EmpId
  async function getEmpId() {
    const params = {
      TableName: process.env.EMPLOYEE_ID_TABLE,
      Key: {
        id: "empId",
      },
      UpdateExpression:
        "SET #counter = if_not_exists(#counter, :initValue) + :incrValue",
      ExpressionAttributeNames: {
        "#counter": "counter",
      },
      ExpressionAttributeValues: {
        ":initValue": 1000, // Use numeric type (without quotes)
        ":incrValue": 1, // Use numeric type (without quotes)
      },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await dynamoDb.update(params).promise();
    return result.Attributes.counter;
  }

  //Update Record

  async function updateEmpDetails(event) {
    console.log(event);
    try {
      const employeeId = event.pathParameters.employeeId;
      const requestBody = JSON.parse(event.body);
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
          empId: employeeId,
        },
        UpdateExpression:
          "SET Personal_Info.firstName = :firstName, Personal_Info.lastName = :lastName, Personal_Info.email = :email, Personal_Info.dob = :dob," +
          "Personal_Info.gender = :gender, Personal_Info.mobileNumber = :mobileNumber, Personal_Info.address = :address",
        ExpressionAttributeValues: {
          ":firstName": requestBody.Personal_Info.firstName,
          ":lastName": requestBody.Personal_Info.lastName,
          ":email": requestBody.Personal_Info.email,
          ":dob": requestBody.Personal_Info.dob,
          ":gender": requestBody.Personal_Info.gender,
          ":mobileNumber": requestBody.Personal_Info.mobileNumber,
          ":address": requestBody.Personal_Info.address,
        },
      };
      await dynamoDb.update(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Employee Info Updated Successfully...!",
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }
  }
};

module.exports.employeeExperience = async function (event) {
  
  const httpMethod = event.httpMethod;
  switch (httpMethod) {
    case "POST":
      return saveExperienceInfo(event);
    case "PUT":
      return updateExperience(event);
    case "GET":
      if (event.pathParameters && event.pathParameters.employeeId) {
        return getEmployeeExperience(event);
      } else {
        return getAllEmployeesExperience(event);
      }
    case "DELETE":
      if (event.pathParameters && event.pathParameters.employeeId) {
        if (event.resource === "/deleteExperienceInfo/{employeeId}") {
          return hardDeleteEmployeeExperience(event);
        } else if (
          event.resource === "/softDeleteExperienceInfo/{employeeId}"
        ) {
          return softDeleteEmployeeExperience(event);
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
  async function saveExperienceInfo(event) {
    console.log(event)
    try {
      const requestBody = JSON.parse(event.body);

      // Validate StartDate and EndDate
      if (new Date(requestBody.startDate) >= new Date(requestBody.endDate)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "EndDate must be after StartDate" }),
        };
      }
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
        Item: requestBody,
      };
      await dynamoDb.put(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Experience info added successfully...!",
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Internal Server Error...!",
        }),
      };
    }
  }

  //Update Record
  async function updateExperience(event) {
    console.log(event)
    try {
      const employeeId = event.pathParameters.employeeId;
      const requestBody = JSON.parse(event.body);
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
        Key: {
          empId: employeeId,
        },
        UpdateExpression:
          "SET Experience_Info.companyName = :companyName, Experience_Info.companyLocation = :companyLocation," +
          "Experience_Info.startDate = :startDate, Experience_Info.endDate = :endDate, Experience_Info.performedRole = :performedRole," +
          "Experience_Info.responsibilities = :responsibilities, Experience_Info.technologiesWorked = :technologiesWorked," +
          "Experience_Info.isActive = :isActive",
        ExpressionAttributeValues: {
          ":companyName": requestBody.Experience_Info.companyName,
          ":companyLocation": requestBody.Experience_Info.companyLocation,
          ":startDate": requestBody.Experience_Info.startDate,
          ":endDate": requestBody.Experience_Info.endDate,
          ":performedRole": requestBody.Experience_Info.performedRole,
          ":responsibilities": requestBody.Experience_Info.responsibilities,
          ":technologiesWorked": requestBody.Experience_Info.technologiesWorked,
          ":isActive": requestBody.Experience_Info.isActive,
        },
      };
      await dynamoDb.update(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Record Updated Successfully...!",
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }
  }

  //Get Record
  async function getEmployeeExperience(event) {
    console.log(event)
    try {
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
        Key: {
          empId: event.pathParameters.employeeId,
        },
      };
      const result = await dynamoDb.get(params).promise();
      if (!result.Item) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `${employeeId} record not found...!`,
          }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }
  }

  //Get All Records
  async function getAllEmployeesExperience(event) {
    console.log(event)
    try {
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
      };
      const result = await dynamoDb.scan(params).promise();
      if (!result.Items || result.Items.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "No records found...!" }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
      };
    } catch (error) {
      console.error("Error fetching all employees experience:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: error.message }),
      };
    }
  }

  //Delete Record
  async function hardDeleteEmployeeExperience(event) {
    console.log(event)
    try {
      const employeeId = event.pathParameters.employeeId;
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
        Key: {
          empId: employeeId,
        },
      };
      const result = await dynamoDb.delete(params).promise();
      if (!result.Item) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `${employeeId} record not found...!`,
          }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `${employeeId} Record deleted successfully...!`,
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }
  }

  //Soft Delete Record
  async function softDeleteEmployeeExperience(event) {
    console.log(event)
    try {
      const employeeId = event.pathParameters.employeeId;
      const requestBody = JSON.parse(event.body);
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
        Key: {
          empId: employeeId,
        },
        UpdateExpression: "SET Experience_Info.isActive = :isActive",
        ExpressionAttributeValues: {
          ":isActive": requestBody.Experience_Info.isActive,
        },
      };
      const result = await dynamoDb.update(params).promise();
      if (!result.Item) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `${employeeId} is not available...`,
          }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Record soft deleted Successfully...!",
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }
  }
};
