const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    // ==========================================
    // NAME
    // ==========================================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // EMAIL
    // ==========================================
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ==========================================
    // PASSWORD
    // ==========================================
    password: {
      type: String,
      required: true,
    },

    // ==========================================
    // AVATAR
    // ==========================================
    avatarUrl: {
      type: String,
      default: "",
    },

    // ==========================================
    // ROLE
    // ==========================================
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    // ==========================================
    // PASSWORD RESET TOKEN
    // ==========================================
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // ==========================================
    // PASSWORD RESET VERIFICATION CODE
    // ==========================================
    resetPasswordCode: {
      type: String,
      default: null,
    },

    resetPasswordCodeExpires: {
      type: Date,
      default: null,
    },

    resetPasswordOtp: {
      type: String,
      default: null,
    },

    resetPasswordOtpExpires: {
      type: Date,
      default: null,
    },

    resetPasswordOtpAttempts: {
      type: Number,
      default: 0,
    },

    resetPasswordLastRequestedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

module.exports =
  models.User || model("User", userSchema);