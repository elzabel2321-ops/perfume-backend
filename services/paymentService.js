const crypto = require("crypto");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { HttpError } = require("../utils/httpError");
const { hashToken } = require("./checkoutService");
const inventoryService = require("./inventoryService");
const { notifyOrderEvent } = require("./notificationService");

function serializeCheckoutResult(order, payment) {
  return {
    ok: true,
    alreadyPaid: payment.status === "paid" && Boolean(payment.finalizedAt),
    order: {
      id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      items: order.items,
    },
    payment: {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      transactionId: payment.transactionId,
    },
  };
}

async function finalizePaidOrder(paymentId, { transactionId, actorId } = {}) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new HttpError("Payment not found", 404);
  }

  if (payment.status === "paid") {
    const order = await Order.findById(payment.order);
    return serializeCheckoutResult(order, payment);
  }

  if (["failed", "cancelled", "refunded"].includes(payment.status)) {
    throw new HttpError("This payment can no longer be completed.", 400);
  }

  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $in: ["pending", "processing"] } },
    { $set: { status: "processing" } },
    { new: true }
  );

  if (!claimed) {
    const latest = await Payment.findById(payment._id);
    const order = await Order.findById(payment.order);
    if (latest && latest.status === "paid") {
      return serializeCheckoutResult(order, latest);
    }
    throw new HttpError("Payment is already being processed.", 409);
  }

  const order = await Order.findById(claimed.order);
  if (!order) {
    throw new HttpError("Order not found", 404);
  }

  if (!order.stockCaptured) {
    await inventoryService.captureSale(order.items, order, actorId);
    order.stockCaptured = true;
    order.stockReserved = false;
  }

  const txId =
    transactionId ||
    claimed.transactionId ||
    `SIM-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  claimed.status = "paid";
  claimed.transactionId = txId;
  claimed.providerRef = claimed.providerRef || txId;
  claimed.confirmTokenHash = "";
  claimed.confirmTokenExpires = null;
  claimed.finalizedAt = new Date();
  await claimed.save();

  order.paymentStatus = "paid";
  order.orderStatus = "paid";
  order.status = "paid";
  order.transactionId = txId;
  order.payment = claimed._id;
  order.paymentHistory.push({
    from: "pending",
    to: "paid",
    changedBy: actorId || order.user,
    note: "Payment verified",
    changedAt: new Date(),
  });
  order.statusHistory.push({
    from: "pending_payment",
    to: "paid",
    changedBy: actorId || order.user,
    note: "Payment confirmed",
    changedAt: new Date(),
  });
  await order.save();

  await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
  await notifyOrderEvent(order, "payment_success");
  await notifyOrderEvent(order, "order_paid");

  return serializeCheckoutResult(order, claimed);
}

async function confirmSimulatedPayment({ paymentId, userId, confirmToken }) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new HttpError("Payment not found", 404);
  }

  if (String(payment.user) !== String(userId)) {
    throw new HttpError("Forbidden", 403);
  }

  if (payment.status === "paid") {
    const order = await Order.findById(payment.order);
    return serializeCheckoutResult(order, payment);
  }

  if (!confirmToken) {
    throw new HttpError("Payment confirmation token is required.", 400);
  }

  if (!payment.confirmTokenHash || !payment.confirmTokenExpires) {
    throw new HttpError("This payment cannot be confirmed.", 400);
  }

  if (payment.confirmTokenExpires.getTime() < Date.now()) {
    throw new HttpError("Payment session expired. Please checkout again.", 400);
  }

  const incoming = hashToken(String(confirmToken));
  const expected = payment.confirmTokenHash;
  const a = Buffer.from(incoming);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError("Invalid payment confirmation.", 400);
  }

  return finalizePaidOrder(payment._id, { actorId: userId });
}

async function failPayment(paymentId, userId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new HttpError("Payment not found", 404);
  if (String(payment.user) !== String(userId)) {
    throw new HttpError("Forbidden", 403);
  }
  if (payment.status === "paid") {
    throw new HttpError("Paid payments cannot be failed.", 400);
  }

  payment.status = "failed";
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order && order.stockReserved && !order.stockCaptured) {
    await inventoryService.releaseReservations(order.items, order._id, userId);
    order.stockReserved = false;
    order.paymentStatus = "failed";
    await order.save();
  }

  return { ok: true, payment, order };
}

module.exports = {
  finalizePaidOrder,
  confirmSimulatedPayment,
  failPayment,
};
