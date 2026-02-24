# AWS Setup & Deployment Guide

This guide will help you set up the backend services on AWS and connect them to your React Dashboard.

## Prerequisites

- AWS Account
- Node.js installed locally
- Amplify CLI (optional, but recommended for advanced use)

## Step 1: AWS DynamoDB (Database)

1.  Go to the **DynamoDB Console**.
2.  Click **Create table**.
3.  **Table name**: `Users`
4.  **Partition key**: `id` (String).
5.  Leave everything else as default and create the table.

## Step 2: AWS Lambda (Backend Logic)

1.  Go to the **Lambda Console**.
2.  Click **Create function**.
3.  Select **Author from scratch**.
4.  **Function name**: `UserManagementFunction`
5.  **Runtime**: `Node.js 18.x` (or later).
6.  **Permissions**:
    - Click **Configuration** -> **Permissions** -> Click the Role name.
    - Add permissions to access DynamoDB (attach policy `AmazonDynamoDBFullAccess` or a custom inline policy for `Users` table).
7.  **Code**:
    - Copy the code from `backend/lambda/index.js` in this project.
    - Paste it into the Lambda code editor (`index.js`).
    - **Deploy** the changes.
8.  **Environment Variables**:
    - Go to **Configuration** -> **Environment variables**.
    - Add `TABLE_NAME` = `Users`.

## Step 3: AWS API Gateway (API Endpoint)

1.  Go to the **API Gateway Console**.
2.  Click **Create API** -> **REST API** (Build).
3.  **API Name**: `DashboardAPI`.
4.  **Create Resource**:
    - Actions -> Create Resource.
    - Resource Name: `users`.
    - Enable **Enable API Gateway CORS** (Check this!).
5.  **Create API Method (Users)**:
    - Select `/users` resource.
    - Actions -> Create Method -> `ANY` (or GET, POST, PUT, DELETE individually).
    - Integration type: **Lambda Function**.
    - Select your `UserManagementFunction`.
6.  **Create API Resource (Roles) - NEW**:
    - Select root `/`.
    - Create Resource -> Name: `roles`.
    - Enable CORS.
    - Create Method -> `ANY`.
    - Integration: Same `UserManagementFunction`.
7.  **Deploy API**:
    - Actions -> Deploy API.
    - Stage: `dev`.
    - **Note**: If you made changes, you MUST redeploy the API to the stage for them to take effect.

## Step 4: AWS Cognito (Authentication)

1.  Go to the **Cognito Console**.
2.  Click **Create user pool**.
3.  **Sign-in options**: Email.
4.  **Password policy**: Adjust as needed.
5.  **MFA**: Optional.
6.  **User attributes**: Add `name`, `phone_number`.
7.  **Create app client**:
    - App client name: `DashboardClient`.
    - Uncheck "Generate client secret" (for frontend use).
8.  **Review and Create**.
9.  **Users & Groups**:
    - Create a user `admin@admin.com`.
    - Create groups: `super_admin`, `admin`, `user`.
    - Add the user to `super_admin`.

## Step 5: Connect Frontend

1.  Open `frontend/src/App.tsx` (or config file).
2.  Update the API URL with your **API Gateway Invoke URL**.
3.  (Optional) Integrating Cognito:
    - Install `aws-amplify` (already done).
    - Configure Amplify in `index.tsx`:
      ```javascript
      import { Amplify } from "aws-amplify";
      Amplify.configure({
        Auth: {
          region: "us-east-1",
          userPoolId: "YOUR_USER_POOL_ID",
          userPoolWebClientId: "YOUR_APP_CLIENT_ID",
        },
        API: {
          endpoints: [
            {
              name: "DashboardAPI",
              endpoint: "YOUR_API_GATEWAY_URL",
            },
          ],
        },
      });
      ```

## Step 6: Deploy Frontend (AWS Amplify Hosting)

1.  Go to the **AWS Amplify Console**.
2.  Click **Host web app**.
3.  Connect to your Git repository (GitHub/GitLab/Bitbucket).
    - _Note: Push your code to a repository first._
4.  Select the **Frontend** folder as the base directory in build settings if asked.
    - Build command: `npm run build`
    - Output directory: `build`
5.  Click **Save and deploy**.

Your app is now live!
