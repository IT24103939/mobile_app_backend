const express = require("express");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/mapDoc");
const emailService = require("../services/emailService");

const router = express.Router();

// Get customer's payments
router.get("/customer", requireAuth, async (req, res, next) => {
  try {
    const payments = await Payment.find({ customerId: req.authUserId }).sort({ createdAt: -1 });
    return res.json(mapDocs(payments));
  } catch (error) {
    return next(error);
  }
});

// Get supplier's pending payments (to receive)
router.get("/supplier/pending", requireAuth, async (req, res, next) => {
  try {
    const payments = await Payment.find({
      supplierId: req.authUserId,
      status: { $in: ["PENDING", "SENT"] }
    }).sort({ createdAt: -1 });
    return res.json(mapDocs(payments));
  } catch (error) {
    return next(error);
  }
});

// Get supplier's paid payments (received)
router.get("/supplier/paid", requireAuth, async (req, res, next) => {
  try {
    const payments = await Payment.find({
      supplierId: req.authUserId,
      status: "PAID"
    }).sort({ createdAt: -1 });
    return res.json(mapDocs(payments));
  } catch (error) {
    return next(error);
  }
});

// Get supplier's payment stats
router.get("/supplier/stats", requireAuth, async (req, res, next) => {
  try {
    const stats = await Payment.aggregate([
      {
        $match: { supplierId: req.authUserId }
      },
      {
        $group: {
          _id: "$supplierId",
          totalPaymentsPending: {
            $sum: {
              $cond: [{ $in: ["$status", ["PENDING", "SENT"]] }, "$amount", 0]
            }
          },
          totalPaymentsReceived: {
            $sum: {
              $cond: [{ $eq: ["$status", "PAID"] }, "$amount", 0]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["PENDING", "SENT"]] }, 1, 0]
            }
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "PAID"] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalPaymentsPending: 0,
        totalPaymentsReceived: 0,
        pendingCount: 0,
        paidCount: 0
      });
    }

    return res.json(stats[0]);
  } catch (error) {
    return next(error);
  }
});

// Get single payment
router.get("/:id", async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    return res.json(mapDoc(payment));
  } catch (error) {
    return next(error);
  }
});

// Create payment for order
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { orderId, paymentMethod, reference, notes } = req.body;

    // Verify order exists and belongs to customer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.customerId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({ message: "Payment already exists for this order" });
    }

    // Get the supplier from the first item
    const supplierId = order.items[0].supplierId;

    const payment = await Payment.create({
      orderId,
      customerId: req.authUserId,
      supplierId,
      amount: order.totalAmount,
      paymentMethod: paymentMethod || "CARD",
      reference: reference || "",
      notes: notes || ""
    });

    return res.status(201).json(mapDoc(payment));
  } catch (error) {
    return next(error);
  }
});

// Process payment (mark as paid)
router.post("/:id/process", requireAuth, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify it belongs to the customer
    if (payment.customerId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Mark as SENT (Sent by customer)
    payment.status = "SENT";
    payment.paidAt = new Date();
    payment.transactionId = `TXN-${Date.now()}`;
    await payment.save();

    return res.json(mapDoc(payment));
  } catch (error) {
    return next(error);
  }
});

// Supplier confirms payment received
router.put("/:id/confirm", requireAuth, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify it belongs to the supplier
    if (payment.supplierId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    Object.assign(payment, req.body);
    payment.status = "PAID";
    payment.paidAt = new Date();
    await payment.save();

    // Also update order status to CONFIRMED if it was PENDING
    try {
      const order = await Order.findById(payment.orderId);
      if (order) {
        let statusChanged = false;
        if (order.status === "PENDING") {
          order.status = "CONFIRMED";
          await order.save();
          statusChanged = true;
        }

        // Send email notification to user
        const customer = await User.findById(order.customerId);
        if (customer && customer.email) {
          await emailService.sendOrderConfirmedEmail(customer.email, customer.fullName, order);
        }
      }
    } catch (err) {
      console.error("Error syncing order/email on payment confirmation:", err);
    }

    return res.json(mapDoc(payment));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
