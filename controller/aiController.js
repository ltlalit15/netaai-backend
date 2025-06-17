const axios = require('axios');
const db = require('../config');

require('dotenv').config();


const formatResponse = (explanation, stepByStep, necReferences, videos) => {
  const generateNecLink = (code) => {
    const state = "michigan";
    const year = "2023";
    const chapter = "3";
    return `https://up.codes/viewer/${state}/nfpa-70-${year}/chapter/${chapter}/wiring-methods-and-materials#${code}`;
  };

  return {
    response: explanation,
    step_by_step: stepByStep.map(step => step.trim()).filter(step => step.length > 0),
    nec_references: necReferences.map(ref => ({
      code: ref.code,
      link: generateNecLink(ref.code),
      description: ref.description || "No description available"
    })),
    videos: videos.map(video => ({
      videoId: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      url: video.url
    })),
    // model_used: "gpt-4o"
  };
};

// Extractor function
function extractJsonBlock(text) {
  try {
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("JSON extraction failed:", e.message);
    return null;
  }
}

exports.deepSeekChat = async (req, res) => {
  const { message, userId, sessionId } = req.body;

  if (!message) return res.status(400).json({ message: 'Missing message' });
  if (!userId) return res.status(400).json({ message: 'Missing userId' });

  let currentSessionId = sessionId;

  try {
    if (!currentSessionId) {
      const title = message.substring(0, 30);
      const [result] = await db.query(
        "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
        [userId, title]
      );
      currentSessionId = result.insertId;
    }

    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'user', message, currentSessionId]
    );

    const messages = [
      {
        role: "system",
        content: `
You are a helpful electrical code assistant. You must always reply in STRICT valid JSON format.

Return this structure:

{
  "explanation": string, 
  "step_by_step": array of strings, 
  "nec_references": [
      { "code": string, "link": string, "description": string }
  ],
  "video_search_query": string
}

- "video_search_query" should be precise YouTube search keywords to find instructional NEC related electrical videos.
- Do not invent YouTube links.
- Your response will be directly parsed as JSON.
`
      },
      { role: "user", content: message }
    ];
    const OPENAI_API_KEY="c2stcHJvai1EdVE3Q08yRTdvdVhYN0dSa2Y0eWxrNmpLczVqYlRDLXJycGZSX1JldllaM05LR1V4ZkVFOGQtWkNqeUtMaVAwQTRQam56eThvWVQzQmxia0ZKMVdDbkcwLXh0RkVqU1BVenV0azNDT2lwLXl6cEVUWmE3cVpMQkFXYXpVaWpDX2ZWaDNwUkFkVzFZMWtuWWRBUkNSQ3ByOHpJNEE="
    const decodedKey = Buffer.from(OPENAI_API_KEY, 'base64').toString('utf8');
     console.log(decodedKey);

    const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o", // recommend gpt-4o for better search queries
      messages: messages,
      max_tokens: 1024
    }, {
      headers: {
        Authorization: `Bearer ${decodedKey}`,
        'Content-Type': 'application/json',
      }
    });

    const rawContent = openaiRes.data.choices[0].message.content;
    const extracted = extractJsonBlock(rawContent);
    const parsed = extracted || JSON.parse(rawContent);

    const explanation = parsed.explanation;
    let stepByStep = parsed.step_by_step || [];
    const necReferences = parsed.nec_references || [];
    const searchQuery = parsed.video_search_query;

    if (typeof stepByStep === "string") {
      stepByStep = stepByStep.split("\n").map(s => s.trim()).filter(Boolean);
    }

    // Normalize NEC links
    const normalizedNecRefs = necReferences.map(ref => ({
      code: ref.code,
      description: ref.description || "No description available",
      link: `https://up.codes/viewer/michigan/nfpa-70-2023/chapter/3/wiring-methods-and-materials#${ref.code}`
    }));

    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'assistant', explanation, currentSessionId]
    );

    let videos = [];
    if (searchQuery) {
      try {
        // YouTube API Key (Base64 Encoded)
        const YOUTUBE_API_KEY = "QUl6YVN5QndIYzBDVXU5dGY2NFJrV3lpVWRtaGZxYnp1NWVlS1k4";
        const decodedYoutubeKey = Buffer.from(YOUTUBE_API_KEY, 'base64').toString('utf8');
        const youtubeApiKey = decodedYoutubeKey;
        const youtubeRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            key: youtubeApiKey,
            q: searchQuery,
            part: 'snippet',
            maxResults: 3,
            type: 'video',
            videoEmbeddable: 'true',
            safeSearch: 'strict',
            videoCategoryId: '27'
          }
        });

        // Filter results by title/content manually if needed
        videos = youtubeRes.data.items
          .filter(item => (
            item.snippet.title.toLowerCase().includes("electrical") ||
            item.snippet.title.toLowerCase().includes("wiring") ||
            item.snippet.title.toLowerCase().includes("nec")
          ))
          .map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }));

        // If no good video match found, empty array
        if (videos.length === 0) videos = [];

      } catch (ytErr) {
        console.error("YouTube API error:", ytErr.response?.data || ytErr.message);
        videos = [];
      }
    }

    res.json(formatResponse(explanation, stepByStep, normalizedNecRefs, videos));

  } catch (err) {
    console.error("Error in deepSeekChat:", err.response?.data || err.message);
    res.status(500).json({ message: 'AI error' });
  }
};









// Helper function to create HTML content
const explanationToHTML = (explanation, stepByStep, necReferences) => {
  let refLinks = necReferences.map(ref =>
    `<li><strong>${ref.code}</strong> - <a href="${ref.link}" target="_blank">${ref.link}</a></li>`
  ).join("");

  let finalHTML = `
    <h3>Summary</h3>
    <p>${explanation}</p>

    <h4>Step-by-Step Breakdown</h4>
    <p>${stepByStep}</p>

    <h4>Relevant NEC Codes</h4>
    <ul>${refLinks}</ul>
  `;

  return finalHTML;
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
// Delete chat session and its history
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Step 1: Delete associated chat history for the session
    await db.query("DELETE FROM chat_history WHERE session_id = ?", [sessionId]);

    // Step 2: Delete the chat session itself
    const [result] = await db.query("DELETE FROM chat_sessions WHERE id = ?", [sessionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.submitFeedback = async (req, res) => {
  const { responseId, feedback, reason, user_id, question } = req.body;

  // Basic validation
  if (!responseId || !feedback || !user_id || !question) {
    return res.status(400).json({ message: 'Missing responseId, feedback, user_id, or question' });
  }

  try {
    // Insert feedback into the database, now including user_id and question
    await db.query(
      "INSERT INTO chat_feedback (response_id, feedback, reason, user_id, question) VALUES (?, ?, ?, ?, ?)",
      [responseId, feedback, reason || null, user_id, question]  // Use null for reason if not provided
    );

    // Send a response to the client
    res.json({ message: 'Feedback received successfully' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ message: 'Error saving feedback' });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    // Fetch all feedback from the database
    // const [feedbacks] = await db.query("SELECT * FROM chat_feedback");
    const [feedbacks] = await db.query(`
      SELECT 
        f.*, 
        u.email
      FROM chat_feedback f
      JOIN users u ON f.user_Id = u.id
    `);
    // Check if no feedback is found
    if (feedbacks.length === 0) {
      return res.status(404).json({ message: 'No feedback found' });
    }

    // Send the feedback data in the response
    res.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
};
