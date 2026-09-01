const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const User = require("../models/User");
const { getSettings } = require("./settingsService");
const inventoryService = require("./inventoryService");

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function daysAgo(n) {
  const value = startOfDay();
  value.setDate(value.getDate() - n);
  return value;
}

async function sumPaid(from, to) {
  const match = { status: "paid" };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = from;
    if (to) match.createdAt.$lt = to;
  }
  const result = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  return {
    total: result[0]?.total || 0,
    count: result[0]?.count || 0,
  };
}

async function getAnalytics() {
  const now = new Date();
  const today = startOfDay(now);
  const week = daysAgo(7);
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const year = new Date(now.getFullYear(), 0, 1);

  const [
    totalRevenue,
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    totalOrders,
    pending,
    processing,
    shipped,
    delivered,
    cancelled,
    totalCustomers,
    newCustomers,
    totalProducts,
    paidPayments,
    failedPayments,
    refunds,
  ] = await Promise.all([
    sumPaid(),
    sumPaid(today),
    sumPaid(week),
    sumPaid(month),
    sumPaid(year),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: { $in: ["pending_payment", "paid"] } }),
    Order.countDocuments({ orderStatus: { $in: ["processing", "approved"] } }),
    Order.countDocuments({ orderStatus: "shipped" }),
    Order.countDocuments({ orderStatus: "delivered" }),
    Order.countDocuments({ orderStatus: "cancelled" }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", createdAt: { $gte: month } }),
    Product.countDocuments(),
    Payment.countDocuments({ status: "paid" }),
    Payment.countDocuments({ status: "failed" }),
    Payment.countDocuments({ status: { $in: ["refunded", "partially_refunded"] } }),
  ]);

  const bestSelling = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);

  const inventory = await inventoryService.listInventory();
  const lowStockProducts = inventory.products.filter(
    (p) => p.stockStatus === "low_stock"
  );
  const outOfStockProducts = inventory.products.filter(
    (p) => p.stockStatus === "out_of_stock"
  );

  return {
    revenue: {
      total: totalRevenue.total,
      today: todayRevenue.total,
      weekly: weeklyRevenue.total,
      monthly: monthlyRevenue.total,
      yearly: yearlyRevenue.total,
    },
    orders: {
      total: totalOrders,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
    },
    customers: {
      total: totalCustomers,
      newThisMonth: newCustomers,
    },
    products: {
      total: totalProducts,
      bestSelling,
      lowStock: lowStockProducts.length,
      outOfStock: outOfStockProducts.length,
    },
    payments: {
      successful: paidPayments,
      failed: failedPayments,
      refunds,
    },
    lowStockProducts,
    outOfStockProducts,
  };
}

async function getSalesChart(period = "month") {
  const paid = await Payment.find({ status: "paid" }).sort({ createdAt: 1 });
  const sales = [];

  if (period === "week") {
    for (let i = 6; i >= 0; i -= 1) {
      const date = daysAgo(i);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const day = paid.filter((p) => p.createdAt >= date && p.createdAt <= end);
      sales.push({
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: day.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        orders: day.length,
      });
    }
  } else if (period === "year") {
    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i, 1);
      date.setHours(0, 0, 0, 0);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthPayments = paid.filter((p) => {
        return p.createdAt.getMonth() === month && p.createdAt.getFullYear() === year;
      });
      sales.push({
        label: date.toLocaleDateString("en-US", { month: "short" }),
        revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        orders: monthPayments.length,
      });
    }
  } else {
    for (let i = 29; i >= 0; i -= 1) {
      const date = daysAgo(i);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const day = paid.filter((p) => p.createdAt >= date && p.createdAt <= end);
      sales.push({
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        revenue: day.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        orders: day.length,
      });
    }
  }

  return sales;
}

async function getDashboard() {
  const analytics = await getAnalytics();
  const recentOrders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(8);
  const recentPayments = await Payment.find()
    .populate("user", "name email")
    .populate("order", "orderNumber")
    .sort({ createdAt: -1 })
    .limit(8);
  const settings = await getSettings();

  return {
    totalCustomers: analytics.customers.total,
    totalProducts: analytics.products.total,
    totalOrders: analytics.orders.total,
    totalSales: analytics.revenue.total,
    pendingOrders: analytics.orders.pending,
    lowStock: analytics.products.lowStock,
    recentOrders,
    recentPayments,
    bestSelling: analytics.products.bestSelling,
    currency: settings.currency,
    analytics,
  };
}

module.exports = { getAnalytics, getSalesChart, getDashboard };
