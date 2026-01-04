const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");

exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
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
exports.markPresent = async (req, res) => {
  try {
    const { studentId, classId, date, note } = req.body;
    const record = await Attendance.findOneAndUpdate(
      { studentId, classId, date },
      { 
        status: "present", 
        note: note || "",
        $setOnInsert: { attendanceId: generateID() } 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Đánh dấu vắng mặt
exports.markAbsent = async (req, res) => {
  try {
    const { studentId, classId, date, note } = req.body;
    const record = await Attendance.findOneAndUpdate(
      { studentId, classId, date },
      { 
        status: "absent", 
        note: note || "", 
        $setOnInsert: { attendanceId: generateID() }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
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
