const crypto = require("crypto");

const verifyWebhook = (req, res, next) => {
  const signature = req.headers["x-webhook-signature"];

  if (!signature) {
    return res.status(401).json({
      message: "Webhook signature missing",
    });
  }

  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({
      message: "PAYMENT_WEBHOOK_SECRET is not configured",
    });
  }

  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).json({
      message: "Invalid webhook signature",
    });
  }

  next();
};

module.exports = verifyWebhook;