const express = require('express');
const router = express.Router();
const necController = require('../controller/necController');

router.post('/filterNecCodeAndCopyPages', necController.filterNecCodeAndCopyPages);


module.exports = router;
