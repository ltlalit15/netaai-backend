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

// old code 
// Get chat messages for a session
// exports.deepSeekChat = async (req, res) => {
//   const { message, userId, sessionId } = req.body;

//   // Your base64 encoded YouTube API key
//   const encodedYouTubeApiKey = "QUl6YVN5Q3AwYjJxRTZHUHhtMlFUUV9od3E0eDhrMzBoQ1d2T3Zr";
//   const youtubeApiKey = Buffer.from(encodedYouTubeApiKey, "base64").toString("utf-8");
//   console.log("Decoded YouTube API Key:", youtubeApiKey);

//   // Your base64 encoded OpenAI API key
//   const openaiApiKey = "c2stc3ZjYWNjdC1DUHR6Z2s2enYxOVZsSHFoOVBnQ1FfWnA1MFZmMWhoXzFfdElIVy1adlF1cmlyS3BVMDZ2X3RLY1JwRVBfQnJuRVpTZFpwZG5OaFQzQmxia0ZKUTR5a1ZPaGw2a21aTDBES2t0Q0RjeXFrSFJaeV9Qc1NCVHBzV3Y4eVN0eV9IaGFOYzBWdVY5VWtIUjFnVV8wWWFMVnRzQzRRc0E=";
//   const decodedOpenAiKey = Buffer.from(openaiApiKey, 'base64').toString('utf-8');
//   console.log(decodedOpenAiKey, 'OPENAI_API_KEY found.');

//   if (!message || !userId) {
//     console.log('Missing message or userId');
//     return res.status(400).json({ message: 'Missing message or userId' });
//   }

//   let currentSessionId = sessionId;

//   try {
//     if (!currentSessionId) {
//       const title = `Chat on ${new Date().toLocaleString()}`;
//       const [result] = await db.query(
//         "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
//         [userId, title]
//       );
//       currentSessionId = result.insertId;
//       console.log('Created new chat session with ID:', currentSessionId);
//     }

//     // Save user message
//     await db.query(
//       `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
//       [userId, 'user', message, currentSessionId]
//     );
//     console.log('Saved user message to DB');

//     // Call OpenAI API
//     const openaiRes = await axios.post(
//       'https://api.openai.com/v1/chat/completions',
//       {
//         model: "gpt-3.5-turbo",
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are a helpful assistant that, when asked about electrical topics, provides an explanation and includes relevant NEC code references and links. " +
//               "Respond ONLY in JSON format: { \"explanation\": string, \"nec_references\": [{ \"code\": string, \"link\": string }] }"
//           },
//           { role: "user", content: message }
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${decodedOpenAiKey}`,
//           'Content-Type': 'application/json',
//         }
//       }
//     );

//     const rawContent = openaiRes.data.choices[0].message.content;
//     console.log("Raw AI response:", rawContent);

//     let explanation = "";
//     let necReferences = [];
//     try {
//       const parsed = JSON.parse(rawContent);
//       explanation = parsed.explanation || "";
//       necReferences = Array.isArray(parsed.nec_references) ? parsed.nec_references : [];
//     } catch (e) {
//       explanation = rawContent;
//       necReferences = [];
//     }

//     // Save AI reply
//     await db.query(
//       `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
//       [userId, 'assistant', explanation, currentSessionId]
//     );
//     console.log('Saved AI reply to DB');

//     // Fetch YouTube videos
//     let videos = [];
//     try {
//       const youtubeRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
//         params: {
//           key: youtubeApiKey,
//           q: message,
//           part: 'snippet',
//           maxResults: 2,
//           type: 'video',
//           videoEmbeddable: 'true',
//           safeSearch: 'moderate',
//         }
//       });

//       videos = youtubeRes.data.items.map(item => ({
//         videoId: item.id.videoId,
//         title: item.snippet.title,
//         description: item.snippet.description,
//         thumbnail: item.snippet.thumbnails.medium.url,
//         url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
//       }));
//     } catch (ytErr) {
//       console.error("YouTube API error:", ytErr.response?.data || ytErr.message);
//     }

//     console.log("Videos prepared for response:", videos);

//     res.json({
//       reply: explanation,
//       necReferences,
//       sessionId: currentSessionId,
//       videos,
//     });

//   } catch (err) {
//     console.error("Error in deepSeekChat:", err.response?.data || err.message);
//     res.status(500).json({ message: 'AI or YouTube API error', error: err.response?.data || err.message });
//   }
// };

// new code   

// Function to format the response
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
    model_used: "gpt-3.5-turbo"
  };
};

// ✅ This is your only extractor function now
 function extractJsonBlock(text) {
  try {
    // ✅ First remove any markdown code blocks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // ✅ Then extract first JSON block
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) return null;

    // ✅ Parse clean JSON block
    return JSON.parse(jsonMatch[0]);

  } catch (e) {
    console.error("JSON extraction failed:", e.message);
    return null;
  }
}


// DeepSeekChat function (Fully Updated)
exports.deepSeekChat = async (req, res) => {
  const { message, userId, sessionId, imageUrl } = req.body;

  // Decode API Keys from base64 (should ideally be in env variables)
  const encodedYouTubeApiKey = "QUl6YVN5QndIYzBDVXU5dGY2NFJrV3lpVWRtaGZxYnp1NWVlS1k4";
  const youtubeApiKey = Buffer.from(encodedYouTubeApiKey, "base64").toString("utf-8");

  const openaiApiKey = "c2stcHJvai1EdVE3Q08yRTdvdVhYN0dSa2Y0eWxrNmpLczVqYlRDLXJycGZSX1JldllaM05LR1V4ZkVFOGQtWkNqeUtMaVAwQTRQam56eThvWVQzQmxia0ZKMVdDbkcwLXh0RkVqU1BVenV0azNDT2lwLXl6cEVUWmE3cVpMQkFXYXpVaWpDX2ZWaDNwUkFkVzFZMWtuWWRBUkNSQ3ByOHpJNEE=";
  const decodedOpenAiKey = Buffer.from(openaiApiKey, 'base64').toString('utf-8');

  // Check for valid input
  if (!message || !userId) {
    return res.status(400).json({ message: 'Missing message or userId' });
  }

  let currentSessionId = sessionId;

  try {
    // If session ID is not provided, create a new session
    if (!currentSessionId) {
      const title = message.substring(0, 30);
      const [result] = await db.query(
        "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
        [userId, title]
      );
      currentSessionId = result.insertId;
    }

    // Save user message to chat_history
    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'user', message, currentSessionId]
    );

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `
You are a helpful electrical code assistant. You must always reply in STRICT valid JSON format, without any text or explanation outside the JSON block.

Respond only in this exact structure:

{
  "explanation": string, 
  "step_by_step": array of strings, 
  "nec_references": [
      { 
        "code": string, 
        "link": string, 
        "description": string 
      }
  ]
}

- Do not return any markdown, headings, code blocks or text before or after JSON.
- Do not escape or stringify the JSON.
- Do not wrap JSON inside quotes.
- Do not embed JSON inside another string.
- This output will be directly parsed as JSON — strictly follow format.
        `
      }
    ];

    if (message) {
      messages.push({ role: "user", content: message });
    }

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      });
    }

    // Call OpenAI API
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",  // Highly recommended to use gpt-4o for image + text
        messages: messages
      },
      {
        headers: {
          Authorization: `Bearer ${decodedOpenAiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const rawContent = openaiRes.data.choices[0].message.content;

    let explanation = "", stepByStep = [], necReferences = [];

    try {
      const parsed = JSON.parse(rawContent);
      explanation = parsed.explanation || "";
      stepByStep = parsed.step_by_step || [];
      necReferences = Array.isArray(parsed.nec_references) ? parsed.nec_references : [];

      // Generate NEC reference links dynamically
      necReferences = necReferences.map(ref => ({
        code: ref.code,
        description: ref.description,
        link: `https://up.codes/viewer/michigan/nfpa-70-2023/chapter/3/wiring-methods-and-materials#${ref.code}`
      }));

    } catch (err) {
      console.error("Parsing error:", err);
      return res.status(500).json({ message: "AI response format error", error: err.message });
    }

    // Save AI reply to DB
    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'assistant', explanation, currentSessionId]
    );

    // Fetch YouTube videos
    let videos = [];
    try {
      const youtubeRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: youtubeApiKey,
          q: message,
          part: 'snippet',
          maxResults: 3,
          type: 'video',
          videoEmbeddable: 'true',
          safeSearch: 'moderate',
        }
      });

      videos = youtubeRes.data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    } catch (ytErr) {
      console.error("YouTube API error:", ytErr.response?.data || ytErr.message);
    }

    // Prepare final response
    const response = {
      explanation: explanation,
      step_by_step: stepByStep,
      nec_references: necReferences,
      videos: videos
    };

    res.json(response);

  } catch (err) {
    console.error("Error in deepSeekChat:", err.response?.data || err.message);
    res.status(500).json({ message: 'AI or YouTube API error', error: err.response?.data || err.message });
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



