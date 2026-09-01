const initializeFakeTelebirrPayment = async ({
  paymentId,
  amount,
  transactionId,
}) => {
  const paymentUrl =
    `http://localhost:4000/api/payments/fake-checkout` +
    `?paymentId=${paymentId}` +
    `&amount=${amount}` +
    `&transactionId=${transactionId}`;

  return {
    success: true,
    paymentId,
    amount,
    transactionId,
    paymentUrl,
    mode: "fake",
  };
};

module.exports = {
  initializeFakeTelebirrPayment,
};