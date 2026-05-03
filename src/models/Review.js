const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    targetId: { type: String, required: true }, // Can be garageId or supplierId
    targetType: { 
      type: String, 
      enum: ["GARAGE", "SUPPLIER"], 
      required: true 
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Review", reviewSchema);
