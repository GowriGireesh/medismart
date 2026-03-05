const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const setupAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@medismart.com';
        const adminPassword = 'adminpassword123';

        let admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            admin = new User({
                name: 'MediSmart Admin',
                email: adminEmail,
                phone: '0000000000',
                password: adminPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('\n✅ New Admin Created:');
        } else {
            // Set password as plain text - the pre-save hook in User model will handle hashing
            admin.password = adminPassword;
            admin.role = 'admin';
            await admin.save();
            console.log('\n✅ Existing Admin Updated (Password Reset):');
        }

        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Role:     ${admin.role}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

setupAdmin();
