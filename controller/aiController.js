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
    const state = "michigan";  // You can dynamically adjust this based on user state or predefined logic
    const year = "2023"; // This can also be dynamic based on the context, but for now, let's assume 2023
    const chapter = "3"; // Assuming wiring methods are in chapter 3
    return `https://up.codes/viewer/${state}/nfpa-70-${year}/chapter/${chapter}/wiring-methods-and-materials#${code}`;
  };

return {
  response: explanation,
  step_by_step: stepByStep.map(step => step.trim()).filter(step => step.length > 0),
  necReferences: necReferences
    .filter(ref => ref.description)  // Only keep references that have a description
    .map(ref => ({
      code: ref.code,
      description: ref.description || "No description available",
      link: generateNecLink(ref.code)
    })) // Corrected the semicolon issue here
};


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

// DeepSeekChat function
exports.deepSeekChat = async (req, res) => {
  const { message, userId, sessionId } = req.body;

  // Decode API Keys from base64 (you can improve this by using environment variables)
  const encodedYouTubeApiKey = "QUl6YVN5Q3AwYjJxRTZHUHhtMlFUUV9od3E0eDhrMzBoQ1d2T3Zr";
  const youtubeApiKey = Buffer.from(encodedYouTubeApiKey, "base64").toString("utf-8");
  const openaiApiKey = "c2stc3ZjYWNjdC1DUHR6Z2s2enYxOVZsSHFoOVBnQ1FfWnA1MFZmMWhoXzFfdElIVy1adlF1cmlyS3BVMDZ2X3RLY1JwRVBfQnJuRVpTZFpwZG5OaFQzQmxia0ZKUTR5a1ZPaGw2a21aTDBES2t0Q0RjeXFrSFJaeV9Qc1NCVHBzV3Y4eVN0eV9IaGFOYzBWdVY5VWtIUjFnVV8wWWFMVnRzQzRRc0E=";
  const decodedOpenAiKey = Buffer.from(openaiApiKey, 'base64').toString('utf-8');

  console.log("Decoded YouTube API Key:", youtubeApiKey);
  console.log("Decoded OpenAI API Key:", decodedOpenAiKey);

  // Check for valid input
  if (!message || !userId) {
    console.log('Missing message or userId');
    return res.status(400).json({ message: 'Missing message or userId' });
  }

  let currentSessionId = sessionId;

  try {
    // If session ID is not provided, create a new session
    if (!currentSessionId) {
      const title = `Chat on ${new Date().toLocaleString()}`;
      const [result] = await db.query(
        "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
        [userId, title]
      );
      currentSessionId = result.insertId;
      console.log('Created new chat session with ID:', currentSessionId);
    }

    // Save user message to chat_history
    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'user', message, currentSessionId]
    );
    console.log('Saved user message to DB');

    // Call OpenAI API for response
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that, when asked about electrical topics, provides an explanation and includes relevant NEC code references and links. " +
              "Respond ONLY in JSON format: { \"explanation\": string, \"nec_references\": [{ \"code\": string, \"link\": string }] }"
          },
          { role: "user", content: message }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${decodedOpenAiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const rawContent = openaiRes.data.choices[0].message.content;
    console.log("Raw AI response:", rawContent);

    let explanation = "";
    let stepByStep = "";
    let necReferences = [];
     let confidence = 1.0;
    try {
      const parsed = JSON.parse(rawContent);
      explanation = parsed.explanation || rawContent;
      stepByStep = parsed.step_by_step || "";
      necReferences = Array.isArray(parsed.nec_references) ? parsed.nec_references : [];
      console.log("Parsed NEC References:", necReferences);
       // Map each NEC reference to include the dynamically generated link
      necReferences = necReferences.map(ref => ({
        code: ref.code,
        description: ref.description,
        link: `https://up.codes/viewer/michigan/nfpa-70-2023/chapter/3/wiring-methods-and-materials#${ref.code}`
      }));
      
    } catch (e) {
      explanation = rawContent;
      stepByStep = "";
      necReferences = [];
    }

    // Format the explanation into a step-by-step breakdown
    const stepByStepFormatted = explanation.split("\n").map(step => {
      if (step.trim() === "") return null;
      return `• ${step.trim()}`;  // Add bullet points
    }).filter(Boolean);

    // Save AI reply to DB
    await db.query(
      `INSERT INTO chat_history (user_id, role, content, session_id) VALUES (?, ?, ?, ?)`,
      [userId, 'assistant', explanation, currentSessionId]
    );
    console.log('Saved AI reply to DB');

    // Fetch YouTube videos related to the query
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

    console.log("Videos prepared for response:", videos);

    // Return the structured response as JSON using the formatResponse function
    res.json(formatResponse(explanation, stepByStepFormatted, necReferences, videos));

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



// feedback code
exports.submitFeedback = async (req, res) => {
  const { responseId, feedback, reason } = req.body;

  // Basic validation
  if (!responseId || !feedback) {
    return res.status(400).json({ message: 'Missing responseId or feedback' });
  }

  try {
    // Insert feedback into the database
    await db.query(
      "INSERT INTO chat_feedback (response_id, feedback, reason) VALUES (?, ?, ?)",
      [responseId, feedback, reason || null]  // Use null if reason is not provided
    );

    // Send a response to the client
    res.json({ message: 'Feedback received successfully' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ message: 'Error saving feedback' });
  }
};



