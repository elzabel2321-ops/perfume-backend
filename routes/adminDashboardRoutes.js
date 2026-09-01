const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getDashboard,
} = require("../controllers/adminDashboardController");

router.get(
  "/",
  protect,
  adminOnly,
  getDashboard
);

module.exports = router;