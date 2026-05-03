const mongoose = require("mongoose");

const sparePartSchema = new mongoose.Schema(
  {
    supplierId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    garageCompatibleIds: { type: [String], default: [] },
    description: { type: String, trim: true, default: "" },
    image: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SparePart", sparePartSchema);
