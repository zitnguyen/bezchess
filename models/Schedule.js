const mongoose = require("mongoose");
const scheduleSchema = new mongoose.Schema({
  scheduleId: { type: Number, required: true, unique: true }, // Mã lịch
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  }, // Lớp liên quan
  dayOfWeek: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
  startTime: String, // Giờ bắt đầu
  endTime: String, // Giờ kết thúc
  room: String, // Phòng học
});

const Schedule = mongoose.model("Schedule", scheduleSchema);
module.exports = Schedule;
