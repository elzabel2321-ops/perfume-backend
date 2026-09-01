const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getAllCustomers,
} = require("../controllers/adminCustomerController");

// ==========================================
// ADMIN → GET ALL CUSTOMERS
// ==========================================

router.get(
  "/",
  protect,
  adminOnly,
  getAllCustomers
);

module.exports = router;