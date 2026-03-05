const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');
const Shop = require('../models/Shop');

// ─── Helper: Generate JWT Token ────────────────────────────────
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ─── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ success: false, message: 'Name, email, password and phone are required' });
        }

        // 2. Check if user already exists
        const existingUser = await authRepository.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
        }

        // 3. Create user (password auto-hashed in User model pre-save hook)
        const user = await authRepository.createUser({
            name,
            email,
            password,
            phone,
            role: role || 'user',
        });

        // 4. If pharmacist, create a skeleton shop profile
        if (user.role === 'pharmacist' && req.body.shopName && req.body.licenseNumber) {
            try {
                await Shop.create({
                    owner: user._id,
                    shopName: req.body.shopName,
                    licenseNumber: req.body.licenseNumber,
                    // address will be filled in the next step
                });
            } catch (shopError) {
                console.error('Error creating shop during registration:', shopError.message);
                // We don't want to fail the whole registration if shop creation fails,
                // but maybe we should? For now, we'll continue.
            }
        }

        // 5. Generate JWT
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Register Error:', error.message);
        // Mongoose validation error (e.g. password too short)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        // Duplicate email (unique index violation)
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
        }
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
    console.log("🤣🤣 here");

    try {
        const { email, password } = req.body;

        // 1. Validate fields
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // 2. Find user by email
        const user = await authRepository.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // 3. Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account has been deactivated' });
        }

        // 4. Compare password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // 5. If pharmacist, check shop approval status
        if (user.role === 'pharmacist') {
            const shop = await Shop.findOne({ owner: user._id });
            if (shop) {
                if (shop.status === 'pending') {
                    return res.status(403).json({
                        success: false,
                        message: 'Your shop registration is pending admin approval. Please wait for verification.'
                    });
                }
                if (shop.status === 'rejected') {
                    return res.status(403).json({
                        success: false,
                        message: `Your shop registration was rejected. Reason: ${shop.adminNote || 'Does not meet requirements.'}`
                    });
                }
            }
        }

        // 6. Generate JWT
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// ─── GET PROFILE ──────────────────────────────────────────────
// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
    try {
        const user = await authRepository.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── GOOGLE LOGIN ──────────────────────────────────────────────
// POST /api/auth/google-login
const googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: 'ID Token is required' });
    }

    try {
        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // 2. Find or Create User
        let user = await authRepository.findByEmail(email);

        if (user) {
            // Update Google ID if not present
            if (!user.googleId) {
                user.googleId = sub;
                // If the user doesn't have a profile pic, update it
                if (!user.profilePic) user.profilePic = picture;
                await user.save();
            }
        } else {
            // Create new user for Google login
            user = await authRepository.createUser({
                name,
                email,
                phone: 'N/A', // Google login doesn't provide phone
                googleId: sub,
                profilePic: picture,
                role: 'user', // Default role
            });
        }

        // 3. Generate JWT
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Google login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePic: user.profilePic
            },
        });
    } catch (error) {
        console.error('Google Auth Error:', error.message);
        res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
};

module.exports = { register, login, googleLogin, getMe };
