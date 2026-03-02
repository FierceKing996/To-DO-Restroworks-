require('dotenv').config();



const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
// Initialize the SQS Client using the keys from your .env
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

exports.sendAdminRequest = async (userData) => {
    try {
        const command = new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
                action: 'ADMIN_REQUEST',
                user: userData,
                timestamp: new Date().toISOString()
            })
        });

        const response = await sqsClient.send(command);
        console.log("✅ Admin request queued successfully. MessageId:", response.MessageId);
        return response;
    } catch (error) {
        console.error("❌ SQS Send Error:", error);
        throw error; 
    }
};