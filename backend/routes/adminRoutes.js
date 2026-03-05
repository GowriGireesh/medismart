const express = require('express');
const router = express.Router();
const {
    getAllShops,
    getShopById,
    approveShop,
    rejectShop,
    getAllUsers,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require: valid JWT + admin role
router.use(protect, adminOnly);

// GET  /api/admin/shops          →  All shops (filter: ?status=pending)
router.get('/shops', getAllShops);

// GET  /api/admin/shops/:id      →  Single shop details
router.get('/shops/:id', getShopById);

// PUT  /api/admin/shops/:id/approve  →  Approve a shop
router.put('/shops/:id/approve', approveShop);

// PUT  /api/admin/shops/:id/reject   →  Reject a shop
router.put('/shops/:id/reject', rejectShop);

// GET  /api/admin/users          →  All registered users
router.get('/users', getAllUsers);

module.exports = router;
