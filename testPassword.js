require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI;

async function testPassword() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");

    const email =
      "birukhiwot7@gmail.com";

    // IMPORTANT:
    // Put the EXACT password you used
    // on the Reset Password page here.
    const password =
      "1221hiwi";

    const user = await User.findOne({
      email,
    });

    if (!user) {
      console.log("❌ USER NOT FOUND");
      return;
    }

    console.log("================================");
    console.log("USER FOUND");
    console.log("Email:", user.email);
    console.log("Name:", user.name);
    console.log("Role:", user.role);
    console.log(
      "Password exists:",
      !!user.password
    );
    console.log(
      "Password length:",
      user.password?.length
    );
    console.log(
      "Password starts with:",
      user.password?.substring(0, 7)
    );

    const result = await bcrypt.compare(
      password,
      user.password
    );

    console.log("================================");
    console.log(
      "Password comparison result:",
      result
    );

    if (result) {
      console.log(
        "✅ PASSWORD MATCHES"
      );
    } else {
      console.log(
        "❌ PASSWORD DOES NOT MATCH"
      );
    }
  } catch (error) {
    console.error(
      "Test error:",
      error
    );
  } finally {
    await mongoose.disconnect();
  }
}

testPassword();