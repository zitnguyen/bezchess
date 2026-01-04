const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const adminExists = await User.findOne({ username: "admin" });
    if (adminExists) {
        console.log("Admin user already exists. Updating password...");
        adminExists.password = "123456"; // Will be hashed by pre-save hook
        await adminExists.save();
        console.log("Admin password updated to '123456'");
    } else {
        const admin = new User({
            username: "admin",
            password: "123456", // Will be hashed by pre-save hook
            email: "admin@example.com",
            role: "Admin"
        });
        await admin.save();
        console.log("Admin user created with password '123456'");
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
