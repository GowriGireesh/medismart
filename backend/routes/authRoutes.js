const express = require('express');
const router = express.Router();
const { register, login, googleLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register  →  Create new account
router.post('/register', register);

// POST /api/auth/login  →  Login and get JWT token
router.post('/login', login);

// POST /api/auth/google-login  →  Login with Google
router.post('/google-login', googleLogin);

// GET /api/auth/me  →  Get logged-in user's profile (requires token)
router.get('/me', protect, getMe);

module.exports = router;
