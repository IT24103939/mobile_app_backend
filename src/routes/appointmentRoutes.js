const express = require("express");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/mapDoc");
const { sendBookingAddedEmail, sendBookingCancelledEmail, sendBookingConfirmedEmail } = require("../services/emailService");

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      customerId: req.authUserId,
      status: req.body.status || "PENDING"
    };

    const appointment = await Appointment.create(payload);

    try {
      const customer = await User.findById(appointment.customerId);
      const owner = await User.findById(appointment.garageOwnerId);
      if (customer && owner) {
        // Run email sending asynchronously without blocking the response
        sendBookingAddedEmail(
          customer.email, customer.fullName,
          owner.email, owner.fullName,
          appointment
        ).catch(err => console.error("Async email failed:", err));
      }
    } catch (emailErr) {
      console.error("Failed to send added email:", emailErr);
    }

    return res.status(201).json(mapDoc(appointment));
  } catch (error) {
    return next(error);
  }
});

router.get("/garage/:garageId", async (req, res, next) => {
  try {
    const rows = await Appointment.find({ garageId: req.params.garageId }).sort({ createdAt: -1 });
    return res.json(mapDocs(rows));
  } catch (error) {
    return next(error);
  }
});

router.get("/owner/my-appointments", async (req, res, next) => {
  try {
    const rows = await Appointment.find({ garageOwnerId: req.authUserId }).sort({ createdAt: -1 });
    return res.json(mapDocs(rows));
  } catch (error) {
    return next(error);
  }
});

router.get("/customer/my-appointments", async (req, res, next) => {
  try {
    const rows = await Appointment.find({ customerId: req.authUserId }).sort({ createdAt: -1 });
    return res.json(mapDocs(rows));
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const row = await Appointment.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json(mapDoc(row));
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const row = await Appointment.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const canEdit = row.customerId === req.authUserId || row.garageOwnerId === req.authUserId;
    if (!canEdit) {
      return res.status(403).json({ message: "Not allowed" });
    }

    Object.assign(row, req.body);
    await row.save();
    return res.json(mapDoc(row));
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const status = (req.query.status || req.body.status || "").toString().trim().toUpperCase();
    const allowed = ["PENDING", "CONFIRMED", "CANCELLED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const row = await Appointment.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (row.garageOwnerId !== req.authUserId && row.customerId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (status === "CANCELLED" && row.status !== "CANCELLED") {
      try {
        const customer = await User.findById(row.customerId);
        const owner = await User.findById(row.garageOwnerId);
        if (customer && owner) {
          sendBookingCancelledEmail(
            customer.email, customer.fullName,
            owner.email, owner.fullName,
            row
          ).catch(err => console.error("Async email failed:", err));
        }
      } catch (emailErr) {
        console.error("Failed to send cancelled email:", emailErr);
      }
    }

    if (status === "CONFIRMED" && row.status !== "CONFIRMED") {
      try {
        const customer = await User.findById(row.customerId);
        if (customer) {
          sendBookingConfirmedEmail(
            customer.email, customer.fullName,
            row
          ).catch(err => console.error("Async email failed:", err));
        }
      } catch (emailErr) {
        console.error("Failed to send confirmed email:", emailErr);
      }
    }

    row.status = status;
    await row.save();
    return res.json(mapDoc(row));
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const row = await Appointment.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (row.customerId !== req.authUserId && row.garageOwnerId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    try {
      const customer = await User.findById(row.customerId);
      const owner = await User.findById(row.garageOwnerId);
      if (customer && owner) {
        sendBookingCancelledEmail(
          customer.email, customer.fullName,
          owner.email, owner.fullName,
          row
        ).catch(err => console.error("Async email failed:", err));
      }
    } catch (emailErr) {
      console.error("Failed to send cancelled email:", emailErr);
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
