const Product = require("../models/Product");
const User = require("../models/User");

const CATALOG = [
  {
    slug: "essence-of-roses",
    name: "Essence of Roses",
    brand: "A ROMANOVA",
    price: 89.99,
    category: "Floral",
    image: "/images/Essence of Roses.jpg",
    description: "A luxurious blend of premium roses with hints of sandalwood",
    stock: 24,
  },
  {
    slug: "ocean-breeze",
    name: "Ocean Breeze",
    brand: "A ROMANOVA",
    price: 79.99,
    category: "Fresh",
    image: "/images/Ocean Breeze.jpg",
    description: "Crisp and refreshing citrus with aquatic notes",
    stock: 24,
  },
  {
    slug: "midnight-elegance",
    name: "Midnight Elegance",
    brand: "A ROMANOVA",
    price: 99.99,
    category: "Oriental",
    image: "/images/Midnight Elegance.jpg",
    description: "Deep, sophisticated blend of amber and musk",
    stock: 24,
  },
  {
    slug: "vanilla-dream",
    name: "Vanilla Dream",
    brand: "A ROMANOVA",
    price: 69.99,
    category: "Sweet",
    image: "/images/Vanilla Dream.jpg",
    description: "Warm vanilla with hints of caramel and tonka bean",
    stock: 24,
  },
  {
    slug: "prada",
    name: "prada",
    brand: "A ROMANOVA",
    price: 75.99,
    category: "Floral",
    image: "/images/prada.jpg",
    description: "Fresh lavender with subtle herbal notes",
    stock: 24,
  },
  {
    slug: "gold-standard",
    name: "Gold Standard",
    brand: "A ROMANOVA",
    price: 119.99,
    category: "Luxury",
    image: "/images/Gold Standard.jpg",
    description: "Premium luxury fragrance with rare ingredients",
    stock: 24,
  },
];

async function seedCatalogProducts() {
  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    admin = await User.findOne();
  }
  if (!admin) {
    console.log("Catalog seed skipped: no user exists yet.");
    return;
  }

  for (const item of CATALOG) {
    const existing = await Product.findOne({
      $or: [{ slug: item.slug }, { name: item.name }],
    });

    if (existing) {
      if (!existing.slug) {
        existing.slug = item.slug;
        await existing.save();
      }
      continue;
    }

    await Product.create({
      ...item,
      reservedStock: 0,
      lowStockThreshold: 5,
      createdBy: admin._id,
    });
  }

  console.log("Catalog products seeded.");
}

module.exports = { seedCatalogProducts, CATALOG };
