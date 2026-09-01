const express = require("express");

const {
  getSettings,
  updateSettings,
} = require("../controllers/adminSettingsController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// ==========================================
// GET SETTINGS
// ==========================================
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getSettings
);

// ==========================================
// UPDATE SETTINGS
// ==========================================
router.put(
  "/",
  authMiddleware,
  adminMiddleware,
  updateSettings
);

module.exports = router;