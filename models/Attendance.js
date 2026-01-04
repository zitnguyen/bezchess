const mongoose = require("mongoose");
const attendanceSchema = new mongoose.Schema({
  attendanceId: { type: Number, required: true, unique: true },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  date: { type: Date, required: true }, // Ngày điểm danh
  status: { type: String, enum: ["present", "absent"], default: "absent" }, // Trạng thái: có mặt/ vắng mặt
  note: String,
});
const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
