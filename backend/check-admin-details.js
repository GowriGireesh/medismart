const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const checkAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admins = await User.find({ role: 'admin' }).select('email name role -_id');

        if (admins.length > 0) {
            console.log('\n--- Admin Users Found ---');
            admins.forEach(admin => {
                console.log(`Email: ${admin.email}`);
                console.log(`Name:  ${admin.name}`);
                console.log('------------------------');
            });
            console.log('\nNote: Passwords are encrypted in the database.');
        } else {
            console.log('\nNo admin users found in the database.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkAdmins();
