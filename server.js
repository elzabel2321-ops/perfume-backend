const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// =====================================================
// ENVIRONMENT
// =====================================================

dotenv.config();

// =====================================================
// DATABASE
// =====================================================

const connectDB =
  require("./config/db");

// =====================================================
// CUSTOMER ROUTES
// =====================================================

const authRoutes =
  require("./routes/authRoutes");

const productRoutes =
  require("./routes/productRoutes");

const cartRoutes =
  require("./routes/cartRoutes");

const orderRoutes =
  require("./routes/orderRoutes");

const paymentRoutes =
  require("./routes/paymentRoutes");

const checkoutRoutes =
  require("./routes/checkoutRoutes");

const notificationRoutes =
  require("./routes/notificationRoutes");

// =====================================================
// ADMIN ROUTES
// =====================================================

const adminRoutes =
  require("./routes/adminRoutes");

const adminDashboardRoutes =
  require("./routes/adminDashboardRoutes");

const adminProductRoutes =
  require("./routes/adminProductRoutes");

const adminOrderRoutes =
  require("./routes/adminOrderRoutes");

const adminCustomerRoutes =
  require("./routes/adminCustomerRoutes");

const adminInventoryRoutes =
  require("./routes/adminInventoryRoutes");

const adminPaymentRoutes =
  require("./routes/adminPaymentRoutes");

const adminAnalyticsRoutes =
  require("./routes/adminAnalyticsRoutes");

const adminSettingsRoutes =
  require("./routes/adminSettingsRoutes");

const adminSalesRoutes =
  require("./routes/adminSalesRoutes");

// =====================================================
// EXPRESS APP
// =====================================================

const app =
  express();

const PORT =
  process.env.PORT || 4000;

// =====================================================
// ENVIRONMENT CHECK
// =====================================================

if (!process.env.JWT_SECRET) {
  console.error(
    "❌ JWT_SECRET is missing from .env"
  );

  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error(
    "❌ MONGO_URI is missing from .env"
  );

  process.exit(1);
}

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// CUSTOMER ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/cart",
  cartRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/checkout",
  checkoutRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

// =====================================================
// ADMIN ROUTES
// =====================================================

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);

app.use(
  "/api/admin/products",
  adminProductRoutes
);

app.use(
  "/api/admin/orders",
  adminOrderRoutes
);

app.use(
  "/api/admin/customers",
  adminCustomerRoutes
);

app.use(
  "/api/admin/inventory",
  adminInventoryRoutes
);

app.use(
  "/api/admin/payment",
  adminPaymentRoutes
);

app.use(
  "/api/admin/payments",
  adminPaymentRoutes
);

app.use(
  "/api/admin/analytics",
  adminAnalyticsRoutes
);

app.use(
  "/api/admin/sales",
  adminSalesRoutes
);

app.use(
  "/api/admin/settings",
  adminSettingsRoutes
);

// =====================================================
// HOME
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      message:
        "Perfume API is running...",
    });
  }
);

// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      message:
        "Route not found",

      path:
        req.originalUrl,
    });
  }
);

// =====================================================
// GLOBAL ERROR
// =====================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER ERROR:",
      err
    );

    res.status(
      err.status || 500
    ).json({
      message:
        err.message ||
        "Internal server error",
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );
  }
);