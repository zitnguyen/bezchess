require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log("Admin user 'admin' already exists.");
            // Optional: Reset password if you want to be sure
             adminExists.password = '123456';
             await adminExists.save();
             console.log("Password reset to '123456'");
        } else {
            console.log("Creating default admin user...");
            await Admin.create({
                username: 'admin',
                password: '123456',
                fullName: 'System Administrator',
                email: 'admin@chess.com',
                role: 'Admin'
            });
            console.log("Admin user created: admin / 123456");
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
