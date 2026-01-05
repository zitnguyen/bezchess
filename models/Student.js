const mongoose = require("mongoose");
const studentSchema = new mongoose.Schema({
  studentId: { type: Number, required: true, unique: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date },
  address: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
  enrollmentDate: { type: Date, default: Date.now }, // ngày nhập học
  skillLevel: { type: String }, //level
  // Simplified Workflow Fields
  schedule: {
      days: [{ type: Number }], // 0=Sun, 1=Mon...
      time: { type: String }, // "18:00"
      startDate: { type: Date }
  },
  sessions: {
      total: { type: Number, default: 16 },
      used: { type: Number, default: 0 }
  },
  note: { type: String }
});
const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
