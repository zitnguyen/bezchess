const Revenue = require("../models/Revenue");

// Lấy tất cả doanh thu, populate Payment nếu có
exports.getAllRevenues = async (req, res) => {
  try {
    const revenues = await Revenue.find().populate(
      "relatedPaymentId",
      "amount enrollmentId parentId"
    );
    res.json(revenues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy revenue theo revenueId
exports.getRevenueById = async (req, res) => {
  try {
    const revenue = await Revenue.findOne({
      revenueId: req.params.id,
    }).populate("relatedPaymentId", "amount enrollmentId parentId");
    if (!revenue) return res.status(404).json({ message: "Revenue not found" });
    res.json(revenue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tạo revenue mới
exports.createRevenue = async (req, res) => {
  try {
    const revenue = new Revenue(req.body);
    await revenue.save();
    res.status(201).json(revenue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Cập nhật revenue
exports.updateRevenue = async (req, res) => {
  try {
    const revenue = await Revenue.findOneAndUpdate(
      { revenueId: req.params.id },
      req.body,
      { new: true }
    );
    if (!revenue) return res.status(404).json({ message: "Revenue not found" });
    res.json(revenue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Xóa revenue
exports.deleteRevenue = async (req, res) => {
  try {
    const revenue = await Revenue.findOneAndDelete({
      revenueId: req.params.id,
    });
    if (!revenue) return res.status(404).json({ message: "Revenue not found" });
    res.json({ message: "Revenue deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
