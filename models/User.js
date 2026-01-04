const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Import bcryptjs

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true }, // Thêm trường họ và tên
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["Admin", "Teacher", "Parent"], // chỉ nhận 3 giá trị
      default: "Parent", // mặc định là Parent
    },
    createdAt: { type: Date, default: Date.now },
  },
  { discriminatorKey: "role" }
);

// Mã hóa password trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Phương thức kiểm tra password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
