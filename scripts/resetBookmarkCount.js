import mongoose from "mongoose";
import dotenv from "dotenv";
import Listings from "../modules/listing/listing.model.js"; // adjust path
import {env} from "../config/env.js"

dotenv.config();

const resetBookmarkCounts = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    const result = await Listings.updateMany(
      {},
      { $set: { bookmarkCount: 0 } }
    );

    console.log(`Updated ${result.modifiedCount} listings.`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetBookmarkCounts();