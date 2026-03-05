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

// PUT /api/prescription/:id/confirm  →  Confirm an order (after reviewed)
router.put('/:id/confirm', protect, confirmPrescriptionOrder);

// ─── PHARMACIST ROUTES ───
// GET /api/prescription/shop  →  Get prescriptions assigned to pharmacist's shop
router.get('/shop', protect, getShopPrescriptions);

// PUT /api/prescription/:id/status  →  Update status (reviewed, rejected, dispensed)
router.put('/:id/status', protect, updatePrescriptionStatus);

module.exports = router;
