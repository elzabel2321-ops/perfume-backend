const express = require("express");

const router = express.Router();

const requireInternalSecret = require("../middleware/internalSecret");

const {
  register,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  storeResetOtp,
  upsertOAuthUser,
} = require("../controllers/authController");

// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================

router.post(
  "/register",
  register
);

// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

router.post(
  "/login",
  login
);

router.post(
  "/oauth-upsert",
  requireInternalSecret,
  upsertOAuthUser
);

// =====================================================
// FORGOT PASSWORD
// Sends 6-digit OTP to email
// POST /api/auth/forgot-password
// =====================================================

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset/store-otp",
  requireInternalSecret,
  storeResetOtp
);

// =====================================================
// VERIFY RESET OTP
// POST /api/auth/verify-reset-otp
// =====================================================

router.post(
  "/verify-reset-otp",
  verifyResetOtp
);

// =====================================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// =====================================================

router.post(
  "/reset-password/:token",
  resetPassword
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;