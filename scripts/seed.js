require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Teacher = require("./models/Teacher"); // Extends User
const Course = require("./models/Course");
const Class = require("./models/Class");
const Student = require("./models/Student");
const Enrollment = require("./models/Enrollment");
const Attendance = require("./models/Attendance");

// --- Mock Data Generators ---

const generateID = () => Math.floor(100000 + Math.random() * 900000); // 6 digit ID

const sampleCourses = [
    { courseName: "Nhập môn Cờ Vua", description: "Làm quen với bàn cờ, quân cờ", durationWeeks: 12, fee: 1500000, level: "Beginner", maxStudents: 15 },
    { courseName: "Cơ bản 1", description: "Các chiến thuật cơ bản", durationWeeks: 12, fee: 2000000, level: "Basic", maxStudents: 12 },
    { courseName: "Trung cấp Chiến lược", description: "Khai cuộc và Tàn cuộc", durationWeeks: 16, fee: 3000000, level: "Intermediate", maxStudents: 10 },
];

const sampleTeachers = [
    { username: "teacher1", password: "password123", email: "teacher1@test.com", phone: "0901234567", role: "Teacher", specialization: "Grandmaster", experienceYears: 10, certification: "FIDE Master" },
    { username: "teacher2", password: "password123", email: "teacher2@test.com", phone: "0901234568", role: "Teacher", specialization: "Tactics", experienceYears: 5, certification: "National Master" },
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected for seeding...");
    } catch (err) {
        console.error("DB Connection Error:", err);
        process.exit(1);
    }
};

const seed = async () => {
    try {
        await connectDB();

        console.log("--- Clearing existing data ---");
        await User.deleteMany({});
        await Course.deleteMany({});
        await Class.deleteMany({});
        await Student.deleteMany({});
        await Enrollment.deleteMany({});
        await Attendance.deleteMany({});
        // Verify deletion
        const userCount = await User.countDocuments();
        const courseCount = await Course.countDocuments();
        console.log(`Counts after delete - Users: ${userCount}, Courses: ${courseCount}`);

        // 1. Create Teachers
        console.log("--- Creating Teachers ---");
        const createdTeachers = [];
        for (const t of sampleTeachers) {
            try {
                const teacher = await Teacher.create(t);
                createdTeachers.push(teacher);
            } catch (e) {
                console.error("Error creating teacher:", t.username, e.message);
            }
        }
        console.log(`Created ${createdTeachers.length} teachers.`);

        // 2. Create Courses
        console.log("--- Creating Courses ---");
        const createdCourses = [];
        for (const c of sampleCourses) {
            try {
               const course = await Course.create(c);
               createdCourses.push(course);
            } catch (e) {
                console.error("Error creating course:", c.courseName, e.message);
            }
        }
        console.log(`Created ${createdCourses.length} courses.`);

        // 3. Create Classes
        console.log("--- Creating Classes ---");
        const createdClasses = [];
        let classIdCounter = 1;
        
        // Create a class for each course, assigned to a random teacher
        for (const course of createdCourses) {
            const teacher = createdTeachers[Math.floor(Math.random() * createdTeachers.length)];
            const cls = await Class.create({
                classId: classIdCounter++,
                className: `${course.courseName} - Lớp ${String.fromCharCode(65 + classIdCounter)}`,
                courseId: course._id,
                teacherId: teacher._id,
                startDate: new Date(),
                schedule: "T3/T5 (18:00 - 19:30)",
                status: "Active",
                currentStudents: 0
            });
            createdClasses.push(cls);
        }
        console.log(`Created ${createdClasses.length} classes.`);

        // 4. Create Students (and Parent Users)
        console.log("--- Creating Students ---");
        const createdStudents = [];
        const studentNames = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E", "Vũ Thị F", "Đặng Văn G"]; // Add more if needed
        
        for (let i = 0; i < studentNames.length; i++) {
            // Create Parent
            let parent;
            try {
                parent = await User.create({
                    username: `parent${i}`,
                    password: "password123",
                    email: `parent${i}@test.com`,
                    phone: `09876543${i}`,
                    role: "Parent"
                });
            } catch (e) {
                console.error("Error creating parent:", `parent${i}`, e.message);
                // Try to find existing parent to link student
                 parent = await User.findOne({ email: `parent${i}@test.com` });
            }

            if (!parent) continue; // Skip student if parent invalid

            // Create Student
            try {
                const student = await Student.create({
                    studentId: generateID(),
                    fullName: studentNames[i],
                    dateOfBirth: new Date(2015, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
                    address: "Hà Nội",
                    parentId: parent._id,
                    enrollmentDate: new Date(),
                    skillLevel: "Beginner"
                });
                createdStudents.push(student);
            } catch (e) {
                console.error("Error creating student:", studentNames[i], e.message);
            }
        }
        console.log(`Created ${createdStudents.length} students.`);

        // 5. Enrollments
        console.log("--- Creating Enrollments ---");
        const createdEnrollments = [];
        // Enroll each student in at least one class
        for (const student of createdStudents) {
             const randomClass = createdClasses[Math.floor(Math.random() * createdClasses.length)];
             const enrollment = await Enrollment.create({
                 enrollmentId: generateID(),
                 studentId: student._id,
                 classId: randomClass._id,
                 enrollmentDate: new Date(),
                 status: "Active",
                 feeAmount: 2000000,
                 paymentStatus: "Paid"
             });
             createdEnrollments.push(enrollment);

             // Update class student count
             randomClass.currentStudents += 1;
             await randomClass.save();
        }
        console.log(`Created ${createdEnrollments.length} enrollments.`);

        // 6. Attendance (Mock for the last few days)
        console.log("--- Creating Attendance ---");
        // For the first class, mark attendance for today
        if (createdClasses.length > 0 && createdStudents.length > 0) {
            const targetClass = createdClasses[0];
            // find students in this class
            const studentsInClass = createdEnrollments
                .filter(e => e.classId.toString() === targetClass._id.toString())
                .map(e => e.studentId);
            
            const todayStr = new Date().toISOString().split('T')[0];
            
            for (const sId of studentsInClass) {
                await Attendance.create({
                    attendanceId: generateID(),
                    classId: targetClass._id,
                    studentId: sId,
                    date: new Date(todayStr),
                    status: Math.random() > 0.2 ? "present" : "absent",
                    note: ""
                });
            }
        }
        console.log("Attendance seeded.");

        console.log("--- Seeding Completed Successfully ---");
        process.exit(0);
    } catch (err) {
        console.error("SEEDING ERROR:", err);
        process.exit(1);
    }
};

seed();
