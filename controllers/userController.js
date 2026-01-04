const User = require("../models/User");
const Teacher = require("../models/Teacher"); // Import Teacher model
const Admin = require("../models/Admin"); // Import Admin model to register discriminator

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

// ===================== REGISTER =====================
exports.register = async (req, res) => {
  try {
    const { username, fullName, email, password, role, specialization, experienceYears, certification } = req.body;

    const userExists = await User.findOne({  $or: [{ email }, { username }]  });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let user;

    if (role === 'Teacher') {
        user = await Teacher.create({
            username,
            fullName,
            email,
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
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===================== LOGIN =====================
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
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET ALL USERS =====================
exports.getAllUsers = async (req, res) => {
  try {
    // Basic filtering using req.query
    // e.g. /users?role=Teacher
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    
    // Using find on User will return all docs including Teachers (discriminator magic)
    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET USER BY ID =====================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================== UPDATE USER =====================
// ===================== UPDATE USER =====================
exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    // 1. Find user first
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Hash password if provided
    if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    // 3. Update based on role to ensure discriminator fields are saved
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

// ===================== DELETE USER =====================
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
