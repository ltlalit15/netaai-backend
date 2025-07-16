const db = require('../config');

// Get user analytics
const getUserAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, period } = req.query;

        let startDate, endDate;
        if (start_date && end_date) {
            startDate = start_date;
            endDate = end_date;
        } else {
            // Default: last N days (period), default 30
            const days = period || '30';
            endDate = new Date().toISOString().slice(0, 10);
            const d = new Date(endDate);
            d.setDate(d.getDate() - (parseInt(days) - 1));
            startDate = d.toISOString().slice(0, 10);
        }

        // Get user's chat sessions in the specified period or date range
        const [sessions] = await db.query(
            `SELECT * FROM chat_sessions 
             WHERE user_id = ? AND created_at BETWEEN ? AND ?`,
            [id, startDate, endDate]
        );

        // Get chat history for analytics
        const [chatHistory] = await db.query(
            `SELECT * FROM chat_history 
             WHERE user_id = ? AND created_at BETWEEN ? AND ?`,
            [id, startDate, endDate]
        );

        // Calculate analytics
        const analytics = {
            total_sessions: sessions.length,
            total_messages: chatHistory.length,
            avg_messages_per_session: sessions.length > 0 ? Math.round(chatHistory.length / sessions.length * 100) / 100 : 0,
            session_trend: await getSessionTrend(id, period),
            platform_usage: await getPlatformUsage(id, period),
            top_topics: await getTopTopics(chatHistory),
            usage_anomalies: await detectUsageAnomalies(id, period),
            start_date: startDate,
            end_date: endDate
        };

        res.status(200).json({
            status: "true",
            message: "User analytics retrieved successfully",
            data: analytics
        });
    } catch (error) {
        console.error("Error fetching user analytics:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};
const getUsageSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Default: last 30 days
    const startDate = start_date || '1970-01-01';
    const endDate = end_date || new Date().toISOString().slice(0, 10);

    // Total messages
    const [messages] = await db.query(
      SELECT COUNT(*) as total_messages FROM chat_history WHERE created_at BETWEEN ? AND ?,
      [startDate, endDate]
    );

    // Total sessions
    const [sessions] = await db.query(
      SELECT COUNT(*) as total_sessions FROM chat_sessions WHERE created_at BETWEEN ? AND ?,
      [startDate, endDate]
    );

    // Total users active in this period
    const [activeUsers] = await db.query(
      SELECT COUNT(DISTINCT user_id) as active_users FROM chat_sessions WHERE created_at BETWEEN ? AND ?,
      [startDate, endDate]
    );

    res.json({
      total_messages: messages[0].total_messages,
      total_sessions: sessions[0].total_sessions,
      active_users: activeUsers[0].active_users,
      start_date: startDate,
      end_date: endDate
    });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get global analytics
const getGlobalAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days

        // Daily Active Users
        const [dau] = await db.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM chat_sessions 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
        );

        // Weekly Active Users
        const [wau] = await db.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM chat_sessions 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Monthly Active Users
        const [mau] = await db.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM chat_sessions 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        // Platform usage breakdown
        const [platformUsage] = await db.query(
            `SELECT 
                SUM(JSON_EXTRACT(device_usage, '$.web')) as web_users,
                SUM(JSON_EXTRACT(device_usage, '$.ios')) as ios_users,
                SUM(JSON_EXTRACT(device_usage, '$.android')) as android_users
             FROM users 
             WHERE device_usage IS NOT NULL`
        );

        // Top questions/topics
        const [topTopics] = await db.query(
            `SELECT content, COUNT(*) as count 
             FROM chat_history 
             WHERE role = 'user' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY content 
             ORDER BY count DESC 
             LIMIT 10`,
            [period]
        );

        // Conversion funnel
        const [conversionData] = await db.query(
            `SELECT 
                sp.plan_name AS tier,
                COUNT(*) as count
             FROM users u
             LEFT JOIN subscriptions_plan sp ON u.plan = sp.id
             GROUP BY sp.plan_name`
        );

        // Usage heatmap data
        const [heatmapData] = await db.query(
            `SELECT 
                HOUR(created_at) as hour,
                DAYOFWEEK(created_at) as day,
                COUNT(*) as count
             FROM chat_history 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY HOUR(created_at), DAYOFWEEK(created_at)`,
            [period]
        );

        const analytics = {
            active_users: {
                daily: dau[0].count,
                weekly: wau[0].count,
                monthly: mau[0].count
            },
            platform_usage: {
                web: platformUsage[0].web_users || 0,
                ios: platformUsage[0].ios_users || 0,
                android: platformUsage[0].android_users || 0
            },
            top_topics: topTopics,
            conversion_funnel: conversionData,
            usage_heatmap: heatmapData
        };

        res.status(200).json({
            status: "true",
            message: "Global analytics retrieved successfully",
            data: analytics
        });
    } catch (error) {
        console.error("Error fetching global analytics:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Generate reports
const generateReport = async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json', period = '30' } = req.query;

        let reportData = {};

        switch (type) {
            case 'daily-usage':
                reportData = await generateDailyUsageReport(period);
                break;
            case 'tier-changes':
                reportData = await generateTierChangeReport(period);
                break;
            case 'active-users':
                reportData = await generateActiveUsersReport(period);
                break;
            case 'inactive-users':
                reportData = await generateInactiveUsersReport();
                break;
            case 'device-trends':
                reportData = await generateDeviceTrendsReport(period);
                break;
            default:
                return res.status(400).json({ status: "false", message: "Invalid report type" });
        }

        if (format === 'csv') {
            const csv = convertToCSV(reportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
            return res.send(csv);
        }

        res.status(200).json({
            status: "true",
            message: `${type} report generated successfully`,
            data: reportData
        });
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Export user data
const exportUserData = async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users');
        
        const csv = convertToCSV(users);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error("Error exporting user data:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};

// Helper functions
const getSessionTrend = async (userId, period) => {
    const [trend] = await db.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM chat_sessions 
         WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [userId, period]
    );
    return trend;
};

const getPlatformUsage = async (userId, period) => {
    const [usage] = await db.query(
        `SELECT device_usage 
         FROM users 
         WHERE id = ?`,
        [userId]
    );
    
    if (usage.length > 0 && usage[0].device_usage) {
        return JSON.parse(usage[0].device_usage);
    }
    return { web: 0, ios: 0, android: 0 };
};

const getTopTopics = async (chatHistory) => {
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

    return Object.entries(topics)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));
};

const detectUsageAnomalies = async (userId, period) => {
    // Implement anomaly detection logic
    // This could include detecting unusual usage patterns, excessive requests, etc.
    return [];
};

const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
};

// Report generation helper functions
const generateDailyUsageReport = async (period) => {
    const [data] = await db.query(
        `SELECT DATE(created_at) as date, COUNT(*) as total_sessions, COUNT(DISTINCT user_id) as unique_users
         FROM chat_sessions 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [period]
    );
    return data;
};

const generateTierChangeReport = async (period) => {
    // This would require a tier_changes table to track changes
    return [];
};

const generateActiveUsersReport = async (period) => {
    const [data] = await db.query(
        `SELECT u.id, u.full_name, u.email, u.tier, COUNT(ch.id) as session_count
         FROM users u
         LEFT JOIN chat_sessions ch ON u.id = ch.user_id AND ch.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         WHERE ch.id IS NOT NULL
         GROUP BY u.id
         ORDER BY session_count DESC`,
        [period]
    );
    return data;
};

const generateInactiveUsersReport = async () => {
    const [data] = await db.query(
        `SELECT id, full_name, email, tier, last_active
         FROM users 
         WHERE last_active < DATE_SUB(NOW(), INTERVAL 30 DAY)
         ORDER BY last_active DESC`
    );
    return data;
};

const generateDeviceTrendsReport = async (period) => {
    const [data] = await db.query(
        `SELECT 
            DATE(created_at) as date,
            SUM(JSON_EXTRACT(device_usage, '$.web')) as web_users,
            SUM(JSON_EXTRACT(device_usage, '$.ios')) as ios_users,
            SUM(JSON_EXTRACT(device_usage, '$.android')) as android_users
         FROM users 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [period]
    );
    return data;
};

module.exports = {
    getUserAnalytics,
    getUsageSummary,
    getGlobalAnalytics,
    generateReport,
    exportUserData
}; 
