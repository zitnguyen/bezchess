const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");

// CRUD Enrollment
router.get("/", enrollmentController.getAllEnrollments);
router.post("/", enrollmentController.createEnrollment);
router.put("/:id", enrollmentController.updateEnrollment);
router.delete("/:id", enrollmentController.deleteEnrollment);

module.exports = router;
