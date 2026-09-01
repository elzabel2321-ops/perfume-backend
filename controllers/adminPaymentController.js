const Payment = require("../models/Payment");
const { sendError, HttpError } = require("../utils/httpError");
const { finalizePaidOrder } = require("../services/paymentService");

const getPayments = async (req, res) => {
  try {
    const { q, status, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    let query = Payment.find(filter)
      .populate("user", "name email")
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    let payments = await query;
    if (q) {
      const term = String(q).toLowerCase();
      payments = payments.filter((payment) => {
        const email = payment.user?.email || "";
        const name = payment.user?.name || "";
        const orderNumber = payment.order?.orderNumber || "";
        return (
          email.toLowerCase().includes(term) ||
          name.toLowerCase().includes(term) ||
          orderNumber.toLowerCase().includes(term) ||
          String(payment.transactionId || "").toLowerCase().includes(term)
        );
      });
    }

    const total = await Payment.countDocuments(filter);

    return res.status(200).json({
      success: true,
      payments,
      total,
      page: pageNum,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email")
      .populate("order");
    if (!payment) throw new HttpError("Payment not found", 404);
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    return sendError(res, error);
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new HttpError("Payment not found", 404);

    if (req.body.status === "paid" && payment.status !== "paid") {
      const result = await finalizePaidOrder(payment._id, {
        actorId: req.user.id,
      });
      return res.status(200).json({
        success: true,
        message: "Payment marked paid",
        ...result,
      });
    }

    const allowed = ["failed", "cancelled", "refunded"];
    if (!allowed.includes(req.body.status)) {
      throw new HttpError("Invalid payment status update", 400);
    }

    payment.status = req.body.status;
    await payment.save();
    return res.status(200).json({
      success: true,
      message: "Payment status updated",
      payment,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  updatePaymentStatus,
};
