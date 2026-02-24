const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'Users';

// Helper to sanitize role name for ID
const getRoleId = (name) => `role_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

exports.handler = async (event) => {
    console.log("Event:", JSON.stringify(event));
    
    const { httpMethod, path, body, headers } = event;
    const userRole = headers['x-user-role'] || 'viewer'; // In real app, from JWT

    const headersResponse = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,x-user-role",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE"
    };

    if (httpMethod === 'OPTIONS') return { statusCode: 200, headers: headersResponse, body: '' };

    try {
        const resource = path.split('/').pop(); // "users" or "roles" (assuming path ends with resource)
        // Note: API Gateway standard path might be /users or /roles. 
        // We'll detect based on path containing 'roles' or 'users'.
        const isRolesApi = path.includes('roles');
        const isUsersApi = path.includes('users');

        if (isRolesApi) {
            // --- ROLES MANAGEMENT ---
            if (httpMethod === 'GET') {
                const data = await docClient.scan({
                    TableName: TABLE_NAME,
                    FilterExpression: '#type = :type',
                    ExpressionAttributeNames: { '#type': 'type' },
                    ExpressionAttributeValues: { ':type': 'ROLE' }
                }).promise();
                return { statusCode: 200, headers: headersResponse, body: JSON.stringify(data.Items) };
            }

            if (httpMethod === 'POST') {
                const newRole = JSON.parse(body);
                if (!newRole.name || !newRole.permissions) {
                    return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Name and Permissions required" }) };
                }
                const roleId = getRoleId(newRole.name);
                
                // Check duplicate
                const existing = await docClient.get({ TableName: TABLE_NAME, Key: { id: roleId } }).promise();
                if (existing.Item) {
                    return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Role already exists" }) };
                }

                const item = {
                    id: roleId,
                    type: 'ROLE',
                    name: newRole.name,
                    description: newRole.description || '',
                    permissions: newRole.permissions,
                    createdAt: new Date().toISOString()
                };
                await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
                return { statusCode: 201, headers: headersResponse, body: JSON.stringify(item) };
            }
            
            // Allow Updating Roles
             if (httpMethod === 'PUT') {
                const updateData = JSON.parse(body);
                // Expecting { id, ... } or { name, ... } to drive the ID
                // For simplicity, we assume ID is passed or derived from name if consistent
                if (!updateData.id && !updateData.name) return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Role ID or Name required" }) };
                
                const roleId = updateData.id || getRoleId(updateData.name);
                
                const item = {
                    id: roleId,
                    type: 'ROLE',
                    name: updateData.name,
                    description: updateData.description,
                    permissions: updateData.permissions,
                    updatedAt: new Date().toISOString()
                };
                // In a real app, use UpdateItem for partial updates. for now, Overwrite/Put is okay for this demo.
                await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
                return { statusCode: 200, headers: headersResponse, body: JSON.stringify(item) };
            }

            if (httpMethod === 'DELETE') {
                 // Prevent delete if assigned to users - simplified check
                 // In real DB, query GSI. Here, we scan users.
                const roleId = event.queryStringParameters && event.queryStringParameters.id;
                if (!roleId) return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Role ID required" }) };

                const users = await docClient.scan({
                    TableName: TABLE_NAME,
                    FilterExpression: '#type = :type AND roleId = :rid',
                    ExpressionAttributeNames: { '#type': 'type' },
                    ExpressionAttributeValues: { ':type': 'USER', ':rid': roleId }
                }).promise();

                if (users.Count > 0) {
                    return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Cannot delete role assigned to users" }) };
                }

                await docClient.delete({ TableName: TABLE_NAME, Key: { id: roleId } }).promise();
                return { statusCode: 200, headers: headersResponse, body: JSON.stringify({ message: "Role deleted" }) };
            }
        }

        if (isUsersApi) {
            // --- USERS MANAGEMENT ---
            if (httpMethod === 'GET') {
                const data = await docClient.scan({
                    TableName: TABLE_NAME,
                    // Filter for type=USER or items that lack 'type' (legacy items)
                    FilterExpression: 'attribute_not_exists(#type) OR #type = :type',
                    ExpressionAttributeNames: { '#type': 'type' },
                    ExpressionAttributeValues: { ':type': 'USER' }
                }).promise();
                return { statusCode: 200, headers: headersResponse, body: JSON.stringify(data.Items) };
            }

            if (httpMethod === 'POST') {
                const newUser = JSON.parse(body);
                // Validation
                if (!newUser.email || !newUser.name) {
                     return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Missing required fields" }) };
                }
                
                // If roleId provided, verify it exists
                if (newUser.roleId) {
                    const roleCheck = await docClient.get({ TableName: TABLE_NAME, Key: { id: newUser.roleId } }).promise();
                    if (!roleCheck.Item) {
                        return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Invalid Role ID" }) };
                    }
                }

                const item = {
                    id: newUser.id || AWS.util.uuid.v4(),
                    type: 'USER',
                    ...newUser,
                    createdAt: new Date().toISOString()
                };
                await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
                return { statusCode: 201, headers: headersResponse, body: JSON.stringify(item) };
            }

            if (httpMethod === 'PUT') {
                const updateUser = JSON.parse(body);
                if (!updateUser.id) return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "User ID required" }) };
                
                // Merge existing user with updates to avoid data loss on Overwrite
                const existing = await docClient.get({ TableName: TABLE_NAME, Key: { id: updateUser.id } }).promise();
                if (!existing.Item) return { statusCode: 404, headers: headersResponse, body: JSON.stringify({ message: "User not found" }) };

                const item = {
                    ...existing.Item,
                    ...updateUser,
                    updatedAt: new Date().toISOString()
                };
                await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
                return { statusCode: 200, headers: headersResponse, body: JSON.stringify(item) };
            }
        }

        return { statusCode: 400, headers: headersResponse, body: JSON.stringify({ message: "Invalid Endpoint" }) };

    } catch (err) {
        console.error(err);
        return { statusCode: 500, headers: headersResponse, body: JSON.stringify({ message: err.message }) };
    }
};
