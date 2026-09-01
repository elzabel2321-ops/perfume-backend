require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

async function fixAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    const email = "elzabel2321@gmail.com";

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      console.log("❌ User not found:", email);
      return;
    }

    console.log("Before:");
    console.log("Email:", user.email);
    console.log("Name:", user.name);
    console.log("Role:", user.role);

    // ==========================================
    // FIX ROLE
    // ==========================================

    user.role = "admin";

    await user.save();

    console.log("================================");
    console.log("✅ ADMIN ROLE FIXED");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("================================");
  } catch (error) {
    console.error("❌ ERROR:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAdmin();