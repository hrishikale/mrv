const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'Users';

exports.handler = async (event) => {
    console.log("Event:", JSON.stringify(event));
    
    const { httpMethod, path, body, headers } = event;
    
    // RBAC: Retrieve Role from Header (In real app, verify JWT token from Cognito)
    // For simplicity/demo mode, we expect a header 'x-user-role'
    const userRole = headers['x-user-role'] || 'viewer'; 
    
    const headersResponse = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,x-user-role",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE"
    };

    if (httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: headersResponse, body: '' };
    }

    try {
        switch (httpMethod) {
            case 'GET':
                if (!['super_admin', 'admin', 'viewer'].includes(userRole)) {
                    return { statusCode: 403, headers: headersResponse, body: JSON.stringify({ message: "Access Denied" }) };
                }
                const data = await docClient.scan({ TableName: TABLE_NAME }).promise();
                return {
                    statusCode: 200,
                    headers: headersResponse,
                    body: JSON.stringify(data.Items)
                };

            case 'POST':
                // Only Admin/Super Admin can add
                if (!['super_admin', 'admin'].includes(userRole)) {
                    return { statusCode: 403, headers: headersResponse, body: JSON.stringify({ message: "Access Denied: specialized role required" }) };
                }
                
                const newUser = JSON.parse(body);
                // Basic Validation
                if (!newUser.email || !newUser.name || !newUser.role) {
                     return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Missing required fields" }) };
                }

                const item = {
                    id: context.awsRequestId, // or uuid
                    ...newUser,
                    createdAt: new Date().toISOString()
                };

                await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
                return {
                    statusCode: 201,
                    headers: headersResponse,
                    body: JSON.stringify(item)
                };

            // Add PUT/DELETE similarly with role checks...
            
            default:
                return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Unsupported method" }) };
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            headers: headersResponse,
            body: JSON.stringify({ message: err.message })
        };
    }
};
