const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
            required: true,
        },
        imagePath: {
            type: String,
            required: true, // Path to uploaded prescription image
        },
        patientName: {
            type: String,
            required: true,
            trim: true,
        },
        patientPhone: {
            type: String,
            required: true,
            trim: true,
        },
        patientEmail: {
            type: String,
            required: true,
            trim: true,
        },
        patientAge: {
            type: Number,
            required: true,
        },
        patientAddress: {
            type: String,
            required: true,
            trim: true,
        },
        patientGender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'dispensed', 'rejected'],
            default: 'pending',
        },
        isConfirmed: {
            type: Boolean,
            default: false, // User confirms after pharmacist review
        },
        note: {
            type: String, // Optional message from user
            trim: true,
            default: '',
        },
        pharmacistNote: {
            type: String, // Pharmacist/shop response
            default: null,
        },
        isValid: {
            type: Boolean,
            default: false,
        },
        validationChecklist: {
            type: Object,
            default: {
                patientNameMatch: false,
                recentDate: false,
                legibleMedicines: false,
                doctorSignature: false
            }
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
