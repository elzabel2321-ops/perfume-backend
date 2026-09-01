const Payment = require("../models/Payment");
const { sendError, HttpError } = require("../utils/httpError");
const {
  confirmSimulatedPayment,
  failPayment,
} = require("../services/paymentService");

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate("order", "orderNumber totalAmount orderStatus")
      .sort({ createdAt: -1 });
    return res.status(200).json({ ok: true, payments });
  } catch (error) {
    return sendError(res, error);
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("order");

    if (!payment) {
      throw new HttpError("Payment not found", 404);
    }

    return res.status(200).json({ ok: true, payment });
  } catch (error) {
    return sendError(res, error);
  }
};

const confirmPayment = async (req, res) => {
  try {
    const result = await confirmSimulatedPayment({
      paymentId: req.params.id,
      userId: req.user.id,
      confirmToken: req.body.confirmToken,
    });
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

const failMyPayment = async (req, res) => {
  try {
    const result = await failPayment(req.params.id, req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getMyPayments,
  getPaymentById,
  confirmPayment,
  failMyPayment,
};
