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




module.exports = router;
