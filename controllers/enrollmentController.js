const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");

exports.getAllEnrollments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.studentId) filter.studentId = req.query.studentId;

    const enrollments = await Enrollment.find(filter)
      .populate("studentId", "fullName skillLevel")
      .populate("classId", "className schedule");
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tạo enrollment mới (học sinh ghi danh lớp)
exports.createEnrollment = async (req, res) => {
  try {
    // Generate new enrollmentId
    const lastEnrollment = await Enrollment.findOne().sort({ enrollmentId: -1 });
    const nextId = lastEnrollment && lastEnrollment.enrollmentId ? lastEnrollment.enrollmentId + 1 : 1;

    const enrollmentData = {
        ...req.body,
        enrollmentId: nextId
    };

    const enrollment = new Enrollment(enrollmentData);
    await enrollment.save();

    // Cập nhật số học sinh hiện tại của lớp
    const cls = await ClassModel.findById(req.body.classId);
    if (cls) {
        cls.currentStudents = (cls.currentStudents || 0) + 1;
        await cls.save();
    }

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Cập nhật enrollment
exports.updateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(enrollment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Xóa enrollment
exports.deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

    // Giảm số học sinh hiện tại của lớp
    const cls = await ClassModel.findById(enrollment.classId);
    cls.currentStudents -= 1;
    await cls.save();

    res.json({ message: "Enrollment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
