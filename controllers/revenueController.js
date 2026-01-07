const Revenue = require("../models/Revenue");

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

exports.getRevenueById = async (req, res) => {
  try {
    const revenue = await Revenue.findOne({
      revenueId: req.params.id,
    }).populate("relatedPaymentId", "amount enrollmentId parentId");
    if (!revenue) return res.status(404).json({ message: "Không tìm thấy doanh thu" });
    res.json(revenue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRevenue = async (req, res) => {
  try {
    const revenue = new Revenue(req.body);
    await revenue.save();
    res.status(201).json(revenue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateRevenue = async (req, res) => {
  try {
    const revenue = await Revenue.findOneAndUpdate(
      { revenueId: req.params.id },
      req.body,
      { new: true }
    );
    if (!revenue) return res.status(404).json({ message: "Không tìm thấy doanh thu" });
    res.json(revenue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRevenue = async (req, res) => {
  try {
    const revenue = await Revenue.findOneAndDelete({
      revenueId: req.params.id,
    });
    if (!revenue) return res.status(404).json({ message: "Không tìm thấy doanh thu" });
    res.json({ message: "Đã xóa doanh thu" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
