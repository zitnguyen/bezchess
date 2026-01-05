const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");

exports.getAllAttendance = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (date) {
        // Find attendance records for this specific date
        // Note: Date storage might need care (timezone), assuming string match or exact ISO
        // Ideally store as YYYY-MM-DD string or range query. 
        // For simplicity with current frontend sending YYYY-MM-DD:
        const start = new Date(date);
        start.setHours(0,0,0,0);
        const end = new Date(date);
        end.setHours(23,59,59,999);
        filter.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(filter)
      .populate("studentId", "fullName")
      .populate("classId", "className schedule");
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đánh dấu có mặt
const generateID = () => Math.floor(100000 + Math.random() * 900000);

// Đánh dấu có mặt
// Đánh dấu có mặt
exports.markPresent = async (req, res) => {
  try {
    const { studentId, classId, date, note } = req.body;
    
    // Construct filter dynamically
    const filter = { studentId, date };
    if (classId) filter.classId = classId;

    // Check existing record
    let record = await Attendance.findOne(filter);
    
    if (!record) {
        // New record: create and increment session
        record = new Attendance({
             attendanceId: generateID(),
             studentId,
             date,
             status: "present",
             note: note || ""
        });
        if (classId) record.classId = classId;
        await record.save();
        
        // Increment session used on Student (Primary tracking)
        const Student = require("../models/Student");
        await Student.findByIdAndUpdate(
            studentId,
            { $inc: { "sessions.used": 1 } }
        );

        // Legacy/Class: Increment session used on Enrollment if classId exists
        if (classId) {
            const Enrollment = require("../models/Enrollment");
            await Enrollment.findOneAndUpdate(
                { studentId, classId },
                { $inc: { sessionsUsed: 1 } }
            );
        }
    } else if (record.status !== "present") {
        // Update from absent to present
        record.status = "present";
        if (note) record.note = note;
        await record.save();
        
        // Increment session used on Student
        const Student = require("../models/Student");
        await Student.findByIdAndUpdate(
            studentId,
            { $inc: { "sessions.used": 1 } }
        );

        // Legacy support: Increment Enrollment if exists and classId provided
        if (classId) {
            const Enrollment = require("../models/Enrollment");
            await Enrollment.findOneAndUpdate(
                { studentId, classId },
                { $inc: { sessionsUsed: 1 } }
            );
        }
    } else {
        // Already present, just update note if needed
        if (note) {
            record.note = note;
            await record.save();
        }
    }

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Đánh dấu vắng mặt
// Đánh dấu vắng mặt
exports.markAbsent = async (req, res) => {
  try {
    const { studentId, classId, date, note } = req.body;
    // Construct filter dynamically
    const filter = { studentId, date };
    if (classId) filter.classId = classId;
    
    let record = await Attendance.findOne(filter);
    
    if (!record) {
         // Create as absent (no session change needed usually, or specific rule?)
         // Usually absent = no session used.
         record = new Attendance({
             attendanceId: generateID(),
             studentId,
             date,
             status: "absent",
             note: note || ""
        });
        if (classId) record.classId = classId;
        await record.save();
    } else if (record.status === "present") {
        // Was present, now absent -> Decrement session used
        record.status = "absent";
        if (note) record.note = note;
        await record.save();
        
        const Student = require("../models/Student");
        await Student.findByIdAndUpdate(
             studentId,
             { $inc: { "sessions.used": -1 } }
        );

        if (classId) {
            const Enrollment = require("../models/Enrollment");
            await Enrollment.findOneAndUpdate(
                { studentId, classId, sessionsUsed: { $gt: 0 } }, // Prevent negative
                { $inc: { sessionsUsed: -1 } }
            );
        }
    } else {
         // Already absent, update note
         if (note) {
            record.note = note;
            await record.save();
        }
    }
    
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Cập nhật ghi chú
exports.updateNote = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { note: req.body.note },
      { new: true }
    );
    res.json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
