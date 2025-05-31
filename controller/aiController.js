const axios = require('axios');
// const db = require('../config/db');
const db = require('../config');

require('dotenv').config();

exports.createChatTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255),
      role VARCHAR(10),
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

exports.deepSeekChat = async (req, res) => {
  const { message, userId } = req.body;

  if (!message || !userId) return res.status(400).json({ message: 'Missing message or userId' });

  try {
    // Save user message
    await db.query(`INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)`, [userId, 'user', message]);

    // Call OpenAI
    const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    }, {
      headers: {
        Authorization: `Bearer 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`,
        'Content-Type': 'application/json',
      }
    });

    const aiReply = openaiRes.data.choices[0].message.content;

    // Save AI reply
    await db.query(`INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)`, [userId, 'assistant', aiReply]);

    res.json({ reply: aiReply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: 'AI error' });
  }
};

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

  if (!message || !userId) return res.status(400).json({ message: 'Missing message or userId' });

  let currentSessionId = sessionId;

  try {
    // Create new session if no sessionId provided
    if (!currentSessionId) {
      const title = `Chat on ${new Date().toLocaleString()}`;
      const [result] = await db.query(
        "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
        [userId, title]
      );
      currentSessionId = result.insertId;
    }

    // Save user message linked to session
    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'user', message, currentSessionId]
    );

    // Call OpenAI
    const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const aiReply = openaiRes.data.choices[0].message.content;

    // Save AI reply linked to session
    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'assistant', aiReply, currentSessionId]
    );

    res.json({ reply: aiReply, sessionId: currentSessionId });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: 'AI error' });
  }
};

