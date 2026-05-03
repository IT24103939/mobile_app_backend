const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true, default: "" },
    items: [
      {
        partId: { type: String, required: true },
        supplierId: { type: String, required: true, index: true },
        partName: { type: String, required: true },
        brand: { type: String, trim: true, default: "" },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 }
      }
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
      index: true
    },
    notes: { type: String, trim: true, default: "" }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
