const express = require('express');
const router = express.Router();
const aiController = require('../controller/aiController');

router.post('/chat', aiController.deepSeekChat);
router.get('/history/:userId', aiController.getHistory);

// chat session routes ------->
router.post('/sessions', aiController.createSession);
router.get('/sessions/:userId', aiController.getSessions);
router.get('/session/:sessionId/messages', aiController.getSessionMessages);
router.delete('/session/:sessionId', aiController.deleteSession);


// Route to submit feedback
router.post('/submit-feedback', aiController.submitFeedback)
router.get('/feedback', aiController.getAllFeedback)




module.exports = router;
