const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

// CRUD lớp học
router.get("/test-new-code", (req, res) => res.json({ message: "New code is loaded!" }));
router.get("/", classController.getAllClasses);
router.get("/:id", classController.getClassById);
router.post("/", classController.createClass);
router.put("/:id", classController.updateClass);
router.delete("/:id", classController.deleteClass);

module.exports = router;
