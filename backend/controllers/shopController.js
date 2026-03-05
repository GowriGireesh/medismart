const shopRepository = require('../repositories/shopRepository');

// ─── REGISTER SHOP ────────────────────────────────────────────
// POST /api/shop/register  (protected)
const registerShop = async (req, res) => {
    try {
        const { shopName, licenseNumber, street, city, state, pincode, conduct } = req.body;

        // 1. Validate required fields
        if (!shopName || !licenseNumber || !street || !city || !state || !pincode) {
            return res.status(400).json({ success: false, message: 'All shop details are required' });
        }

        // 2. Build shop data object
        const shopData = {
            shopName,
            licenseNumber,
            address: { street, city, state, pincode },
            conduct,
            status: 'pending', // Reset to pending for review
        };
        if (req.file) shopData.documentPath = `/uploads/shop-docs/${req.file.filename}`;

        // 3. Check if this user already registered a shop (could be a skeleton from Register.jsx)
        let shop = await shopRepository.findByOwner(req.user.id);

        if (shop) {
            // Update existing skeleton
            shop = await shopRepository.updateShop(shop._id, shopData);
        } else {
            // Create new (if somehow not created during Register.jsx)
            shopData.owner = req.user.id;
            shop = await shopRepository.createShop(shopData);
        }

        res.status(201).json({
            success: true,
            message: 'Shop details submitted! Waiting for admin approval.',
            shop,
        });
    } catch (error) {
        // Handle duplicate key errors from MongoDB (licenseNumber or owner)
        if (error.code === 11000) {
            if (error.keyPattern && error.keyPattern.owner) {
                return res.status(409).json({ success: false, message: 'You have already registered a shop' });
            }
            return res.status(409).json({ success: false, message: 'License number already registered' });
        }
        console.error('Register Shop Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error registering shop' });
    }
};

// ─── GET MY SHOP PROFILE ─────────────────────────────────────
// GET /api/shop/my-profile  (protected)
const getMyShop = async (req, res) => {
    try {
        const shop = await shopRepository.findByOwner(req.user.id);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'No shop registered yet' });
        }
        res.status(200).json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching shop' });
    }
};

// ─── UPDATE SHOP PROFILE ──────────────────────────────────────
// PUT /api/shop/my-profile  (protected)
const updateMyShop = async (req, res) => {
    try {
        const shop = await shopRepository.findByOwner(req.user.id);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'No shop found to update' });
        }

        const { shopName, street, city, state, pincode, conduct } = req.body;
        const updateData = {};

        if (shopName) updateData.shopName = shopName;
        if (conduct) updateData.conduct = conduct;
        if (street || city || state || pincode) {
            updateData.address = {
                street: street || shop.address.street,
                city: city || shop.address.city,
                state: state || shop.address.state,
                pincode: pincode || shop.address.pincode,
            };
        }
        if (req.file) {
            updateData.documentPath = `/uploads/shop-docs/${req.file.filename}`;
        }

        const updatedShop = await shopRepository.updateShop(shop._id, updateData);
        res.status(200).json({ success: true, message: 'Shop updated successfully', shop: updatedShop });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating shop' });
    }
};

module.exports = { registerShop, getMyShop, updateMyShop };
