const mongoose = require("mongoose");
const enrollmentSchema = new mongoose.Schema({
  enrollmentId: { type: Number, required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  enrollmentDate: { type: Date, default: Date.now },
  status: String,
  feeAmount: Number,
  paymentStatus: String,
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
module.exports = Enrollment;
