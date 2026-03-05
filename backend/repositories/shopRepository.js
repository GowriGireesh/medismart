const Shop = require('../models/Shop');

/**
 * SHOP REPOSITORY
 * All MongoDB queries for shop operations live here.
 */

// Create a new shop
const createShop = async (shopData) => {
    const shop = new Shop(shopData);
    return await shop.save();
};

// Find a shop by its owner's user ID
const findByOwner = async (ownerId) => {
    return await Shop.findOne({ owner: ownerId }).populate('owner', 'name email');
};

// Find a shop by its MongoDB _id
const findById = async (shopId) => {
    return await Shop.findById(shopId).populate('owner', 'name email');
};

// Get ALL shops (for admin view)
const findAll = async () => {
    return await Shop.find().populate('owner', 'name email').sort({ createdAt: -1 });
};

// Get all shops filtered by status
const findByStatus = async (status) => {
    return await Shop.find({ status }).populate('owner', 'name email');
};

// Update shop status (approve or reject)
const updateStatus = async (shopId, status, adminNote) => {
    return await Shop.findByIdAndUpdate(
        shopId,
        { status, adminNote },
        { new: true } // Return the updated document
    );
};

// Update shop details
const updateShop = async (shopId, updateData) => {
    return await Shop.findByIdAndUpdate(shopId, updateData, { new: true });
};

module.exports = {
    createShop,
    findByOwner,
    findById,
    findAll,
    findByStatus,
    updateStatus,
    updateShop,
};
