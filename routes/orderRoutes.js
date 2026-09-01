const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getMyOrders,
  getOrderById,
  cancelMyOrder,
} = require("../controllers/orderController");

router.get("/", protect, getMyOrders);
router.post("/:id/cancel", protect, cancelMyOrder);
router.get("/:id", protect, getOrderById);

module.exports = router;
