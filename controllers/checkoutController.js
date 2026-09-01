const { createCheckout } = require("../services/checkoutService");
const { sendError } = require("../utils/httpError");

// =====================================================
// CREATE CHECKOUT
// =====================================================

const createCheckoutHandler = async (req, res) => {
  try {
    // -------------------------------------------------
    // Get authenticated user
    // -------------------------------------------------

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "User authentication required.",
      });
    }

    // -------------------------------------------------
    // Get request data
    // -------------------------------------------------

    const {
      items,
      shipping,
      customer,
      paymentMethod,
    } = req.body || {};

    // -------------------------------------------------
    // Shipping information
    // Supports both:
    // shipping: {...}
    // customer: {...}
    // -------------------------------------------------

    const shippingData = shipping || customer;

    // -------------------------------------------------
    // Create checkout
    // -------------------------------------------------

    const result = await createCheckout({
      userId,
      items,
      shipping: shippingData,
      paymentMethod,
    });

    // -------------------------------------------------
    // Validate service result
    // -------------------------------------------------

    if (!result || !result.order || !result.payment) {
      throw new Error(
        "Checkout service returned an invalid result."
      );
    }

    // -------------------------------------------------
    // Success response
    // -------------------------------------------------

    return res.status(201).json({
      ok: true,

      message: "Checkout created successfully",

      order: {
        id: result.order._id,
        orderNumber: result.order.orderNumber,
        orderStatus: result.order.orderStatus,
        paymentStatus: result.order.paymentStatus,

        totalAmount: result.order.totalAmount,
        subtotal: result.order.subtotal,
        shippingCost: result.order.shippingCost,
        tax: result.order.tax,

        items: result.order.items,
      },

      payment: {
        id: result.payment._id,
        amount: result.payment.amount,
        method: result.payment.method,
        status: result.payment.status,
      },

      confirmToken: result.confirmToken,

      currency: result.currency,
    });
  } catch (error) {
    // -------------------------------------------------
    // Server-side logging
    // -------------------------------------------------

    console.error("====================================");
    console.error("CHECKOUT ERROR");
    console.error("====================================");

    console.error(
      "Message:",
      error?.message || "Unknown error"
    );

    console.error(
      "Name:",
      error?.name || "Unknown error"
    );

    console.error(
      "Code:",
      error?.code || "N/A"
    );

    if (error?.errors) {
      console.error(
        "Validation Errors:",
        error.errors
      );
    }

    console.error("====================================");

    // -------------------------------------------------
    // Send standardized error response
    // -------------------------------------------------

    return sendError(res, error);
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createCheckout: createCheckoutHandler,
};