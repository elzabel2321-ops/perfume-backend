const Order = require("../models/Order");
const { sendError, HttpError } = require("../utils/httpError");
const { applyOrderStatus, normalizeStatus } = require("../services/orderStatusService");
const { getSettings } = require("../services/settingsService");

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ ok: true, orders });
  } catch (error) {
    return sendError(res, error);
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("payment");

    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    return res.status(200).json({ ok: true, order });
  } catch (error) {
    return sendError(res, error);
  }
};

const cancelMyOrder = async (req, res) => {
  try {
    const settings = await getSettings();
    if (!settings.allowCancellations) {
      throw new HttpError("Cancellations are disabled.", 400);
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    const current = normalizeStatus(order.orderStatus || order.status);
    if (current !== "pending_payment") {
      throw new HttpError("Only unpaid orders can be cancelled by the customer.", 400);
    }

    await applyOrderStatus(order, "cancelled", req.user.id, "Customer cancelled");
    return res.status(200).json({ ok: true, order });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  cancelMyOrder,
};
