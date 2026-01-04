const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenueController");

// CRUD routes
router.get("/", revenueController.getAllRevenues);
router.get("/:id", revenueController.getRevenueById);
router.post("/", revenueController.createRevenue);
router.put("/:id", revenueController.updateRevenue);
router.delete("/:id", revenueController.deleteRevenue);

module.exports = router;
