const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
            // Not required because Google OAuth users won't have a password
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'pharmacist'],
            default: 'user',
        },
        googleId: {
            type: String,
            default: null,
        },
        profilePic: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// ─── Hash password before saving ──────────────────────────────
userSchema.pre('save', async function (next) {
    // Only hash if password was changed (skip for Google users)
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ─── Method: compare entered password with hashed ─────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
