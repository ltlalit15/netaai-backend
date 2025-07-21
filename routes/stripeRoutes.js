const express = require('express');
const router = express.Router();
const stripeController = require('../controller/stripeController');

router.post('/createStripePayment', stripeController.createStripePayment);


module.exports = router;
