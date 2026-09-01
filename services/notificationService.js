const Notification = require("../models/Notification");
const { getSettings } = require("./settingsService");
const sendEmail = require("../utils/sendEmail");

async function notifyUser({ userId, type, title, body, orderId = null }) {
  if (!userId) return null;

  return Notification.create({
    user: userId,
    type,
    title,
    body,
    order: orderId,
  });
}

async function notifyOrderEvent(order, type) {
  const settings = await getSettings();
  const number = order.orderNumber || order._id;

  const messages = {
    payment_success: {
      enabled: settings.notifyPayment,
      title: "Payment successful",
      body: `Your payment for order ${number} was successful.`,
    },
    order_paid: {
      enabled: settings.notifyOrderConfirmation,
      title: "Order confirmed",
      body: `Order ${number} has been placed and payment confirmed.`,
    },
    order_approved: {
      enabled: true,
      title: "Order approved",
      body: `Your order ${number} has been approved and is being prepared.`,
    },
    order_shipped: {
      enabled: settings.notifyShipping,
      title: "Order shipped",
      body: `Your order ${number} has been shipped.`,
    },
    order_delivered: {
      enabled: settings.notifyDelivery,
      title: "Order delivered",
      body: `Your order ${number} has been delivered.`,
    },
    order_cancelled: {
      enabled: true,
      title: "Order cancelled",
      body: `Your order ${number} has been cancelled.`,
    },
    refund: {
      enabled: true,
      title: "Refund processed",
      body: `Your refund for order ${number} has been processed.`,
    },
  };

  const message = messages[type];
  if (!message || !message.enabled) {
    return null;
  }

  const created = await notifyUser({
    userId: order.user,
    type,
    title: message.title,
    body: message.body,
    orderId: order._id,
  });

  const to = order.customer?.email;
  if (to && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    sendEmail({
      to,
      subject: message.title,
      text: message.body,
    }).catch(() => {});
  }

  return created;
}

async function listForUser(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
}

async function markRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { readAt: new Date() },
    { new: true }
  );
}

module.exports = { notifyUser, notifyOrderEvent, listForUser, markRead };
