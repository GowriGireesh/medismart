const User = require('../models/User');

/**
 * AUTH REPOSITORY
 * Handles all database operations for authentication.
 * Controllers should NEVER directly call mongoose — they go through here.
 */

// Find a user by their email address
const findByEmail = async (email) => {
    return await User.findOne({ email });
};

// Find a user by their MongoDB _id
const findById = async (id) => {
    return await User.findById(id).select('-password');
};

// Create and save a new user to the database
const createUser = async ({ name, email, password, phone, role, googleId, profilePic }) => {
    const user = new User({ name, email, password, phone, role, googleId, profilePic });
    return await user.save();
};

// Find user by Google ID (for OAuth)
const findByGoogleId = async (googleId) => {
    return await User.findOne({ googleId });
};

// Update user role
const updateRole = async (userId, role) => {
    return await User.findByIdAndUpdate(userId, { role }, { new: true });
};

module.exports = {
    findByEmail,
    findById,
    createUser,
    findByGoogleId,
    updateRole,
};
