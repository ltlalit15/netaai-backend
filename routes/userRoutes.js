const express = require('express');
const { login, signUp, forgotPassword, resetPassword, editProfile, getAllUsers, getUserById, checkGoogleDetails, deleteUserById, protectedRoute,logoutAllDevices } = require('../controller/user');
const authMiddleware = require('../middleware/authMiddleware');
// const multer = require('multer');
const path = require('path');

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

//const upload = multer({ storage: storage });

const router = express.Router();

router.post('/login', login);
router.post('/signUp', signUp);
router.post('/resetPassword',authMiddleware, resetPassword);
router.post('/logoutAll',  logoutAllDevices)

//router.post('/addUserDetails', addUserDetails);
router.patch('/editProfile/:id', editProfile);
router.get('/getAllUsers', getAllUsers);
router.get('/getUserById/:id',  getUserById);
router.post('/checkGoogleDetails', checkGoogleDetails);
router.post('/forgotPassword', forgotPassword);
router.delete('/deleteUserById/:id',authMiddleware, deleteUserById);

router.get('/protected', authMiddleware, protectedRoute);



module.exports = router;    





