const User = require("../models/User");

// ==========================================
// ADMIN → GET ALL CUSTOMERS
// ==========================================

const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      ok: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error(
      "Get all customers error:",
      error
    );

    res.status(500).json({
      ok: false,
      message: "Failed to get customers",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
};