const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getMyPayments,
  getPaymentById,
  confirmPayment,
  failMyPayment,
} = require("../controllers/paymentController");

router.get("/", protect, getMyPayments);
router.post("/:id/confirm", protect, confirmPayment);
router.post("/:id/fail", protect, failMyPayment);
router.get("/:id", protect, getPaymentById);

module.exports = router;
