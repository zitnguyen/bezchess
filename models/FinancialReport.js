const mongoose = require("mongoose");

const financialReportSchema = new mongoose.Schema({
  reportId: { type: Number, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalRevenue: { type: Number, default: 0 }, // sẽ tính tự động
  totalExpense: { type: Number, default: 0 }, // sẽ tính tự động
  netProfit: { type: Number, default: 0 }, // = totalRevenue - totalExpense
  reportType: { type: String }, // monthly, yearly...
  revenueIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Revenue" }], // liên kết doanh thu
  expenseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }], // liên kết chi phí
});
