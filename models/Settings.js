const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: "A ROMANOVA", trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    currency: { type: String, default: "ETB", trim: true },
    shippingFee: { type: Number, default: 0, min: 0 },
    freeShippingThreshold: { type: Number, default: 0, min: 0 },
    defaultLowStockThreshold: { type: Number, default: 5, min: 0 },
    allowCancellations: { type: Boolean, default: true },
    notifyOrderConfirmation: { type: Boolean, default: true },
    notifyPayment: { type: Boolean, default: true },
    notifyShipping: { type: Boolean, default: true },
    notifyDelivery: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
