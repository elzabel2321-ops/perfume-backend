require("dotenv").config();

module.exports = {
  baseUrl: process.env.TELEBIRR_BASE_URL,

  fabricAppId: process.env.TELEBIRR_FABRIC_APP_ID,

  appSecret: process.env.TELEBIRR_APP_SECRET,

  merchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID,

  shortCode: process.env.TELEBIRR_SHORT_CODE,
};