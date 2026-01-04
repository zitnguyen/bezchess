const mongoose = require("mongoose");
const progressSchema = new mongoose.Schema({
  progressId: { type: Number, required: true, unique: true },
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
  date: { type: Date, default: Date.now }, // Ngày đánh giá
  skillArea: String,
  rating: Number, // Điểm đánh giá (ví dụ 1-10)
  comment: String, // Nhận xét chi tiết
});

const Progress = mongoose.model("Progress", progressSchema);
module.exports = Progress;
