const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["CARD", "BANK_TRANSFER", "WALLET"], required: true },
    name: { type: String, required: true }, // e.g., "My Visa", "Primary Bank Account"
    
    // For CARD
    cardNumber: { type: String }, // Last 4 digits stored as ****1234
    cardHolder: { type: String },
    expiryMonth: { type: Number },
    expiryYear: { type: Number },
    cvv: { type: String }, // Not recommended to store - for demo only
    
    // For BANK_TRANSFER
    bankName: { type: String },
    accountNumber: { type: String }, // Last 4 digits
    accountHolder: { type: String },
    routingNumber: { type: String },
    
    // For WALLET
    walletAddress: { type: String },
    walletType: { type: String }, // e.g., "JazzCash", "Easypaisa"
    
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
