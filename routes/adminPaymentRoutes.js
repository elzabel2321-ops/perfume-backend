const express = require("express");
const {
  getPayments,
  getPaymentById,
  updatePaymentStatus,
} = require("../controllers/adminPaymentController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getPayments);
router.get("/:id", authMiddleware, adminMiddleware, getPaymentById);
router.patch("/:id/status", authMiddleware, adminMiddleware, updatePaymentStatus);

module.exports = router;
