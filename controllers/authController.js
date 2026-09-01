const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// =====================================================
// STRONG PASSWORD VALIDATION
// =====================================================

const isStrongPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// =====================================================
// GENERATE JWT
// =====================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// HASH RESET VALUE
// =====================================================

const hashResetValue = (value) => {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
};

// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        message:
          "Name, email and password are required.",
      });
    }

    const cleanName = String(name).trim();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const cleanPassword = String(password);

    // Name validation
    if (cleanName.length < 2) {
      return res.status(400).json({
        ok: false,
        message:
          "Name must be at least 2 characters.",
      });
    }

    // Email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        ok: false,
        message:
          "Please enter a valid email address.",
      });
    }

    // Strong password
    if (!isStrongPassword(cleanPassword)) {
      return res.status(400).json({
        ok: false,
        message:
          "Password must be at least 8 characters and contain one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        ok: false,
        message:
          "Email already registered.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      cleanPassword,
      12
    );

    // Create customer
    const user = await User.create({
      name: cleanName,
      email: normalizedEmail,
      password: hashedPassword,

      // Normal registration = customer
      role: "customer",

      resetPasswordToken: null,
      resetPasswordExpires: null,
      resetPasswordOtp: null,
      resetPasswordOtpExpires: null,
    });

    // Generate JWT
    const token = generateToken(user);

    console.log(
      "================================="
    );
    console.log("USER REGISTERED");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log(
      "================================="
    );

    return res.status(201).json({
      ok: true,

      message:
        "User registered successfully.",

      token,

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "Registration failed.",
    });
  }
};

// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Required fields
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const cleanPassword = String(password);

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        message:
          "Invalid email or password.",
      });
    }

    // Check password
    if (!user.password) {
      return res.status(401).json({
        ok: false,
        message:
          "This account does not have a password. Please reset your password first.",
      });
    }

    // Compare password
    const passwordMatch =
      await bcrypt.compare(
        cleanPassword,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        message:
          "Invalid email or password.",
      });
    }

    // Generate JWT
    const token = generateToken(user);

    console.log(
      "================================="
    );
    console.log("LOGIN SUCCESS");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log(
      "================================="
    );

    return res.status(200).json({
      ok: true,

      message:
        "Login successful.",

      token,

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        "Login failed.",
    });
  }
};

// =====================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =====================================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        ok: false,
        message:
          "Email is required.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
      SECURITY:
      Do not reveal whether the email
      exists in the database.
    */

    if (!user) {
      return res.status(404).json({
        ok: false,
        message:
          "No account found for this email. Please register first.",
      });
    }

    // =================================================
    // GENERATE 6 DIGIT OTP
    // =================================================

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Hash OTP before storing
    const hashedOtp = hashResetValue(otp);

    // =================================================
    // SAVE OTP
    // =================================================

    user.resetPasswordOtp = hashedOtp;

    // OTP valid for 10 minutes
    user.resetPasswordOtpExpires =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    // Remove previous reset session
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    // =================================================
    // SEND EMAIL
    // =================================================

    await transporter.sendMail({
      from:
        `"A ROMANOVA" <${process.env.EMAIL_USER}>`,

      to: user.email,

      subject:
        "A ROMANOVA - Password Reset Verification Code",

      text:
        `Your A ROMANOVA password reset verification code is ${otp}. ` +
        `This code expires in 10 minutes.`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          background: #faf7f2;
        ">

          <div style="
            background: white;
            padding: 35px;
            border-radius: 15px;
            text-align: center;
          ">

            <h1 style="
              letter-spacing: 6px;
              color: #171717;
            ">
              A ROMANOVA
            </h1>

            <h2>
              Password Reset
            </h2>

            <p style="
              color: #555;
              font-size: 16px;
            ">
              Your verification code is:
            </p>

            <div style="
              margin: 30px 0;
              padding: 20px;
              background: #faf7f2;
              border-radius: 10px;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 10px;
              color: #b38c2b;
            ">
              ${otp}
            </div>

            <p style="
              color: #777;
            ">
              This code expires in
              <strong>10 minutes</strong>.
            </p>

            <p style="
              color: #999;
              font-size: 13px;
            ">
              If you did not request a password reset,
              please ignore this email.
            </p>

          </div>

        </div>
      `,
    });

    console.log(
      "================================="
    );

    console.log(
      "PASSWORD RESET OTP SENT"
    );

    console.log(
      "Email:",
      user.email
    );

    console.log(
      "Role:",
      user.role
    );

    console.log(
      "OTP expires in 10 minutes"
    );

    console.log(
      "================================="
    );

    return res.status(200).json({
      ok: true,

      message:
        "If an account exists with this email, a verification code has been sent.",
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,

      message:
        "Unable to send verification code. Please try again.",
    });
  }
};

// =====================================================
// VERIFY RESET OTP
// POST /api/auth/verify-reset-otp
// =====================================================

const verifyResetOtp = async (
  req,
  res
) => {
  try {
    const { email, otp } = req.body;

    // Required fields
    if (!email || !otp) {
      return res.status(400).json({
        ok: false,

        message:
          "Email and verification code are required.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const cleanOtp = String(otp).trim();

    // OTP must be 6 digits
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        ok: false,

        message:
          "Verification code must be 6 digits.",
      });
    }

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        ok: false,

        message:
          "Invalid verification code.",
      });
    }

    // Check OTP exists
    if (
      !user.resetPasswordOtp ||
      !user.resetPasswordOtpExpires
    ) {
      return res.status(400).json({
        ok: false,

        message:
          "Invalid or expired verification code.",
      });
    }

    if (Number(user.resetPasswordOtpAttempts || 0) >= 5) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpires = null;
      await user.save();

      return res.status(400).json({
        ok: false,
        message: "Invalid or expired verification code.",
      });
    }

    // Check expiration
    if (
      user.resetPasswordOtpExpires.getTime() <
      Date.now()
    ) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpires = null;

      await user.save();

      return res.status(400).json({
        ok: false,

        message:
          "Verification code has expired.",
      });
    }

    // Hash submitted OTP
    const hashedSubmittedOtp =
      hashResetValue(cleanOtp);

    // Compare OTP
    if (
      hashedSubmittedOtp !==
      user.resetPasswordOtp
    ) {
      user.resetPasswordOtpAttempts =
        Number(user.resetPasswordOtpAttempts || 0) + 1;

      if (user.resetPasswordOtpAttempts >= 5) {
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpires = null;
      }

      await user.save();

      return res.status(400).json({
        ok: false,

        message:
          "Invalid or expired verification code.",
      });
    }

    // =================================================
    // CREATE TEMPORARY RESET TOKEN
    // =================================================

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    const hashedResetToken =
      hashResetValue(resetToken);

    user.resetPasswordToken =
      hashedResetToken;

    // Reset token valid for 10 minutes
    user.resetPasswordExpires =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    // Delete OTP immediately
    user.resetPasswordOtp = null;

    user.resetPasswordOtpExpires = null;

    await user.save();

    console.log(
      "================================="
    );

    console.log(
      "OTP VERIFIED"
    );

    console.log(
      "Email:",
      user.email
    );

    console.log(
      "Role:",
      user.role
    );

    console.log(
      "================================="
    );

    return res.status(200).json({
      ok: true,

      message:
        "Verification successful.",

      // Send temporary token to frontend.
      // The database stores only its hash.
      resetToken,
    });
  } catch (error) {
    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,

      message:
        "Verification failed.",
    });
  }
};

// =====================================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// =====================================================

const resetPassword = async (
  req,
  res
) => {
  try {
    const { token } = req.params;

    const {
      password,
      confirmPassword,
    } = req.body;

    // Token
    if (!token) {
      return res.status(400).json({
        ok: false,

        message:
          "Reset token is required.",
      });
    }

    // Password
    if (!password) {
      return res.status(400).json({
        ok: false,

        message:
          "New password is required.",
      });
    }

    // Confirm password
    if (!confirmPassword) {
      return res.status(400).json({
        ok: false,

        message:
          "Please confirm your new password.",
      });
    }

    const cleanPassword =
      String(password);

    // Strong password
    if (
      !isStrongPassword(
        cleanPassword
      )
    ) {
      return res.status(400).json({
        ok: false,

        message:
          "Password must be at least 8 characters and contain one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Password match
    if (
      cleanPassword !==
      String(confirmPassword)
    ) {
      return res.status(400).json({
        ok: false,

        message:
          "Passwords do not match.",
      });
    }

    // =================================================
    // HASH TOKEN
    // =================================================

    const hashedToken =
      hashResetValue(token);

    // =================================================
    // FIND VALID RESET SESSION
    // =================================================

    const user = await User.findOne({
      resetPasswordToken:
        hashedToken,

      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,

        message:
          "Reset session is invalid or expired. Please request a new verification code.",
      });
    }

    // =================================================
    // HASH NEW PASSWORD
    // =================================================

    const hashedPassword =
      await bcrypt.hash(
        cleanPassword,
        12
      );

    // =================================================
    // UPDATE PASSWORD
    // =================================================

    user.password =
      hashedPassword;

    // =================================================
    // REMOVE ALL RESET DATA
    // =================================================

    user.resetPasswordToken =
      null;

    user.resetPasswordExpires =
      null;

    user.resetPasswordOtp =
      null;

    user.resetPasswordOtpExpires =
      null;

    await user.save();

    console.log(
      "================================="
    );

    console.log(
      "PASSWORD RESET SUCCESS"
    );

    console.log(
      "Email:",
      user.email
    );

    console.log(
      "Role:",
      user.role
    );

    console.log(
      "================================="
    );

    return res.status(200).json({
      ok: true,

      message:
        "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,

      message:
        "Something went wrong. Please try again.",
    });
  }
};

// =====================================================
// STORE RESET OTP
// Used by the Next.js reset API so user lookup
// happens in the SAME database as register/login.
// POST /api/auth/reset/store-otp
// =====================================================

const storeResetOtp = async (req, res) => {
  try {
    const { email, otpHash, expiresAt } = req.body;

    if (!email || !otpHash || !expiresAt) {
      return res.status(400).json({
        ok: false,
        message: "Unable to process your request. Please try again.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message:
          "No account found for this email. Please register first.",
      });
    }

    if (user.resetPasswordLastRequestedAt) {
      const elapsed =
        Date.now() -
        new Date(user.resetPasswordLastRequestedAt).getTime();

      if (elapsed < 60 * 1000) {
        return res.status(429).json({
          ok: false,
          message:
            "Please wait before requesting another verification code.",
        });
      }
    }

    user.resetPasswordOtp = String(otpHash);
    user.resetPasswordOtpExpires = new Date(expiresAt);
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordLastRequestedAt = new Date();
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      ok: true,
      email: user.email,
    });
  } catch (error) {
    console.error("STORE RESET OTP ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "Unable to process your request. Please try again.",
    });
  }
};

// =====================================================
// OAUTH UPSERT
// Persist Google sign-ins into the same users collection.
// POST /api/auth/oauth-upsert
// =====================================================

const upsertOAuthUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || "Customer").trim() || "Customer";

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        name: cleanName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "customer",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      ok: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OAUTH UPSERT ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "Unable to create account.",
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  storeResetOtp,
  upsertOAuthUser,
};