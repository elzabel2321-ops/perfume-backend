const Settings = require("../models/Settings");

async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

async function updateSettings(patch) {
  const settings = await getSettings();
  const allowed = [
    "shopName",
    "email",
    "phone",
    "address",
    "currency",
    "shippingFee",
    "freeShippingThreshold",
    "defaultLowStockThreshold",
    "allowCancellations",
    "notifyOrderConfirmation",
    "notifyPayment",
    "notifyShipping",
    "notifyDelivery",
  ];

  for (const key of allowed) {
    if (patch[key] !== undefined) {
      settings[key] = patch[key];
    }
  }

  await settings.save();
  return settings;
}

module.exports = { getSettings, updateSettings };
