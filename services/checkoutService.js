const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { HttpError } = require("../utils/httpError");
const { calculateTotals } = require("./pricingService");
const inventoryService = require("./inventoryService");

function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const count = await Order.countDocuments({
      orderNumber: new RegExp(`^ORD-${year}-`),
    });
    const orderNumber = `ORD-${year}-${String(count + 1 + attempt).padStart(4, "0")}`;
    const exists = await Order.exists({ orderNumber });
    if (!exists) return orderNumber;
  }
  return `ORD-${year}-${Date.now().toString().slice(-6)}`;
}

async function createCheckout({ userId, items, shipping, paymentMethod }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError("Your cart is empty.", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError("User not found", 404);
  }

  const method = paymentMethod || "card";
  const allowed = ["card", "telebirr", "chapa", "cash"];
  if (!allowed.includes(method)) {
    throw new HttpError("Invalid payment method", 400);
  }

  const ship = shipping || {};
  if (!ship.firstName || !ship.lastName || !ship.email || !ship.address || !ship.city) {
    throw new HttpError("Please complete shipping information.", 400);
  }

  const snapshots = [];
  for (const line of items) {
    const productId = line.productId || line.product;
    const quantity = Number(line.quantity);
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new HttpError("Invalid product ID", 400);
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError("Invalid quantity", 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new HttpError("Product not found", 404);
    }

    const available = inventoryService.availableStock(product);
    if (available < quantity) {
      throw new HttpError(
        `Insufficient stock for ${product.name}`,
        400,
        { availableStock: available }
      );
    }

    snapshots.push({
      product: product._id,
      name: product.name,
      image: product.image || "",
      quantity,
      price: Number(product.price),
    });
  }

  const totals = await calculateTotals(snapshots);
  const orderNumber = await nextOrderNumber();
  const customerName = `${String(ship.firstName).trim()} ${String(ship.lastName).trim()}`.trim();

  const order = await Order.create({
    orderNumber,
    user: user._id,
    customer: {
      name: customerName || user.name,
      email: String(ship.email).trim().toLowerCase(),
      phone: String(ship.phone || "").trim(),
    },
    shipping: {
      firstName: String(ship.firstName).trim(),
      lastName: String(ship.lastName).trim(),
      email: String(ship.email).trim().toLowerCase(),
      phone: String(ship.phone || "").trim(),
      address: String(ship.address).trim(),
      city: String(ship.city).trim(),
      state: String(ship.state || "").trim(),
      zipCode: String(ship.zipCode || "").trim(),
    },
    items: snapshots,
    subtotal: totals.subtotal,
    shippingCost: totals.shippingCost,
    discount: totals.discount,
    tax: totals.tax,
    totalAmount: totals.totalAmount,
    paymentMethod: method,
    orderStatus: "pending_payment",
    status: "pending_payment",
    paymentStatus: "pending",
    statusHistory: [
      {
        from: "",
        to: "pending_payment",
        changedBy: user._id,
        note: "Order created",
        changedAt: new Date(),
      },
    ],
    paymentHistory: [
      {
        from: "",
        to: "pending",
        changedBy: user._id,
        note: "Payment created",
        changedAt: new Date(),
      },
    ],
    stockReserved: false,
    stockCaptured: false,
  });

  await inventoryService.reserveItems(snapshots, order._id);
  order.stockReserved = true;
  await order.save();

  const confirmToken = crypto.randomBytes(32).toString("hex");
  const payment = await Payment.create({
    user: user._id,
    order: order._id,
    amount: totals.totalAmount,
    method,
    provider: "simulated",
    status: "pending",
    confirmTokenHash: hashToken(confirmToken),
    confirmTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    idempotencyKey: String(order._id),
  });

  order.payment = payment._id;
  await order.save();

  await Cart.findOneAndUpdate(
    { user: user._id },
    { items: [] },
    { upsert: true }
  );

  return {
    order,
    payment,
    confirmToken,
    currency: totals.currency,
  };
}

module.exports = { createCheckout, hashToken, nextOrderNumber };
