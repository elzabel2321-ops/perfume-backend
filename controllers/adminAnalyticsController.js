const { sendError } = require("../utils/httpError");
const { getAnalytics, getSalesChart } = require("../services/analyticsService");

const getAdminAnalytics = async (req, res) => {
  try {
    const analytics = await getAnalytics();
    return res.status(200).json({
      success: true,
      analytics: {
        ...analytics,
        revenue: analytics.revenue.total,
        revenueBreakdown: analytics.revenue,
        orders: analytics.orders.total,
        orderBreakdown: analytics.orders,
        customers: analytics.customers.total,
        totalRevenue: analytics.revenue.total,
        totalOrders: analytics.orders.total,
        totalCustomers: analytics.customers.total,
        totalProducts: analytics.products.total,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getSales = async (req, res) => {
  try {
    const sales = await getSalesChart(req.query.period || "month");
    return res.status(200).json({ success: true, sales });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { getAdminAnalytics, getSales };
