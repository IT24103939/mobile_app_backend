const mongoose = require("mongoose");

const garageSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    openingHours: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    services: { type: [String], default: [] },
    mapQuery: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Garage", garageSchema);
