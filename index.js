const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fileUpload = require('express-fileupload');

// Routes
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const planRoutes = require('./routes/subscriptionRoutes');
const ipRoutes = require('./routes/ipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mergeRoutes = require('./routes/mergeRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

const db = require('./config');
const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ CORS configuration
app.use(cors({
    origin: ['https://askneta.com', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Body & file parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Temp file upload support
const tempDir = path.join(__dirname, 'tmp');
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: tempDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  safeFileNames: true,
  preserveExtension: 4,
  abortOnLimit: true,
  limitHandler: function (req, res, next) {
    res.status(400).send('File size limit exceeded');
  }
}));

// ✅ Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'upload')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Serve merged PDFs from Railway-safe /tmp folder
app.use('/mergedpdf', express.static('/tmp/mergedpdf'));

// ✅ Session setup
app.use(
    session({
        secret: 'your_secret_key', // Change this securely
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 86400000 }
    })
);

// ✅ Image serving route
app.get('/upload/:imageName', (req, res) => {
    const imagePath = path.join(__dirname, 'upload', req.params.imageName);
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error(`Error serving image: ${err}`);
            res.status(500).send(err);
        }
    });
});

// ✅ API routes
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/merge', mergeRoutes);
app.use('/api/stripe', stripeRoutes);

// ✅ Admin dashboard static pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// ✅ Start server
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
