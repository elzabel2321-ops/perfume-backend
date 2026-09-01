const Product = require("../models/Product");


// CREATE
const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET ALL
const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "name email");

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET ONE
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (
      product.createdBy.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const updatedProduct =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    res.json(updatedProduct);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (
      product.createdBy.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Product deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};