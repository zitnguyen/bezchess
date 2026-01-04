const axios = require('axios');
require("dotenv").config();

const BASE_URL = 'http://localhost:5000/api/attendance';
const STUDENT_ID = '695940f22ad8d2bd9c0faf34'; // seeded student
// Need to find the class ID first.
const mongoose = require('mongoose');
const Class = require('./models/Class');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const cls = await Class.findOne({ className: /Nhập môn Cờ Vua/ });
        if (!cls) {
            console.error("Class not found");
            process.exit(1);
        }
        const classId = cls._id;
        console.log("Class ID:", classId);

        const date = new Date().toISOString().split('T')[0];

        // 1. Mark Absent
        console.log("Testing Mark Absent...");
        const resAbsent = await axios.post(`${BASE_URL}/absent`, {
            studentId: STUDENT_ID,
            classId: classId,
            date: date,
            note: "Sick leave (API Test)"
        });
        console.log("Absent Response:", resAbsent.status, resAbsent.data.status, resAbsent.data.note);

        // 2. Mark Present
        console.log("Testing Mark Present...");
        const resPresent = await axios.post(`${BASE_URL}/present`, {
            studentId: STUDENT_ID,
            classId: classId,
            date: date,
            note: "Back to class"
        });
        console.log("Present Response:", resPresent.status, resPresent.data.status, resPresent.data.note);

        console.log("API VERIFICATION SUCCESS");
        process.exit(0);

    } catch (e) {
        console.error("API Error:", e.message);
        if (e.response) console.error("Data:", e.response.data);
        process.exit(1);
    }
};

run();
