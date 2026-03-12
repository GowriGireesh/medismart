const express = require('express');
const router = express.Router();
const {
    uploadPrescription,
    getMyPrescriptions,
    getShopPrescriptions,
    updatePrescriptionStatus,
    confirmPrescriptionOrder
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const prescriptionUpload = require('../middleware/prescriptionUpload');

// ─── USER ROUTES ───
// POST /api/prescription  →  Upload a prescription (requires login + image file)
router.post('/', protect, prescriptionUpload.single('prescription'), uploadPrescription);

// GET /api/prescription/my  →  Get logged-in user's prescriptions
router.get('/my', protect, getMyPrescriptions);

// ─── PHARMACIST ROUTES ───
// GET /api/prescription/shop  →  Get prescriptions assigned to pharmacist's shop
// ⚠️ MUST come before /:id so Express doesn't treat "shop" as an ID
router.get('/shop', protect, getShopPrescriptions);

// PUT /api/prescription/:id/status  →  Update status (reviewed, rejected, dispensed)
router.put('/:id/status', protect, updatePrescriptionStatus);

// PUT /api/prescription/:id/confirm  →  Confirm an order (after reviewed)
router.put('/:id/confirm', protect, confirmPrescriptionOrder);

// GET /api/prescription/:id  →  Get single prescription details
// ⚠️ Keep this LAST — it matches anything, so specific routes must come first
router.get('/:id', protect, async (req, res) => {
    try {
        const prescription = await require('../models/Prescription').findById(req.params.id).populate('shop', 'shopName address');
        if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
        if (prescription.user.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Unauthorized.' });
        res.status(200).json({ success: true, prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
