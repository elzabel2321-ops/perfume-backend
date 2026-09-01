const Product = require("../models/Product");

// ==========================================
// ADMIN → GET ALL PRODUCTS
// ==========================================
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      ok: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get all products error:", error);

    res.status(500).json({
      ok: false,
      message: "Failed to get products",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN → GET SINGLE PRODUCT
// ==========================================
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    ).populate("createdBy", "name email");

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      ok: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      ok: false,
      message: "Failed to get product",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN → CREATE PRODUCT
// ==========================================
const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      price,
      image,
      category,
      stock,
    } = req.body;

    // Check required fields
    if (
      !name ||
      !brand ||
      !description ||
      price === undefined ||
      !category
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Name, brand, description, price and category are required",
      });
    }

    const product = await Product.create({
      name,
      brand,
      description,
      price,
      image: image || "",
      category,
      stock: stock || 0,
      createdBy: req.user.id,
    });

    res.status(201).json({
      ok: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      ok: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN → UPDATE PRODUCT
// ==========================================
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: "Product not found",
      });
    }

    const {
      name,
      brand,
      description,
      price,
      image,
      category,
      stock,
    } = req.body;

    product.name =
      name !== undefined ? name : product.name;

    product.brand =
      brand !== undefined ? brand : product.brand;

    product.description =
      description !== undefined
        ? description
        : product.description;

    product.price =
      price !== undefined
        ? price
        : product.price;

    product.image =
      image !== undefined
        ? image
        : product.image;

    product.category =
      category !== undefined
        ? category
        : product.category;

    product.stock =
      stock !== undefined
        ? stock
        : product.stock;

    await product.save();

    res.status(200).json({
      ok: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      ok: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN → DELETE PRODUCT
// ==========================================
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      ok: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};