const Order = require("../models/Order");
const { sendError, HttpError } = require("../utils/httpError");
const { applyOrderStatus } = require("../services/orderStatusService");

const getAllOrders = async (req, res) => {
  try {
    const {
      q,
      orderStatus,
      paymentStatus,
      from,
      to,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (q) {
      filter.$or = [
        { orderNumber: new RegExp(q, "i") },
        { "customer.name": new RegExp(q, "i") },
        { "customer.email": new RegExp(q, "i") },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const sortDir = order === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .populate("payment")
        .sort({ [sort]: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      ok: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      orders,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("payment");

    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    return res.status(200).json({ ok: true, order });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new HttpError("Order not found", 404);
    }

    await applyOrderStatus(
      order,
      req.body.status,
      req.user.id,
      req.body.note || ""
    );

    return res.status(200).json({
      ok: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
