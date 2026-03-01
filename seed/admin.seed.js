import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../modules/user/user.model.js";
import { ROLES } from "../constants/roles.js";

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to database");

    const email = env.SUPER_ADMIN_EMAIL;
    const password = env.SUPER_ADMIN_PASSWORD;
    const name = env.SUPER_ADMIN_NAME || "Super Admin";

    if (!email || !password) {
      throw new Error(
        "Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in env"
      );
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password,
        role: ROLES.ADMIN, // 🔥 Single source of truth
      });

      console.log("Super admin user created:", user.email);
    } else {
      // Ensure role is ADMIN
      if (user.role !== ROLES.ADMIN) {
        user.role = ROLES.ADMIN;
        await user.save();
        console.log("Existing user promoted to ADMIN.");
      } else {
        console.log("User already has ADMIN role.");
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding super admin:", error);
    process.exit(1);
  }
};

seedSuperAdmin();