const express = require('express');
const { StreamClient } = require('@stream-io/node-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

const apiKey = 'hnut54rtgksj';
const apiSecret = 'nr5pc64bjjdn6cbkycwdpv3qye9fsef54puhv7jjm3wqzhxk2fdurfhrsyb4gadx';

const client = new StreamClient(apiKey, apiSecret, { timeout: 3000 });

app.use(express.json());

// Endpoint to create user and generate token
app.post('/generate-token', async (req, res) => {
    try {
        const userId = uuidv4(); // Create a unique user ID
        const newUser = {
            id: userId,
            role: 'user',
            name: `User-${userId}`,
            image: 'link/to/profile/image',
            custom: { color: 'red' }
        };

        await client.upsertUsers([newUser]);

        const validityInSeconds = 60 * 60; // Token valid for 1 hour
        const token = client.generateUserToken({
            user_id: userId,
            validity_in_seconds: validityInSeconds
        });

        res.json({ userId, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to create a call
app.post('/create-call', async (req, res) => {
    try {
        const { userId } = req.body;

        const callType = 'default';
        const callId = uuidv4();
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

        await call.create(callData);
        res.json({ callId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to join a call
app.post('/join-call', async (req, res) => {
    try {
        const { callId, userId } = req.body;

        // Generate a token for the user
        const validityInSeconds = 60 * 60; // Token valid for 1 hour
        const token = client.generateUserToken({
            user_id: userId,
            validity_in_seconds: validityInSeconds
        });

        // Add the user to the call
        const call = client.video.call('default', callId);
        await call.updateCallMembers({
            update_members: [{ user_id: userId, role: 'user' }]
        });

        res.json({ callId, userId, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
