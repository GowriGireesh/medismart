const express = require('express');
const router = express.Router();
const { registerShop, getMyShop, updateMyShop } = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const Shop = require('../models/Shop');

// GET /api/shop/approved  →  Public: All admin-approved shops (for users selecting a shop)
router.get('/approved', async (req, res) => {
    try {
        const shops = await Shop.find({ status: 'approved' })
            .select('shopName address conduct licenseNumber')
            .sort({ shopName: 1 });
        res.status(200).json({ success: true, shops });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching approved shops' });
    }
});

// POST /api/shop/register  →  Submit shop registration (with optional file)
router.post('/register', protect, upload.single('document'), registerShop);

// GET /api/shop/my-profile  →  Get logged-in user's shop
router.get('/my-profile', protect, getMyShop);

// PUT /api/shop/my-profile  →  Update your shop details
router.put('/my-profile', protect, upload.single('document'), updateMyShop);

module.exports = router;

