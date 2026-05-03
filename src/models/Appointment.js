const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    garageId: { type: String, required: true, index: true },
    garageOwnerId: { type: String, required: true, index: true },
    garageName: { type: String, required: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    service: { type: String, required: true },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
