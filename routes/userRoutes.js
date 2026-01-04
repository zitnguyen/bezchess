const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Register / Login
router.post("/register", userController.register); // FE gọi để đăng ký
router.post("/login", userController.login); // FE gọi để đăng nhập

// Admin routes (quản lý người dùng)
const { protect, authorize } = require("../middleware/authMiddleware");

// Admin routes (quản lý người dùng)
// Admin routes (quản lý người dùng)
router.post("/", protect, authorize("Admin"), userController.register); // Admin tạo user (GV/HV)
router.get("/", protect, authorize("Admin"), userController.getAllUsers);
router.get("/:id", protect, authorize("Admin"), userController.getUserById);
router.put("/:id", protect, authorize("Admin"), userController.updateUser);
router.delete("/:id", protect, authorize("Admin"), userController.deleteUser);

module.exports = router;
