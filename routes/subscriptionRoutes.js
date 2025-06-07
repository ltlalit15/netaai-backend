const express = require('express');
const router = express.Router();
const subscriptionsPlanController = require('../controller/subscriptionsPlanController');

// Subscription Plan CRUD routes
router.post('/create-subscription-plan', subscriptionsPlanController.createSubscriptionPlan);
router.get('/subscription-plans', subscriptionsPlanController.getAllSubscriptionPlans);
router.get('/subscription-plan/:planId', subscriptionsPlanController.getSubscriptionPlanById);
router.put('/subscription-plan/:planId', subscriptionsPlanController.updateSubscriptionPlan);
router.delete('/subscription-plan/:planId', subscriptionsPlanController.deleteSubscriptionPlan);

module.exports = router;
