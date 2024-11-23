const express = require('express');
const { StreamClient } = require('@stream-io/node-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

const apiKey = 'hnut54rtgksj'; // Replace with your actual API key
const apiSecret = 'nr5pc64bjjdn6cbkycwdpv3qye9fsef54puhv7jjm3wqzhxk2fdurfhrsyb4gadx'; // Replace with your actual API secret

const client = new StreamClient(apiKey, apiSecret, { timeout: 3000 });

app.use(express.json());

let scheduledMeetings = []; // In-memory array to store scheduled meetings

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
        const callId = `channel_${Math.floor(10000 + Math.random() * 90000)}`;
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

// Merged endpoint to create user, generate token, and create livestream
app.post('/create-livestream', async (req, res) => {
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

        const callType = 'livestream';
        const callId = `channel_${Math.floor(10000 + Math.random() * 90000)}`;
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

        // Set the call live
        await call.goLive({ start_hls: true, start_recording: true });

        res.json({ userId, token, callId });
    } catch (error) {
        console.error('Error creating livestream:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to join a call with new user ID
app.post('/join-call', async (req, res) => {
    try {
        const { callId } = req.body;
        if (!callId) {
            return res.status(400).json({ error: 'Call ID is required' });
        }

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
        const call = client.video.call('default', callId); // Ensure 'default' is the correct call type
        await call.updateCallMembers({
            update_members: [{ user_id: userId, role: 'user' }]
        });

        res.json({ success: true, callId, userId, token });
    } catch (error) {
        console.error('Error joining call:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Endpoint to join a live stream with new user ID
app.post('/join-livestream', async (req, res) => {
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
        const call = client.video.call('livestream', callId);
        await call.updateCallMembers({
            update_members: [{ user_id: userId, role: 'user' }]
        });

        res.json({ callId, userId, token });
    } catch (error) {
        console.error('Error joining live stream:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to schedule a video call
app.post('/schedule-meeting', async (req, res) => {
    try {
        const { date } = req.body; // Expect date input from the client
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

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
        const callId = `channel_${Math.floor(10000 + Math.random() * 90000)}`;
        const call = client.video.call(callType, callId);

        const members = [
            { user_id: userId, role: 'admin' }
        ];
        const customData = { color: 'blue', scheduledDate: date };

        const callData = {
            data: {
                created_by_id: userId,
                members: members,
                custom: customData
            }
        };

        // Create call
        await call.create(callData);

        // Store the scheduled meeting in the in-memory array
        scheduledMeetings.push({ callId, scheduledDate: date });

        res.json({ userId, token, callId, scheduledDate: date });
    } catch (error) {
        console.error('Error scheduling meeting:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to retrieve all scheduled meetings
app.get('/scheduled-meetings', (req, res) => {
    res.json(scheduledMeetings);
});

// Endpoint to delete a scheduled meeting
app.delete('/delete-meeting', (req, res) => {
    try {
        const { callId } = req.body;
        if (!callId) {
            return res.status(400).json({ error: 'Call ID is required' });
        }

        // Filter out the meeting with the given callId
        scheduledMeetings = scheduledMeetings.filter(meeting => meeting.callId !== callId);

        res.json({ success: true, message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
