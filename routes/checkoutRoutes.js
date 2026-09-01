const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createCheckout,
} = require("../controllers/checkoutController");

// Create Checkout
router.post("/", protect, createCheckout);

module.exports = router;