const express = require("express");
const {
  getInventory,
  getMovements,
  updateStock,
  increaseStock,
  decreaseStock,
} = require("../controllers/adminInventoryController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getInventory);
router.get("/:id/movements", authMiddleware, adminMiddleware, getMovements);
router.put("/:id", authMiddleware, adminMiddleware, updateStock);
router.patch("/:id/add", authMiddleware, adminMiddleware, increaseStock);
router.patch("/:id/remove", authMiddleware, adminMiddleware, decreaseStock);

module.exports = router;
