const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminProductController");

// ==========================================
// ADMIN PRODUCT ROUTES
// ==========================================

// GET all products
// GET /api/admin/products
router.get(
  "/",
  protect,
  adminOnly,
  getAllProducts
);

// GET one product
// GET /api/admin/products/:id
router.get(
  "/:id",
  protect,
  adminOnly,
  getProductById
);

// CREATE product
// POST /api/admin/products
router.post(
  "/",
  protect,
  adminOnly,
  createProduct
);

// UPDATE product
// PUT /api/admin/products/:id
router.put(
  "/:id",
  protect,
  adminOnly,
  updateProduct
);

// DELETE product
// DELETE /api/admin/products/:id
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteProduct
);

module.exports = router;