const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { seedCatalogProducts } = require("../services/seedCatalog");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
    await ensureAdminAccount();
    await seedCatalogProducts();
  } catch (error) {
    console.log("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

async function ensureAdminAccount() {
  const email = String(
    process.env.ADMIN_EMAIL || "elzabel2321@gmail.com"
  )
    .trim()
    .toLowerCase();

  const password = process.env.ADMIN_PASSWORD;
  const user = await User.findOne({ email });

  if (!user) {
    if (!password) {
      console.log(
        "Admin user not found. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create one."
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log("Admin account created:", email);
    return;
  }

  const updates = {};
  if (user.role !== "admin") {
    updates.role = "admin";
  }
  if (password) {
    updates.password = await bcrypt.hash(String(password), 12);
  }

  if (Object.keys(updates).length > 0) {
    await User.updateOne({ _id: user._id }, { $set: updates });
    console.log("Admin account updated:", email);
  }
}

module.exports = connectDB;
