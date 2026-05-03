const mongoose = require("mongoose");

async function connectDatabase(mongoUri) {
  const candidates = [];

  if (mongoUri) {
    candidates.push(mongoUri);
  }

  if (process.env.MONGODB_URI_FALLBACK) {
    candidates.push(process.env.MONGODB_URI_FALLBACK);
  }

  // Common local fallback when Mongo runs without authentication.
  candidates.push("mongodb://localhost:27017/wmt_garage_db");

  let lastError = null;

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log(`Connected to MongoDB via ${uri}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection failed for ${uri}: ${error.message}`);
    }
  }

  throw lastError || new Error("Failed to connect to MongoDB");
}

module.exports = {
  connectDatabase
};
