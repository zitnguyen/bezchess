require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Teacher = require("./models/Teacher");
const Course = require("./models/Course");
const Class = require("./models/Class");
const Student = require("./models/Student");
const Enrollment = require("./models/Enrollment");
const Attendance = require("./models/Attendance");

const generateID = () => Math.floor(100000 + Math.random() * 900000);

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");

        // 1. Ensure Teachers
        const t1 = await Teacher.findOneAndUpdate(
            { email: "teacher1@test.com" },
            { 
                username: "teacher1", password: "password123", phone: "0901234567", 
                role: "Teacher", specialization: "Grandmaster", experienceYears: 10 
            },
            { upsert: true, new: true }
        );
        console.log("Teacher 1 ready.");

        // 2. Ensure Course
        const course = await Course.findOneAndUpdate(
            { courseName: "Nhập môn Cờ Vua" },
            { description: "Basic Chess", durationWeeks: 12, fee: 1500000, level: "Beginner", maxStudents: 20 },
            { upsert: true, new: true }
        );
        console.log("Course ready:", course.courseName);

        // 3. Ensure Class
        const cls = await Class.findOneAndUpdate(
            { className: "Nhập môn Cờ Vua - Lớp Upsert" },
            { 
                classId: 999,
                courseId: course._id,
                teacherId: t1._id,
                startDate: new Date(),
                schedule: "T2/T4 (18:00)",
                status: "Active",
                currentStudents: 0
            },
            { upsert: true, new: true }
        );
        console.log("Class ready:", cls.className);

        // 4. Ensure Parent
        const parent = await User.findOneAndUpdate(
            { email: "parent_upsert@test.com" },
            { username: "parent_upsert", password: "123", phone: "0999999999", role: "Parent" },
            { upsert: true, new: true }
        );
        console.log("Parent ready.");

        // 5. Ensure Student
        // Note: checking by fullName is weak, but fine for seed. 
        // Better to check by specific seeded studentId if we fix it.
        const studentId = 888888;
        const student = await Student.findOneAndUpdate(
            { studentId: studentId },
            {
                fullName: "Nguyễn Văn Upsert",
                dateOfBirth: new Date(2015, 1, 1),
                address: "Hà Nội",
                parentId: parent._id,
                enrollmentDate: new Date(),
                skillLevel: "Beginner"
            },
            { upsert: true, new: true }
        );
        console.log("Student ready:", student._id, student.fullName);

        // 6. Ensure Enrollment
        const enroll = await Enrollment.findOneAndUpdate(
            { studentId: student._id, classId: cls._id },
            {
                enrollmentId: 777777,
                enrollmentDate: new Date(),
                status: "Active",
                feeAmount: 1500000,
                paymentStatus: "Paid"
            },
            { upsert: true, new: true }
        );
        console.log("Enrollment ready.");

        // 7. Ensure Attendance
        const todayStr = new Date().toISOString().split('T')[0];
        await Attendance.findOneAndUpdate(
            { studentId: student._id, classId: cls._id, date: new Date(todayStr) },
            { status: "present", note: "On time" },
            { upsert: true, new: true }
        );
        console.log("Attendance ready.");

        console.log("SEED FIX COMPLETED.");
        process.exit(0);

    } catch (e) {
        console.error("SEED FIX ERROR:", e);
        process.exit(1);
    }
};

seed();
