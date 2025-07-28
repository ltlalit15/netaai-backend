const express = require('express');
const router = express.Router();
const mergeController = require('../controller/mergeController');

router.post('/mergeArticlePDFs', mergeController.mergeArticlePDFs);

module.exports = router;
