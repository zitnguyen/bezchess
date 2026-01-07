const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");

exports.getAllAttendance = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (date) {
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

const generateID = () => Math.floor(100000 + Math.random() * 900000);

exports.markPresent = async (req, res) => {
  try {
    const { studentId, classId, date, note } = req.body;
    
    const filter = { studentId, date };
    if (classId) filter.classId = classId;

    let record = await Attendance.findOne(filter);
    
    if (!record) {
        record = new Attendance({
             attendanceId: generateID(),
             studentId,
             date,
             status: "present",
             note: note || ""
        });
        if (classId) record.classId = classId;
        await record.save();
        
        const Student = require("../models/Student");
        await Student.findByIdAndUpdate(
            studentId,
            { $inc: { "sessions.used": 1 } }
        );

        if (classId) {
            const Enrollment = require("../models/Enrollment");
            await Enrollment.findOneAndUpdate(
                { studentId, classId },
                { $inc: { sessionsUsed: 1 } }
            );
        }
    } else if (record.status !== "present") {
        record.status = "present";
        if (note) record.note = note;
        await record.save();
        
        const Student = require("../models/Student");
        await Student.findByIdAndUpdate(
            studentId,
            { $inc: { "sessions.used": 1 } }
        );

        if (classId) {
            const Enrollment = require("../models/Enrollment");
            await Enrollment.findOneAndUpdate(
                { studentId, classId },
                { $inc: { sessionsUsed: 1 } }
            );
        }
    } else {
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

exports.markAbsent = async (req, res) => {
  try {
    const { studentId, classId, date, note } = req.body;
    const filter = { studentId, date };
    if (classId) filter.classId = classId;
    
    let record = await Attendance.findOne(filter);
    
    if (!record) {
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
                { studentId, classId, sessionsUsed: { $gt: 0 } }, 
                { $inc: { sessionsUsed: -1 } }
            );
        }
    } else {
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
