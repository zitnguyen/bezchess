const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  description: String,
  durationWeeks: Number,
  fee: Number,
  level: String,
  maxStudents: Number,
  totalSessions: { type: Number, default: 16 }, // Tổng số buổi mặc định
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
