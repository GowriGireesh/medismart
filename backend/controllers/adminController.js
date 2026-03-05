const shopRepository = require('../repositories/shopRepository');
const authRepository = require('../repositories/authRepository');

// ─── GET ALL SHOPS ────────────────────────────────────────────
// GET /api/admin/shops  (adminOnly)
const getAllShops = async (req, res) => {
    try {
        const { status } = req.query; // Optional filter: ?status=pending
        let shops;

        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            shops = await shopRepository.findByStatus(status);
        } else {
            shops = await shopRepository.findAll();
        }

        res.status(200).json({
            success: true,
            count: shops.length,
            shops,
        });
    } catch (error) {
        console.error('Admin Get Shops Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching shops' });
    }
};

// ─── GET SINGLE SHOP ──────────────────────────────────────────
// GET /api/admin/shops/:id  (adminOnly)
const getShopById = async (req, res) => {
    try {
        const shop = await shopRepository.findById(req.params.id);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }
        res.status(200).json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── APPROVE SHOP ─────────────────────────────────────────────
// PUT /api/admin/shops/:id/approve  (adminOnly)
const approveShop = async (req, res) => {
    try {
        const { adminNote } = req.body;
        const shop = await shopRepository.findById(req.params.id);

        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        const updated = await shopRepository.updateStatus(req.params.id, 'approved', adminNote || 'Approved by admin');

        // Also update the shop owner's role to 'pharmacist'
        if (shop.owner && shop.owner._id) {
            await authRepository.updateRole(shop.owner._id, 'pharmacist');
        }

        res.status(200).json({
            success: true,
            message: `Shop "${updated.shopName}" has been APPROVED ✅ and owner role updated to pharmacist.`,
            shop: updated,
        });
    } catch (error) {
        console.error('Approve Shop Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error approving shop' });
    }
};

// ─── REJECT SHOP ──────────────────────────────────────────────
// PUT /api/admin/shops/:id/reject  (adminOnly)
const rejectShop = async (req, res) => {
    try {
        const { adminNote } = req.body;

        const shop = await shopRepository.findById(req.params.id);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        const updated = await shopRepository.updateStatus(
            req.params.id,
            'rejected',
            adminNote || 'Does not meet requirements'
        );

        res.status(200).json({
            success: true,
            message: `Shop "${updated.shopName}" has been REJECTED ❌`,
            shop: updated,
        });
    } catch (error) {
        console.error('Reject Shop Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error rejecting shop' });
    }
};

// ─── GET ALL USERS ────────────────────────────────────────────
// GET /api/admin/users  (adminOnly)
const getAllUsers = async (req, res) => {
    try {
        const User = require('../models/User');
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
};

module.exports = { getAllShops, getShopById, approveShop, rejectShop, getAllUsers };
