const express = require('express');
const { StreamClient } = require('@stream-io/node-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

const apiKey = 'hnut54rtgksj';
const apiSecret = 'nr5pc64bjjdn6cbkycwdpv3qye9fsef54puhv7jjm3wqzhxk2fdurfhrsyb4gadx';

const client = new StreamClient(apiKey, apiSecret, { timeout: 3000 });

app.use(express.json());

// Merged endpoint to create user, generate token, and create call
app.post('/create-call', async (req, res) => {
    try {
        const userId = uuidv4(); // Generate a unique user ID
        const newUser = {
            id: userId,
            role: 'user',
            name: `User-${userId}`,
            image: 'link/to/profile/image',
            custom: { color: 'red' }
        };

        // Create user
        await client.upsertUsers([newUser]);

        const validityInSeconds = 60 * 60; // Token valid for 1 hour
        const token = client.generateUserToken({
            user_id: userId,
            validity_in_seconds: validityInSeconds
        });

        const callType = 'default';
        const callId = uuidv4(); // Generate a unique call ID
        const call = client.video.call(callType, callId);

        const members = [
            { user_id: userId, role: 'admin' },
            { user_id: 'jack' } // Example additional member
        ];
        const customData = { color: 'blue' };

        const callData = {
            data: {
                created_by_id: userId,
                members: members,
                custom: customData
            }
        };

        // Create call
        await call.create(callData);

        res.json({ userId, token, callId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
