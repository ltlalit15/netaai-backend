const db = require('../config');
const nodemailer = require('nodemailer');

// Add admin note to user
const addAdminNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        // Check if user exists
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        // Add note
        await db.query(
            'INSERT INTO admin_notes (user_id, admin_id, note) VALUES (?, ?, ?)',
            [id, req.user.id, note]
        );

        // Log admin activity
        await logAdminActivity(req.user.id, 'ADD_NOTE', `Added note to user ${id}`, { user_id: id, note });

        res.status(200).json({
            status: "true",
            message: "Note added successfully"
        });
    } catch (error) {
        console.error("Error adding note:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Flag user
const flagUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { flag_type, reason } = req.body;

        // Check if user exists
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        // Add flag
        await db.query(
            'INSERT INTO user_flags (user_id, flag_type, reason, admin_id) VALUES (?, ?, ?, ?)',
            [id, flag_type, reason, req.user.id]
        );

        // Log admin activity
        await logAdminActivity(req.user.id, 'FLAG_USER', `Flagged user ${id} as ${flag_type}`, { user_id: id, flag_type, reason });

        res.status(200).json({
            status: "true",
            message: "User flagged successfully"
        });
    } catch (error) {
        console.error("Error flagging user:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Send notification to user
const sendNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, message, type = 'email' } = req.body;

        // Check if user exists
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        if (type === 'email') {
            // Send email notification
            await sendEmailNotification(user[0].email, subject, message);
        }

        // Log notification
        await db.query(
            'INSERT INTO user_notifications (user_id, subject, message, type, admin_id) VALUES (?, ?, ?, ?, ?)',
            [id, subject, message, type, req.user.id]
        );

        // Log admin activity
        await logAdminActivity(req.user.id, 'SEND_NOTIFICATION', `Sent ${type} notification to user ${id}`, { user_id: id, subject, type });

        res.status(200).json({
            status: "true",
            message: "Notification sent successfully"
        });
    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Get admin activity log
const getAdminActivityLog = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const [activities] = await db.query(
            `SELECT al.*, u.full_name as admin_name 
             FROM admin_activity_log al
             LEFT JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), offset]
        );

        const [countResult] = await db.query('SELECT COUNT(*) as total FROM admin_activity_log');
        const totalActivities = countResult[0].total;

        res.status(200).json({
            status: "true",
            message: "Activity log retrieved successfully",
            data: {
                activities,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalActivities / limit),
                    total_activities: totalActivities,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error("Error fetching activity log:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Deactivate user
const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Check if user exists
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        // Deactivate user
        await db.query(
            'UPDATE users SET status = "inactive", deactivated_at = NOW(), deactivation_reason = ? WHERE id = ?',
            [reason, id]
        );

        // Log admin activity
        await logAdminActivity(req.user.id, 'DEACTIVATE_USER', `Deactivated user ${id}`, { user_id: id, reason });

        res.status(200).json({
            status: "true",
            message: "User deactivated successfully"
        });
    } catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Reactivate user
const reactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found" });
        }

        // Reactivate user
        await db.query(
            'UPDATE users SET status = "active", deactivated_at = NULL, deactivation_reason = NULL WHERE id = ?',
            [id]
        );

        // Log admin activity
        await logAdminActivity(req.user.id, 'REACTIVATE_USER', `Reactivated user ${id}`, { user_id: id });

        res.status(200).json({
            status: "true",
            message: "User reactivated successfully"
        });
    } catch (error) {
        console.error("Error reactivating user:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Helper functions
const logAdminActivity = async (adminId, action, description, metadata = {}) => {
    try {
        await db.query(
            'INSERT INTO admin_activity_log (admin_id, action, description, metadata) VALUES (?, ?, ?, ?)',
            [adminId, action, description, JSON.stringify(metadata)]
        );
    } catch (error) {
        console.error("Error logging admin activity:", error);
    }
};

const sendEmailNotification = async (email, subject, message) => {
    // Implement email sending logic here
    // You can use nodemailer or any other email service
    console.log(`Sending email to ${email}: ${subject} - ${message}`);
};

module.exports = {
    addAdminNote,
    flagUser,
    sendNotification,
    getAdminActivityLog,
    deactivateUser,
    reactivateUser
}; 
