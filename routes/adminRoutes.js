const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

router.get("/test", protect, adminOnly, (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "Admin access granted",
    user: req.user,
  });
});

module.exports = router;
