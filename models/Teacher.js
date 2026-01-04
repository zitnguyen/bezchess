const User = require("./User");
const mongoose = require("mongoose");
const teacherSchema = new mongoose.Schema({
  specialization: String,
  experienceYears: Number,
  certification: String,
});
const Teacher = User.discriminator("Teacher", teacherSchema);
module.exports = Teacher;
