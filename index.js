const express = require('express');
const { StreamClient } = require('@stream-io/node-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

const apiKey = 'hnut54rtgksj'; // Replace with your actual API key
const apiSecret = 'nr5pc64bjjdn6cbkycwdpv3qye9fsef54puhv7jjm3wqzhxk2fdurfhrsyb4gadx'; // Replace with your actual API secret

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
            { user_id: userId, role: 'admin' }
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
        console.error('Error creating call:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to join a call with new user ID
app.post('/join-call', async (req, res) => {
    try {
        const { callId } = req.body;
        const userId = uuidv4(); // Generate a unique user ID

        // Create a new user
        const newUser = {
            id: userId,
            role: 'user',
            name: `User-${userId}`,
            image: 'link/to/profile/image',
            custom: { color: 'green' }
        };

        await client.upsertUsers([newUser]);

        // Generate a token for the new user
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
        console.error('Error joining call:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
