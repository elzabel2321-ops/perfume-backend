const express = require("express");

const {
  getSalesChart,
} = require("../controllers/adminSalesController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// ==========================================
// GET SALES CHART
// ==========================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getSalesChart
);

module.exports = router;