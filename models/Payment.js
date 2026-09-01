const mongoose = require("mongoose");

const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
  "cancelled",
];

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ["cash", "telebirr", "chapa", "cbe", "mpesa", "card"],
      required: true,
    },
    provider: {
      type: String,
      default: "simulated",
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },
    providerRef: {
      type: String,
      default: "",
      trim: true,
    },
    confirmTokenHash: {
      type: String,
      default: "",
    },
    confirmTokenExpires: {
      type: Date,
      default: null,
    },
    idempotencyKey: {
      type: String,
      default: "",
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });
paymentSchema.index(
  { providerRef: 1 },
  { unique: true, sparse: true }
);

module.exports =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
