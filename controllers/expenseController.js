const Expense = require("../models/Expense");

// Lấy tất cả expenses, populate admin duyệt
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate(
      "approvedBy",
      "fullName email"
    );
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy expense theo expenseId
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      expenseId: req.params.id,
    }).populate("approvedBy", "fullName email");
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tạo expense mới
exports.createExpense = async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Cập nhật expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { expenseId: req.params.id },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Xóa expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      expenseId: req.params.id,
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
