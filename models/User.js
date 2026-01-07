const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: { 
        type: String, 
        unique: true, 
        sparse: true,
        validate: {
            validator: function(v) {
                return /^0\d{0,10}$/.test(v);
            },
            message: "Số điện thoại phải bắt đầu bằng 0, chỉ chứa số và tối đa 11 ký tự"
        }
    },
    role: {
      type: String,
      enum: ["Admin", "Teacher", "Parent"],
      default: "Parent",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { discriminatorKey: "role" }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
