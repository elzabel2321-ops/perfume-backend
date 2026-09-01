const express = require("express");
const {
  getAdminAnalytics,
  getSales,
} = require("../controllers/adminAnalyticsController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getAdminAnalytics);
router.get("/sales", authMiddleware, adminMiddleware, getSales);

module.exports = router;
