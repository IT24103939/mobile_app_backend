const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    supplierId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR" },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true
    },
    paymentMethod: { type: String, enum: ["CARD", "BANK_TRANSFER", "CASH", "WALLET"], default: "CARD" },
    transactionId: { type: String, trim: true, default: "" },
    reference: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    paidAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
