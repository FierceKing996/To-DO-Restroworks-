require('dotenv').config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const emailService = require('./service/emailService');
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

async function pollQueue() {
    console.log("🚀 Worker started. Listening for Admin Requests on SQS...");

    while (true) {
        try {
            const command = new ReceiveMessageCommand({
                QueueUrl: QUEUE_URL,
                MaxNumberOfMessages: 1, // Process one at a time for safety
                WaitTimeSeconds: 20,    // Long polling (keeps connection open, saves AWS costs)
            });

            const { Messages } = await sqsClient.send(command);

            if (Messages && Messages.length > 0) {
                for (const message of Messages) {
                    const body = JSON.parse(message.Body);

                    // Only process our specific action
                    if (body.action === 'ADMIN_REQUEST') {
                        const { username, email, userId } = body.user;
                        
                        console.log(`\n🔔 NEW ADMIN REQUEST RECEIVED!`);
                        console.log(`User: ${username} (${email})`);
                        console.log(`ID: ${userId}`);
                        
                        await emailService.sendSuperAdminAlert(body.user);
                    }

                    // ⚡ CRITICAL: Delete the message so it doesn't process twice
                    const deleteCommand = new DeleteMessageCommand({
                        QueueUrl: QUEUE_URL,
                        ReceiptHandle: message.ReceiptHandle
                    });
                    await sqsClient.send(deleteCommand);
                    console.log("✅ Message processed and deleted from queue.");
                }
            }
        } catch (error) {
            console.error("Worker Polling Error:", error);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Pause on error to prevent spam
        }
    }
}

pollQueue();