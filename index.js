const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const { Stream } = require('getstream');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stream client
const client = new Stream({
  apiKey: process.env.STREAM_API_KEY,
  apiSecret: process.env.STREAM_API_SECRET,
  timeout: 3000, // Timeout in ms for API requests
});

// Middleware to parse JSON requests
app.use(express.json());

// Create a new video call
app.post('/create-call', async (req, res) => {
  const userId = uuidv4();  // Generate a unique user ID for the host
  const callId = uuidv4();  // Generate a unique call ID
  
  try {
    // Create a user in the Stream system
    const user = {
      id: userId, 
      role: 'user', // Default role is 'user', adjust based on your needs
    };
    await client.upsertUsers([user]);  // Upsert user to the Stream database
    
    // Generate a token for the user to join the call
    const token = client.generateUserToken({
      user_id: userId,
      validity_in_seconds: 60 * 60, // Token validity (1 hour)
    });

    // Create a new call with the specified ID and settings
    const call = client.video.call('default', callId);
    await call.create({
      data: {
        created_by_id: userId,
        members: [{ user_id: userId, role: 'admin' }], // Adding the user as the admin
        custom: { color: 'blue' }, // Optional custom data
      },
    });

    // Respond with the call ID, user ID, and token
    res.status(200).json({
      userId,
      callId,
      token,
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Endpoint to join a call (server generates userId here)
app.post('/join-call', async (req, res) => {
  const { callId } = req.body;

  // Generate a unique user ID for the participant
  const userId = uuidv4();
  
  try {
    // Create the user in the Stream system
    const user = {
      id: userId,
      role: 'user', // Default role is 'user', adjust as needed
    };
    await client.upsertUsers([user]);

    // Generate a token for the user to join the call
    const token = client.generateUserToken({
      user_id: userId,
      validity_in_seconds: 60 * 60, // Token validity (1 hour)
    });

    // Optionally, add the user to the call as a member
    const call = client.video.call('default', callId);
    await call.updateCallMembers({
      update_members: [{ user_id: userId }],
    });

    res.status(200).json({
      message: 'Joined call successfully',
      userId,  // Return the generated userId
      token,   // Return the token for the user to join the call
    });
  } catch (error) {
    console.error('Error joining call:', error);
    res.status(500).json({ error: 'Failed to join call' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
