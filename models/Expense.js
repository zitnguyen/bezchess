const mongoose = require("mongoose");
const expenseSchema = new mongoose.Schema({
  expenseId: { type: Number, required: true, unique: true },
  date: { type: Date, default: Date.now }, // Ngày chi
  category: String, // Loại chi phí
  amount: { type: Number, required: true }, // Số tiền
  description: String,
  paymentMethod: String, // pttt
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // Admin duyệt
});

const Expense = mongoose.model("Expense", expenseSchema);
module.exports = Expense;
