require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");
const Class = require("./models/Class");
const Enrollment = require("./models/Enrollment");
const User = require("./models/User");

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");
        
        const students = await Student.find({});
        console.log(`Found ${students.length} students.`);
        if (students.length > 0) {
            console.log("First Student ID:", students[0]._id);
            console.log("First Student custom ID:", students[0].studentId);
        }

        const classes = await Class.find({});
        console.log(`Found ${classes.length} classes.`);

        const enrollments = await Enrollment.find({});
        console.log(`Found ${enrollments.length} enrollments.`);

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
