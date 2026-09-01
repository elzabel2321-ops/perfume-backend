const { HttpError } = require("../utils/httpError");
const { notifyOrderEvent } = require("./notificationService");
const inventoryService = require("./inventoryService");

const TRANSITIONS = {
  pending_payment: ["cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["approved", "cancelled", "refunded"],
  approved: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

function normalizeStatus(status) {
  const map = {
    pending: "pending_payment",
    confirmed: "paid",
    processing: "processing",
    approved: "approved",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
    refunded: "refunded",
    paid: "paid",
    pending_payment: "pending_payment",
  };
  return map[status] || status;
}

async function applyOrderStatus(order, nextStatus, userId, note = "") {
  const current = normalizeStatus(order.orderStatus || order.status);
  const target = normalizeStatus(nextStatus);

  if (current === target) {
    return order;
  }

  const allowed = TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    throw new HttpError(
      `Cannot change order from ${current} to ${target}`,
      400,
      { current, target, allowed }
    );
  }

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    from: current,
    to: target,
    changedBy: userId || null,
    note,
    changedAt: new Date(),
  });

  order.orderStatus = target;
  order.status = target;

  if (target === "delivered") {
    order.completedAt = new Date();
  }

  if (target === "cancelled" && current === "pending_payment" && order.stockReserved && !order.stockCaptured) {
    await inventoryService.releaseReservations(order.items, order._id, userId);
    order.stockReserved = false;
  }

  if (
    (target === "cancelled" || target === "refunded") &&
    order.stockCaptured &&
    current !== "delivered"
  ) {
    await inventoryService.restoreStock(order.items, order, userId);
    order.stockCaptured = false;
  }

  if (target === "refunded") {
    order.paymentStatus = "refunded";
  }

  await order.save();

  const notifyMap = {
    approved: "order_approved",
    shipped: "order_shipped",
    delivered: "order_delivered",
    cancelled: "order_cancelled",
    refunded: "refund",
  };

  if (notifyMap[target]) {
    await notifyOrderEvent(order, notifyMap[target]);
  }

  return order;
}

module.exports = { TRANSITIONS, normalizeStatus, applyOrderStatus };
