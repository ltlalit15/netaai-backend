const axios = require('axios');
// const db = require('../config/db');
const db = require('../config');

require('dotenv').config();




exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await db.query('SELECT role, content, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at ASC', [userId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
// chat session code -------->
// Create new chat session
exports.createSession = async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const [result] = await db.query(
      "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
      [userId, title || "New Chat"]
    );

    res.json({ sessionId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all chat sessions for a user (to list on left sidebar)
exports.getSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const [sessions] = await db.query(
      "SELECT id, title, created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get chat messages for a session
exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ message: "sessionId required" });

    const [messages] = await db.query(
      "SELECT role, content, created_at FROM chat_history WHERE session_id = ? ORDER BY created_at ASC",
      [sessionId]
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Updated chat endpoint to accept sessionId
exports.deepSeekChat = async (req, res) => {
  const { message, userId, sessionId } = req.body;

  console.log('Received deepSeekChat request:', { message, userId, sessionId });

  const openaiApiKey ="c2stc3ZjYWNjdC1DUHR6Z2s2enYxOVZsSHFoOVBnQ1FfWnA1MFZmMWhoXzFfdElIVy1adlF1cmlyS3BVMDZ2X3RLY1JwRVBfQnJuRVpTZFpwZG5OaFQzQmxia0ZKUTR5a1ZPaGw2a21aTDBES2t0Q0RjeXFrSFJaeV9Qc1NCVHBzV3Y4eVN0eV9IaGFOYzBWdVY5VWtIUjFnVV8wWWFMVnRzQzRRc0E=";

  const decoded = Buffer.from(openaiApiKey, 'base64').toString('utf-8');
  console.log(decoded,'OPENAI_API_KEY found.');

  if (!message || !userId) {
    console.log('Missing message or userId');
    return res.status(400).json({ message: 'Missing message or userId' });
  }

  let currentSessionId = sessionId;

  try {
    // Create session if not exists
    if (!currentSessionId) {
      const title = `Chat on ${new Date().toLocaleString()}`;
      const [result] = await db.query(
        "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
        [userId, title]
      );
      currentSessionId = result.insertId;
      console.log('Created new chat session with ID:', currentSessionId);
    }

    // Save user message
    await db.query(
      "INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)",
      [userId, 'user', message, currentSessionId]
    );
    console.log('Saved user message to DB');

    // Call OpenAI API
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${decoded}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('OpenAI API response received');

    const aiReply = openaiRes.data.choices[0].message.content;

    // Save AI reply
    await db.query(
      "INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)",
      [userId, 'assistant', aiReply, currentSessionId]
    );
    console.log('Saved AI reply to DB');

    res.json({ reply: aiReply, sessionId: currentSessionId });

  } catch (err) {
    console.error('Error in deepSeekChat:', err.response?.data || err.message);
    res.status(500).json({ message: 'AI error', error: err.response?.data || err.message });
  }
};



