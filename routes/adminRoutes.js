const express = require('express');
const { 
    getAllUsersWithAnalytics,
    getUserProfile,
    updateUser,
    createUser,
    compUserAccess
} = require('../controller/adminController');

const {
    getUserAnalytics,
    getGlobalAnalytics,
    generateReport,
    exportUserData
} = require('../controller/adminAnalyticsController');

const {
    addAdminNote,
    flagUser,
    sendNotification,
    getAdminActivityLog,
    deactivateUser,
    reactivateUser
} = require('../controller/adminFeaturesController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// User Management Routes
router.get('/users',  authMiddleware, getAllUsersWithAnalytics);
router.get('/users/:id', authMiddleware, getUserProfile);
router.patch('/users/:id', authMiddleware, updateUser);
router.post('/users', authMiddleware, adminMiddleware, createUser);
router.post('/users/:id/comp-access', authMiddleware, adminMiddleware, compUserAccess);
router.post('/users/:id/deactivate', authMiddleware, adminMiddleware, deactivateUser);
router.post('/users/:id/reactivate', authMiddleware, adminMiddleware, reactivateUser);

// Analytics Routes
 router.get('/analytics/user/:id', authMiddleware, adminMiddleware, getUserAnalytics);
 router.get('/analytics/global', authMiddleware, adminMiddleware, getGlobalAnalytics);

// Reports Routes
router.get('/reports/:type', authMiddleware, adminMiddleware, generateReport);
router.get('/export/users', authMiddleware, adminMiddleware, exportUserData);

// User Management Features
router.post('/users/:id/notes', authMiddleware, adminMiddleware, addAdminNote);
router.post('/users/:id/flag', authMiddleware, adminMiddleware, flagUser);
router.post('/users/:id/notify', authMiddleware, adminMiddleware, sendNotification);

// Admin Activity Log
router.get('/activity-log', authMiddleware, adminMiddleware, getAdminActivityLog);

module.exports = router; 
