const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["USER", "GARAGE_OWNER", "SUPPLIER", "ADMIN"],
      required: true
    },
    resetPasswordOtp: { type: String },
    resetPasswordExpires: { type: Date }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
