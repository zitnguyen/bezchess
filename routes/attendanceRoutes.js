const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// CRUD/Điểm danh
router.get("/", attendanceController.getAllAttendance);
router.post("/present", attendanceController.markPresent);
router.post("/absent", attendanceController.markAbsent);
router.put("/:id/note", attendanceController.updateNote);

module.exports = router;
