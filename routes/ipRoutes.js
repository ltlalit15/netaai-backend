const express = require('express');
const router = express.Router();
const ipController = require('../controller/ipcontroller');

router.post('/check-ip', ipController.checkAndSaveIp);
router.post('/increase-chat', ipController.increaseChatCount);
module.exports = router;
