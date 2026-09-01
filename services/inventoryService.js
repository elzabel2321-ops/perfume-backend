const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const { getSettings } = require("./settingsService");
const { HttpError } = require("../utils/httpError");

function availableStock(product) {
  return Math.max(
    0,
    Number(product.stock || 0) - Number(product.reservedStock || 0)
  );
}

function stockStatus(product, defaultThreshold = 5) {
  const available = availableStock(product);
  const threshold = Number(
    product.lowStockThreshold ?? defaultThreshold
  );
  if (available <= 0) return "out_of_stock";
  if (available <= threshold) return "low_stock";
  return "in_stock";
}

async function reserveItems(items, orderId) {
  const reserved = [];

  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      {
        _id: item.product,
        $expr: {
          $gte: [
            { $subtract: ["$stock", { $ifNull: ["$reservedStock", 0] }] },
            item.quantity,
          ],
        },
      },
      { $inc: { reservedStock: item.quantity } },
      { new: true }
    );

    if (!product) {
      await releaseReservations(reserved);
      throw new HttpError(
        `Insufficient stock for ${item.name}`,
        400,
        { productId: String(item.product) }
      );
    }

    reserved.push(item);
    await InventoryMovement.create({
      product: item.product,
      delta: 0,
      reason: "reserve",
      order: orderId,
      note: `Reserved ${item.quantity} for order`,
    });
  }

  return reserved;
}

async function releaseReservations(items, orderId = null, userId = null) {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { reservedStock: -Math.abs(item.quantity) },
    });
  }
}

async function captureSale(items, order, userId = null) {
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.product,
        stock: { $gte: item.quantity },
        reservedStock: { $gte: item.quantity },
      },
      {
        $inc: {
          stock: -item.quantity,
          reservedStock: -item.quantity,
        },
      },
      { new: true }
    );

    if (!updated) {
      const fallback = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!fallback) {
        throw new HttpError(
          `Could not capture stock for ${item.name}`,
          400
        );
      }
    }

    await InventoryMovement.create({
      product: item.product,
      delta: -item.quantity,
      reason: "sale",
      order: order._id,
      note: `Order ${order.orderNumber}`,
      createdBy: userId,
    });
  }
}

async function restoreStock(items, order, userId = null, reason = "cancel_restore") {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
    await InventoryMovement.create({
      product: item.product,
      delta: item.quantity,
      reason,
      order: order._id,
      note: `Restored from ${order.orderNumber}`,
      createdBy: userId,
    });
  }
}

async function adjustStock(productId, nextStock, userId, note = "") {
  const product = await Product.findById(productId);
  if (!product) {
    throw new HttpError("Product not found", 404);
  }

  const numeric = Number(nextStock);
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new HttpError("Stock must be a non-negative integer", 400);
  }

  const delta = numeric - Number(product.stock || 0);
  product.stock = numeric;
  if (Number(product.reservedStock || 0) > numeric) {
    product.reservedStock = numeric;
  }
  await product.save();

  await InventoryMovement.create({
    product: product._id,
    delta,
    reason: delta >= 0 ? "restock" : "adjustment",
    note: note || "Admin stock update",
    createdBy: userId,
  });

  return product;
}

async function changeStockBy(productId, amount, userId, note = "") {
  const delta = Number(amount);
  if (!Number.isInteger(delta) || delta === 0) {
    throw new HttpError("Quantity must be a non-zero integer", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new HttpError("Product not found", 404);
  }

  const next = Number(product.stock || 0) + delta;
  if (next < 0) {
    throw new HttpError("Not enough stock available", 400, {
      currentStock: product.stock,
    });
  }

  return adjustStock(productId, next, userId, note);
}

async function listInventory() {
  const settings = await getSettings();
  const products = await Product.find().sort({ name: 1 });
  const defaultThreshold = settings.defaultLowStockThreshold || 5;

  const mapped = products.map((product) => {
    const available = availableStock(product);
    const status = stockStatus(product, defaultThreshold);
    return {
      ...product.toObject(),
      available,
      stockStatus: status,
    };
  });

  return {
    summary: {
      totalProducts: mapped.length,
      totalStock: mapped.reduce((sum, p) => sum + Number(p.stock || 0), 0),
      lowStock: mapped.filter((p) => p.stockStatus === "low_stock").length,
      outOfStock: mapped.filter((p) => p.stockStatus === "out_of_stock").length,
    },
    products: mapped,
  };
}

module.exports = {
  availableStock,
  stockStatus,
  reserveItems,
  releaseReservations,
  captureSale,
  restoreStock,
  adjustStock,
  changeStockBy,
  listInventory,
};
