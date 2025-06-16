const db = require('../config');


exports.checkAndSaveIp = async (req, res) => {
  try {
    const ipAddress = req.body.ip;

    if (!ipAddress) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    // Check if IP exists
    const [rows] = await db.query('SELECT * FROM user_ips WHERE ip_address = ?', [ipAddress]);

    if (rows.length > 0) {
      return res.json({ exists: true, chat_count: rows[0].chat_count });
    } else {
      // Insert new IP with chat_count = 0
      await db.query('INSERT INTO user_ips (ip_address, chat_count) VALUES (?, ?)', [ipAddress, 0]);
      return res.json({ exists: false, chat_count: 0 });
    }
  } catch (err) {
    console.error('Error checking/saving IP:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.increaseChatCount = async (req, res) => {
  try {
    const ipAddress = req.body.ip;

    if (!ipAddress) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    const [rows] = await db.query('SELECT * FROM user_ips WHERE ip_address = ?', [ipAddress]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'IP not found. Please register IP first.' });
    }

    const userRecord = rows[0];
    const newCount = userRecord.chat_count + 1;

    if (newCount <= 3) {
      await db.query('UPDATE user_ips SET chat_count = ? WHERE ip_address = ?', [newCount, ipAddress]);
      return res.json({ allowed: true, chat_count: newCount });
    } else {
      return res.json({ allowed: false, chat_count: userRecord.chat_count });
    }

  } catch (err) {
    console.error('Error increasing chat count:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
