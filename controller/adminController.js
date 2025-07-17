const db = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Get all users with analytics data
const getAllUsersWithAnalytics = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = '', tier = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
            params.push(%${search}%, %${search}%);
        }

        if (status) {
            whereClause += ' AND u.status = ?';
            params.push(status);
        }

        if (tier) {
            whereClause += ' AND sp.plan_name = ?';
            params.push(tier);
        }

        // Get users with basic info, join plan
        const [users] = await db.query(
            `SELECT 
                u.id, u.full_name, u.email, u.status, sp.plan_name AS tier, u.created_at,
                u.last_active, u.device_usage, u.platform_started,
                COUNT(DISTINCT ch.id) as total_sessions,
                AVG(session_duration) as avg_session_duration
            FROM users u
            LEFT JOIN subscriptions_plan sp ON u.plan = sp.id
            LEFT JOIN chat_sessions ch ON u.id = ch.user_id
            LEFT JOIN (
                SELECT id, 
                       TIMESTAMPDIFF(MINUTE, MIN(created_at), MAX(created_at)) as session_duration
                FROM chat_history 
                GROUP BY id
            ) sd ON ch.id = sd.id
            ${whereClause}
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        // Get total count for pagination
        const [countResult] = await db.query(
            SELECT COUNT(*) as total FROM users u LEFT JOIN subscriptions_plan sp ON u.plan = sp.id ${whereClause},
            params
        );

        const totalUsers = countResult[0].total;

        // Add device usage breakdown for each user
        for (let user of users) {
            if (user.device_usage) {
                user.device_usage = JSON.parse(user.device_usage);
            } else {
                user.device_usage = { web: 0, ios: 0, android: 0 };
            }
        }

        res.status(200).json({
            status: "true",
            message: "Users retrieved successfully",
            data: {
                users,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalUsers / limit),
                    total_users: totalUsers,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};


// Get detailed user profile
const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Get user basic info, join plan
        const [user] = await db.query(
          `SELECT u.*, sp.plan_name AS tier
           FROM users u
           LEFT JOIN subscriptions_plan sp ON u.plan = sp.id
           WHERE u.id = ?`,
          [id]
        );
        
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        // Get user analytics
        const [sessions] = await db.query(
            'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC',
            [id]
        );

        const [chatHistory] = await db.query(
            'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
            [id]
        );

        // Calculate usage statistics
        const totalSessions = sessions.length;
        const totalMessages = chatHistory.length;
        
        // Calculate average session duration
        let avgSessionDuration = 0;
        if (sessions.length > 0) {
            const sessionDurations = sessions.map(session => {
                const sessionMessages = chatHistory.filter(msg => msg.session_id === session.id);
                if (sessionMessages.length > 1) {
                    const firstMsg = sessionMessages[0];
                    const lastMsg = sessionMessages[sessionMessages.length - 1];
                    return (new Date(lastMsg.created_at) - new Date(firstMsg.created_at)) / 1000 / 60; // minutes
                }
                return 0;
            });
            avgSessionDuration = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
        }

        // Get most common topics (simple keyword extraction)
        const topics = {};
        chatHistory.forEach(msg => {
            if (msg.role === 'user' && msg.content) {
                const words = msg.content.toLowerCase().split(' ');
                words.forEach(word => {
                    if (word.length > 3) {
                        topics[word] = (topics[word] || 0) + 1;
                    }
                });
            }
        });

        const topTopics = Object.entries(topics)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));

        const userData = {
            ...user[0],
            analytics: {
                total_sessions: totalSessions,
                total_messages: totalMessages,
                avg_session_duration: Math.round(avgSessionDuration * 100) / 100,
                top_topics: topTopics,
                device_usage: user[0].device_usage ? JSON.parse(user[0].device_usage) : { web: 0, ios: 0, android: 0 },
                sessions: sessions.slice(0, 10), // Last 10 sessions
                recent_messages: chatHistory.slice(0, 20) // Last 20 messages
            }
        };

        res.status(200).json({
            status: "true",
            message: "User profile retrieved successfully",
            data: userData
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Update user information
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if user exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        // Build update query dynamically
        const allowedFields = [
            'full_name', 'email', 'status', 'plan', 'organization_name',
            'website', 'number_of_electricians', 'supplies_source', 'address',
            'license_number', 'referral', 'phone_number'
        ];

        const updateFields = [];
        const values = [];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ status: "false", message: "No valid fields to update" });
        }

        values.push(id);

        await db.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            values
        );

        res.status(200).json({
            status: "true",
            message: "User updated successfully"
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Create new user
const createUser = async (req, res) => {
    try {
        const { full_name, email, password, plan = 5, status = 'active', ...otherFields } = req.body;

        // Check if user already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ status: "false", message: "User already exists with this email" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            `INSERT INTO users (full_name, email, password, plan, status, ${Object.keys(otherFields).join(', ')}) 
             VALUES (?, ?, ?, ?, ?, ${Object.keys(otherFields).map(() => '?').join(', ')})`,
            [full_name, email, hashedPassword, plan, status, ...Object.values(otherFields)]
        );

        res.status(201).json({
            status: "true",
            message: "User created successfully",
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Give comped access to user
const compUserAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, duration_days = 30, reason } = req.body;

        // Check if user exists
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        // Update user plan
        await db.query(
            'UPDATE users SET plan = ?, comped_until = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE id = ?',
            [plan, duration_days, id]
        );

        res.status(200).json({
            status: "true",
            message: `User given plan ${plan} access for ${duration_days} days`
        });
    } catch (error) {
        console.error("Error giving comped access:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

module.exports = {
    getAllUsersWithAnalytics,
    getUserProfile,
    updateUser,
    createUser,
    compUserAccess
}; 
