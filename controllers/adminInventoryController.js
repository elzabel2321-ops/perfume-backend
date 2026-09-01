const InventoryMovement = require("../models/InventoryMovement");
const { sendError } = require("../utils/httpError");
const inventoryService = require("../services/inventoryService");

const getInventory = async (req, res) => {
  try {
    const data = await inventoryService.listInventory();
    return res.status(200).json({
      success: true,
      ok: true,
      summary: data.summary,
      products: data.products,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getMovements = async (req, res) => {
  try {
    const movements = await InventoryMovement.find({
      product: req.params.id,
    })
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ ok: true, movements });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateStock = async (req, res) => {
  try {
    const product = await inventoryService.adjustStock(
      req.params.id,
      req.body.stock,
      req.user.id,
      req.body.note
    );
    if (req.body.lowStockThreshold !== undefined) {
      product.lowStockThreshold = Number(req.body.lowStockThreshold);
      await product.save();
    }
    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      product,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const increaseStock = async (req, res) => {
  try {
    const product = await inventoryService.changeStockBy(
      req.params.id,
      Number(req.body.quantity),
      req.user.id,
      req.body.note || "Stock added"
    );
    return res.status(200).json({
      success: true,
      message: "Stock increased successfully",
      product,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const decreaseStock = async (req, res) => {
  try {
    const product = await inventoryService.changeStockBy(
      req.params.id,
      -Number(req.body.quantity),
      req.user.id,
      req.body.note || "Stock removed"
    );
    return res.status(200).json({
      success: true,
      message: "Stock decreased successfully",
      product,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getInventory,
  getMovements,
  updateStock,
  increaseStock,
  decreaseStock,
};
