const express = require("express");
const router = express.Router();
const financeController = require("../controllers/financeController");

router.get("/stats", financeController.getFinanceStats);
router.get("/chart", financeController.getFinanceChartData);
router.get("/cost-structure", financeController.getCostStructure);
router.get("/transactions", financeController.getTransactions);
router.get("/export", financeController.exportFinanceReport);
router.post("/transactions", financeController.createTransaction);
router.put("/transactions/:id", financeController.updateTransaction);
router.delete("/transactions/:id", financeController.deleteTransaction);
router.post("/pay-tuition", financeController.payTuition);

module.exports = router;
