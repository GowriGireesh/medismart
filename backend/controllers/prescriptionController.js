const Prescription = require('../models/Prescription');
const Shop = require('../models/Shop');

// ─── UPLOAD PRESCRIPTION ──────────────────────────────────────
// POST /api/prescription   (protected)
const uploadPrescription = async (req, res) => {
    try {
        console.log('Upload Request Body:', req.body);
        console.log('Upload Request File:', req.file);

        const { shopId, note, patientName, patientPhone, patientEmail, patientAge, patientAddress, patientGender, existingImagePath } = req.body;

        // Validate: file OR existingImagePath must be provided
        if (!req.file && !existingImagePath) {
            return res.status(400).json({ success: false, message: 'Please upload a prescription image or PDF.' });
        }

        // Validate: shopId is required
        if (!shopId) {
            return res.status(400).json({ success: false, message: 'Please select a shop.' });
        }

        // Validate: patient details are required
        if (!patientName || !patientPhone || !patientEmail || !patientAge || !patientAddress || !patientGender) {
            return res.status(400).json({ success: false, message: 'All patient details are required.' });
        }

        const mongoose = require('mongoose');
        let finalShopId = shopId;

        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            // Mapping of sample IDs to shop details
            const sampleShops = {
                "sample-1": { shopName: "Apollo Pharmacy", licenseNumber: "ALP-2024-001", address: { street: "MG Road", city: "Kochi", state: "Kerala", pincode: "682001" }, conduct: "Highly Rated" },
                "sample-2": { shopName: "MedPlus Pharmacy", licenseNumber: "MED-2024-002", address: { street: "Civil Station", city: "Kozhikode", state: "Kerala", pincode: "673020" }, conduct: "Express Delivery" },
                "sample-3": { shopName: "Wellness Forever", licenseNumber: "WEL-2024-003", address: { street: "Marine Drive", city: "Mumbai", state: "Maharashtra", pincode: "400002" }, conduct: "24/7 Service" },
                "sample-4": { shopName: "Chennai Medicals", licenseNumber: "CHN-2024-004", address: { street: "Anna Salai", city: "Chennai", state: "Tamil Nadu", pincode: "600002" }, conduct: "Doorstep Delivery" },
                "sample-5": { shopName: "Delhi Health Plus", licenseNumber: "DLH-2024-005", address: { street: "Connaught Place", city: "Delhi", state: "Delhi", pincode: "110001" }, conduct: "Premium Care" }
            };

            const sampleInfo = sampleShops[shopId];
            if (sampleInfo) {
                // Check if this demo shop already exists in DB by license
                let demoShop = await Shop.findOne({ licenseNumber: sampleInfo.licenseNumber });
                if (!demoShop) {
                    // Auto-create shop record. Use current user as owner for demo convenience.
                    demoShop = await Shop.create({
                        ...sampleInfo,
                        owner: req.user.id,
                        status: 'approved'
                    });
                }
                finalShopId = demoShop._id;
            } else {
                return res.status(400).json({ success: false, message: 'Invalid pharmacy selected.' });
            }
        }

        // Validate: shop exists and is approved
        const shop = await Shop.findById(finalShopId);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found.' });
        }
        if (shop.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Selected shop is not approved.' });
        }

        // Create prescription record
        const prescription = await Prescription.create({
            user: req.user.id,
            shop: finalShopId,
            imagePath: req.file ? (req.file.location || `/uploads/prescriptions/${req.file.filename}`) : existingImagePath,
            note: note || '',
            patientName,
            patientPhone,
            patientEmail,
            patientAge,
            patientAddress,
            patientGender,
        });

        res.status(201).json({
            success: true,
            message: 'Prescription uploaded successfully! The pharmacy will review it shortly.',
            prescription,
        });
    } catch (error) {
        const fs = require('fs');
        const path = require('path');
        const logMsg = `[${new Date().toISOString()}] Upload Error: ${error.message}\n${error.stack}\n`;
        fs.appendFileSync(path.join(__dirname, '..', 'error.log'), logMsg);

        console.error('Upload Prescription Error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Server error uploading prescription.' });
    }
};

// ─── GET MY PRESCRIPTIONS ─────────────────────────────────────
// GET /api/prescription/my   (protected)
const getMyPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ user: req.user.id })
            .populate('shop', 'shopName address')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, prescriptions });
    } catch (error) {
        console.error('Get Prescriptions Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching prescriptions.' });
    }
};

// ─── GET SHOP PRESCRIPTIONS (for Pharmacist) ──────────────────
// GET /api/prescription/shop   (protected, pharmacist role)
const getShopPrescriptions = async (req, res) => {
    try {
        // Find the shop owned by this pharmacist
        const shop = await Shop.findOne({ owner: req.user.id });
        if (!shop) {
            return res.status(404).json({ success: false, message: 'No shop found for this account.' });
        }

        const prescriptions = await Prescription.find({ shop: shop._id })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, prescriptions });
    } catch (error) {
        console.error('Get Shop Prescriptions Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching shop prescriptions.' });
    }
};

// ─── UPDATE PRESCRIPTION STATUS (for Pharmacist) ───────────────
// PUT /api/prescription/:id/status   (protected, pharmacist role)
const updatePrescriptionStatus = async (req, res) => {
    try {
        const { status, pharmacistNote, isValid, validationChecklist } = req.body;
        if (!['reviewed', 'dispensed', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update.' });
        }

        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found.' });
        }

        // Verify pharmacist owns the shop assigned to this prescription
        const shop = await Shop.findOne({ owner: req.user.id });
        if (!shop || prescription.shop.toString() !== shop._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to update this prescription.' });
        }

        prescription.status = status;
        if (pharmacistNote !== undefined) prescription.pharmacistNote = pharmacistNote;
        if (isValid !== undefined) prescription.isValid = isValid;
        if (validationChecklist !== undefined) prescription.validationChecklist = validationChecklist;

        await prescription.save();

        res.status(200).json({ success: true, message: `Prescription marked as ${status}.`, prescription });
    } catch (error) {
        console.error('Update Status Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error updating prescription.' });
    }
};

// ─── CONFIRM ORDER (for User) ─────────────────────────────────
// PUT /api/prescription/:id/confirm   (protected)
const confirmPrescriptionOrder = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found.' });
        }

        // Verify user owns the prescription
        if (prescription.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized.' });
        }

        if (prescription.status !== 'reviewed') {
            return res.status(400).json({ success: false, message: 'Order can only be confirmed after review.' });
        }

        prescription.isConfirmed = true;
        await prescription.save();

        res.status(200).json({ success: true, message: 'Order confirmed! The shop will now process it.', prescription });
    } catch (error) {
        console.error('Confirm Order Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error confirming order.' });
    }
};

module.exports = {
    uploadPrescription,
    getMyPrescriptions,
    getShopPrescriptions,
    updatePrescriptionStatus,
    confirmPrescriptionOrder
};
