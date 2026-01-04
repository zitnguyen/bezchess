const mongoose = require("mongoose");
const revenueSchema = new mongoose.Schema({
  revenueId: { type: Number, required: true, unique: true }, // Mã doanh thu
  date: { type: Date, default: Date.now }, // Ngày ghi nhận
  source: String, // Nguồn
  amount: { type: Number, required: true }, // Số tiền
  description: String, // Mô tả
  relatedPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
});

const Revenue = mongoose.model("Revenue", revenueSchema);
module.exports = Revenue;
