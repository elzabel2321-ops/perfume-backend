const initializeTelebirrPayment = async ({
  amount,
  transactionId,
  notifyUrl,
  returnUrl,
}) => {
  /*
    REAL TELEBIRR API CALL WILL GO HERE.

    We are intentionally not inventing:
    - Telebirr API URL
    - request signature
    - authentication format
    - encryption
    - request fields

    Those must come from your Telebirr merchant/API documentation.
  */

  if (!process.env.TELEBIRR_BASE_URL) {
    throw new Error("TELEBIRR_BASE_URL is not configured");
  }

  return {
    success: false,
    transactionId,
    paymentUrl: null,
    message: "Telebirr API credentials/configuration required",
    amount,
    notifyUrl,
    returnUrl,
  };
};

module.exports = {
  initializeTelebirrPayment,
};