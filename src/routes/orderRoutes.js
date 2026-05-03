const express = require("express");
const Order = require("../models/Order");
const SparePart = require("../models/SparePart");
const User = require("../models/User");
const Payment = require("../models/Payment");
const { requireAuth } = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/mapDoc");
const emailService = require("../services/emailService");

const router = express.Router();

// Get all orders (admin)
router.get("/", async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json(mapDocs(orders));
  } catch (error) {
    return next(error);
  }
});

// Get user's orders
router.get("/my-orders", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.authUserId }).sort({ createdAt: -1 });
    return res.json(mapDocs(orders));
  } catch (error) {
    return next(error);
  }
});

// Get supplier's orders
router.get("/supplier-orders", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.aggregate([
      {
        $match: { "items.supplierId": req.authUserId }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);
    return res.json(orders.map((order) => ({ ...order, id: order._id })));
  } catch (error) {
    return next(error);
  }
});

// Get supplier's revenue stats
router.get("/supplier-revenue", requireAuth, async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      {
        $match: { "items.supplierId": req.authUserId }
      },
      {
        $unwind: "$items"
      },
      {
        $match: { "items.supplierId": req.authUserId }
      },
      {
        $group: {
          _id: "$items.supplierId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$items.subtotal" },
          totalItems: { $sum: "$items.quantity" },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0]
            }
          },
          pendingOrders: {
            $sum: {
              $cond: [
                { $in: ["$status", ["PENDING", "CONFIRMED", "SHIPPED"]] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalOrders: 0,
        totalRevenue: 0,
        totalItems: 0,
        completedOrders: 0,
        pendingOrders: 0
      });
    }

    return res.json(stats[0]);
  } catch (error) {
    return next(error);
  }
});

// Get single order
router.get("/:id", async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.json(mapDoc(order));
  } catch (error) {
    return next(error);
  }
});

// Create order (customer places order)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { items, customerName, customerPhone, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    // Calculate total and validate
    let totalAmount = 0;
    for (const item of items) {
      if (!item.partId || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ message: "Invalid item data" });
      }
      item.subtotal = item.quantity * item.unitPrice;
      totalAmount += item.subtotal;
    }

    const order = await Order.create({
      customerId: req.authUserId,
      customerName: customerName || "Guest",
      customerPhone: customerPhone || "",
      items,
      totalAmount,
      notes: notes || ""
    });

    // Update spare part quantities
    for (const item of items) {
      await SparePart.findByIdAndUpdate(
        item.partId,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }

    return res.status(201).json(mapDoc(order));
  } catch (error) {
    return next(error);
  }
});

// Update order status (supplier or admin)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is supplier of any items in this order
    const isSupplier = order.items.some((item) => item.supplierId === req.authUserId);
    if (!isSupplier) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const previousStatus = order.status;
    Object.assign(order, req.body);
    await order.save();

    // Send email notification if status changed to CONFIRMED
    if (req.body.status === "CONFIRMED" && previousStatus !== "CONFIRMED") {
      try {
        const customer = await User.findById(order.customerId);
        if (customer && customer.email) {
          await emailService.sendOrderConfirmedEmail(customer.email, customer.fullName, order);
        }
      } catch (emailError) {
        console.error("Error sending order confirmation email:", emailError);
      }
    }

    // Send email notification if status changed to SHIPPED
    if (req.body.status === "SHIPPED" && previousStatus !== "SHIPPED") {
      try {
        const customer = await User.findById(order.customerId);
        if (customer && customer.email) {
          await emailService.sendOrderShippedEmail(customer.email, customer.fullName, order);
        }
      } catch (emailError) {
        console.error("Error sending order shipped email:", emailError);
      }
    }

    // Automatically confirm payment if order is CONFIRMED or SHIPPED
    if (["CONFIRMED", "SHIPPED"].includes(req.body.status) && !["CONFIRMED", "SHIPPED"].includes(previousStatus)) {
      try {
        const payment = await Payment.findOne({ orderId: order._id });
        if (payment && payment.status !== "PAID") {
          payment.status = "PAID";
          payment.paidAt = payment.paidAt || new Date();
          await payment.save();
        }
      } catch (paymentError) {
        console.error("Error auto-confirming payment:", paymentError);
      }
    }

    return res.json(mapDoc(order));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
