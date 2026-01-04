const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    classId: {
      type: Number,
      required: true,
      unique: true,
    },

    className: {
      type: String,
      required: true,
    },

    // ❗ BẮT BUỘC ObjectId + ref
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    startDate: {
      type: Date,
    },

    schedule: {
      type: String,
    },

    currentStudents: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Active", "Finished"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
