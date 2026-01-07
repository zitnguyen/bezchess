const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

exports.register = async (req, res) => {
  try {

    const { username, fullName, email, phone, password, role, specialization, experienceYears, certification } = req.body;

    const userExists = await User.findOne({  $or: [{ email }, { username }, { phone }]  });

    if (userExists) {
      return res.status(400).json({ message: "Người dùng đã tồn tại" });
    }

    let user;

    if (role === 'Teacher') {
        user = await Teacher.create({
            username,
            fullName,
            email,
            phone,
            password,
            role,
            specialization,
            experienceYears,
            certification
        });
    } else {
        user = await User.create({
            username,
            fullName,
            email,
            phone,
            password,
            role
        });
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Dữ liệu người dùng không hợp lệ" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }
    if (user.role === 'Teacher') {
        user = await Teacher.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
    } else {
        user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
    }
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa người dùng" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
