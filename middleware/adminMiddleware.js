const db = require('../config');

const adminMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Check if user exists and has admin role
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (user.length === 0) {
            return res.status(404).json({ 
                status: "false", 
                message: "User not found" 
            });
        }

        // For now, we'll check if the user has admin privileges
        // You can modify this logic based on your admin identification method
        // For example, you could add an 'is_admin' column to the users table
        if (!user[0].is_admin) {
            return res.status(403).json({ 
                status: "false", 
                message: "Access denied. Admin privileges required." 
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ 
            status: "false", 
            message: "Server error in admin middleware" 
        });
    }
};

module.exports = adminMiddleware; 
