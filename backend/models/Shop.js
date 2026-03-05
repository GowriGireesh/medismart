const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        shopName: {
            type: String,
            required: [true, 'Shop name is required'],
            trim: true,
        },
        licenseNumber: {
            type: String,
            required: [true, 'License number is required'],
            unique: true,
            trim: true,
        },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            pincode: { type: String },
        },
        conduct: {
            type: String, // e.g., "Good Standing", any notes about the shop conduct
            trim: true,
        },
        documentPath: {
            type: String, // Path to uploaded license/document file
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        adminNote: {
            type: String, // Admin's rejection reason or approval note
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Shop', shopSchema);
