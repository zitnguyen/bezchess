require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const student = await Student.findOne({});
        if (student) {
            console.log("VALID_ID:" + student._id.toString());
        } else {
            console.log("NO_STUDENTS");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();
