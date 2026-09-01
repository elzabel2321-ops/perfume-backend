const { getSettings } = require("./settingsService");

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

async function calculateTotals(lineItems) {
  const settings = await getSettings();
  const subtotal = roundMoney(
    lineItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    )
  );

  const freeFrom = Number(settings.freeShippingThreshold || 0);
  let shippingCost = roundMoney(settings.shippingFee || 0);
  if (freeFrom > 0 && subtotal >= freeFrom) {
    shippingCost = 0;
  }

  const discount = 0;
  const tax = 0;
  const totalAmount = roundMoney(subtotal + shippingCost + tax - discount);

  return {
    subtotal,
    shippingCost,
    discount,
    tax,
    totalAmount,
    currency: settings.currency || "ETB",
    settings,
  };
}

module.exports = { calculateTotals, roundMoney };
