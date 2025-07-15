const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, './upload');  // Specify the folder where images will be stored
//     },
//     filename: (req, file, cb) => {
//         const fileExtension = path.extname(file.originalname);  // Get file extension
//         const fileName = Date.now() + fileExtension;  // Use a unique name
//         cb(null, fileName);
//     }
// });

// const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: 'dkqcqrrbp',
  api_key: '418838712271323',
  api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});
//Register User
const signUp = async (req, res) => {
    try {
        const { full_name, email, password, referredBy, phone_number , tier, role,status} = req.body;

        // Check if user already exists (by email)
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ status: "false", message: 'User already exists with this email', data: [] });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const platform = req.headers['x-platform'] || 'web';
         const is_admin = role === 'admin' ? true : false;
 

        // Insert new user into the database
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password, referredBy, phone_number, device_usage,tier, is_admin,status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [full_name, email, hashedPassword, referredBy, phone_number, JSON.stringify({ [platform]: 1 }),tier, is_admin,status]
        );

        // Fetch the newly created user (excluding password)
        const [newUser] = await db.query('SELECT id, full_name, email, referredBy, phone_number,tier, plan,device_usage, is_admin FROM users WHERE id = ?', [result.insertId]);

       

        // Generate JWT Token
        const token = jwt.sign({ id: newUser[0].id }, "a3b5c1d9e8f71234567890abcdef1234567890abcdefabcdef1234567890aber", { expiresIn: '1h' });

 const userRow = newUser[0];
        const userData = {
          id: userRow.id,
          full_name: userRow.full_name,
          email: userRow.email,
          referredBy: userRow.referredBy,
          phone_number: userRow.phone_number,
          tier: userRow.tier, // ✅ This guarantees tier appears
          plan: userRow.plan || null,
          device_usage: JSON.parse(userRow.device_usage || '{}'),
          status: userRow.status,
          is_admin: userRow.is_admin,
          token
        };
        // Send response
        res.status(201).json({
            status: "true",
            message: 'User registered successfully',
            data: userData
            // data: { ...newUser[0], token }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

 const editProfile = async (req, res) => {
  try {
    const id = req.params.id;

    // Get existing user
    const [existingUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ status: "false", message: 'User not found', data: [] });
    }

    const existing = existingUser[0]; // shorthand

    // Handle image upload
    let image = existing.image;
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const uploadResult = await cloudinary.uploader.upload(imageFile.tempFilePath, {
        folder: 'uploads',
        resource_type: 'image',
      });
      if (uploadResult && uploadResult.secure_url) {
        image = uploadResult.secure_url;
      } else {
        console.error('Cloudinary upload failed');
      }
    }

    // Fields from body (if undefined, fallback to existing values)
    const full_name = req.body.full_name ?? existing.full_name;
    const email = req.body.email ?? existing.email;
    const referredBy = req.body.referredBy ?? existing.referredBy;
    const organizationName = req.body.organizationName ?? existing.organization_name;
    const website = req.body.website ?? existing.website;
    const numberOfElectricians = req.body.numberOfElectricians ?? existing.number_of_electricians;
    const suppliesSource = req.body.suppliesSource ?? existing.supplies_source;
    const address = req.body.address ?? existing.address;
    const licenseNumber = req.body.licenseNumber ?? existing.license_number;
    const referral = req.body.referral ?? existing.referral;
    const login_count = req.body.login_count ?? existing.login_count;

    // Password hash (only if provided)
    let hashedPassword = existing.password;
    if (req.body.password) {
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    }

    // Update query
    await db.query(
      `UPDATE users SET
          full_name = ?, email = ?, password = ?, referredBy = ?,
          organization_name = ?, website = ?, number_of_electricians = ?, supplies_source = ?,
          address = ?, license_number = ?, referral = ?, image = ?, login_count = ?
       WHERE id = ?`,
      [
        full_name, email, hashedPassword, referredBy,
        organizationName, website, numberOfElectricians, suppliesSource,
        address, licenseNumber, referral, image, login_count, id
      ]
    );

    // Fetch updated user
    const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    res.status(200).json({
      status: "true",
      message: 'User updated successfully',
      data: updatedUser[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT u.*, sp.plan_name AS tier
             FROM users u
             LEFT JOIN subscriptions_plan sp ON u.plan = sp.id`
        );

        if (users.length === 0) {
            return res.status(404).json({ status: "false", message: "No users found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Users retrieved successfully", data: users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};



// Get User by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "User retrieved successfully", data: user[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const checkGoogleDetails = async (req, res) => {
    try {
        const { email, googleSignIn } = req.body;

        // Step 1: Validate Email
        if (!email) {
            return res.status(400).json({ status: "false", message: "Email is required", data: [] });
        }

        // Step 2: Fetch User
        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUser.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found with this email.", data: [] });
        }

        // Step 3: Prepare update fields dynamically
        const updateFields = [];
        const values = [];

        if (googleSignIn) {
            updateFields.push("googleSignIn = ?");
            values.push(googleSignIn);
        }

        // if (image) {
        //     updateFields.push("image = ?");
        //     values.push(image);
        // }

        // Step 4: Update the user if needed
        if (updateFields.length > 0) {
            values.push(email);
            const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE email = ?`;
            await db.execute(updateQuery, values);
        }

        // Step 5: Fetch Updated User Data (Ensuring Correct Column Name)
        const [updatedUser] = await db.execute('SELECT id, full_name, email, password, googleSignIn FROM users WHERE email = ?', [email]);

        return res.status(200).json({
            status: "true",
            message: "Google details updated successfully",
            data: updatedUser[0]  // Only valid `googleSignIn` field will be returned
        });

    } catch (error) {
        console.error("Google Sign-In Error:", error);
        res.status(500).json({ status: "false", message: "Server error", error: error.message });
    }
};


//delete user
const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params; 

        const [existingUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

        if (existingUser.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found", data: [] });
        }
                
        await db.query('DELETE FROM users WHERE id = ?', [id]);

        res.status(200).json({
            status: "true",
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};





const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1️⃣ Check karo ki user exist karta hai ya nahi
        const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User Not found." });
        }

        // 2️⃣ Google Sign-In users ka password reset allow nahi hoga
        // if (user[0].googleSignIn === "true") {
        //     return res.status(400).json({
        //         status: "false",
        //         message: "Password reset is not allowed for Google Sign-In users. Please log in using Google."

        //     });
        // }

        // 3️⃣ Ek Unique Reset Token Generate karo
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min valid rahega

        // 4️⃣ Database me Token Save karo
        await db.query("UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?", 
                       [resetToken, resetTokenExpiry, email]);

        // 5️⃣ Email bhejne ke liye Nodemailer ka use karo
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: 'packageitappofficially@gmail.com',
                pass: 'epvuqqesdioohjvi',
            },
        });

       const resetLink = `https://askneta.com/reset-password/${resetToken}`; // Example link, modify for your app

await transporter.sendMail({
    from: 'support@ask-neta.com',
    to: email,
    subject: "Your Password Reset Link",
    html: `<p>Click on the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>
            <p>This link will expire in <strong>15 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>`,
});

        res.status(200).json({ status: "true", message: "Password reset send email successfully." });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ status: "false", message: "Server error" });
    }
};
const resetPasswordFromToken = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // 1. Check if the reset token exists in the database
    const [user] = await db.query('SELECT id, resetToken, resetTokenExpiry FROM users WHERE resetToken = ?', [resetToken]);

    if (user.length === 0) {
      return res.status(400).json({ status: "false", message: 'Invalid or expired reset token' });
    }

    // 2. Check if the reset token has expired
    const currentTime = new Date();
    if (new Date(user[0].resetTokenExpiry) < currentTime) {
      return res.status(400).json({ status: "false", message: 'Reset token has expired' });
    }

    // 3. Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update the user's password and clear the reset token and expiry from the database
    await db.query('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = ?', [hashedNewPassword, resetToken]);

    // Send a success response
    res.json({
      status: "true",
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


 const resetPassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        // 1. Check if user exists
        const [user] = await db.query('SELECT id, password FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: 'User not found', data: [] });
        }

        // 2. Compare old password
        const isMatch = await bcrypt.compare(oldPassword, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ status: "false", message: 'Incorrect old password', data: [] });
        }

        // 3. Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 4. Update password in database
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedNewPassword, email]);

        res.json({
            status: "true",
            message: 'Password updated successfully',
            data: []
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user data along with login_count
    const [user] = await db.query(
      'SELECT id, email, password, full_name, tokenVersion, login_count, is_admin FROM users WHERE email = ?', 
      [email]
    );

    if (user.length === 0) {
      return res.status(400).json({ status: "false", message: 'Invalid email or password', data: [] });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ status: "false", message: 'Invalid email or password', data: [] });
    }

    // Increment login count
    const newLoginCount = (user[0].login_count || 0) + 1;
    await db.query('UPDATE users SET login_count = ? WHERE id = ?', [newLoginCount, user[0].id]);

    // Update last_active timestamp
    await db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [user[0].id]);

    // Device usage tracking logic

    const platform = req.headers['x-platform'] || 'web';
    // const platform = req.body.platform || 'web'; // default to web if not provided
    let deviceUsage = { web: 0, ios: 0, android: 0 };
    if (user[0].device_usage) {
      try { deviceUsage = JSON.parse(user[0].device_usage); } catch (e) {}
    }
    deviceUsage[platform] = (deviceUsage[platform] || 0) + 1;
    await db.query('UPDATE users SET device_usage = ? WHERE id = ?', [JSON.stringify(deviceUsage), user[0].id]);

    // Generate JWT Token (Include tokenVersion)
    const token = jwt.sign(
      { id: user[0].id, email: user[0].email, tokenVersion: user[0].tokenVersion },
      "a3b5c1d9e8f71234567890abcdef1234567890abcdefabcdef1234567890aber",
      { expiresIn: '1h' }
    );

    console.log("deviceUsage",deviceUsage)

    // Prepare response data (remove password)
    const userData = {
      id: user[0].id.toString(),
      email: user[0].email,
      name: user[0].full_name,
      device_usage: deviceUsage,
      token: token,
      login_count: newLoginCount,
      is_admin : user[0].is_admin
    };

    res.json({ status: "true", message: 'Login successful', data: userData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Protected Route
const protectedRoute = (req, res) => {
    res.json({ message: 'You have accessed a protected route!', user: req.user });
};


 const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user.id; // user from auth middleware
    console.log("userId",userId)
    console.log("user",user)
    console.log('Logging out all devices for user ID:', userId);

    const [result] = await db.query('UPDATE users SET tokenVersion = tokenVersion + 1 WHERE id = ?', [userId]);
    console.log('Update query result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "false", message: "User not found" });
    }

    res.status(200).json({ status: "true", message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({ status: "false", message: 'Server error' });
  }
};


// Export the functions
module.exports = { login, signUp, editProfile, getAllUsers, getUserById, checkGoogleDetails, deleteUserById, forgotPassword, resetPassword, protectedRoute,logoutAllDevices };
