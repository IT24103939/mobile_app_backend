const express = require("express");
const PaymentMethod = require("../models/PaymentMethod");
const { requireAuth } = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/mapDoc");

const router = express.Router();

// Get user's payment methods
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const methods = await PaymentMethod.find({ userId: req.authUserId, isActive: true })
      .sort({ isDefault: -1, createdAt: -1 });
    return res.json(mapDocs(methods));
  } catch (error) {
    return next(error);
  }
});

// Get single payment method
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const method = await PaymentMethod.findOne({
      _id: req.params.id,
      userId: req.authUserId
    });
    if (!method) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    return res.json(mapDoc(method));
  } catch (error) {
    return next(error);
  }
});

// Add new payment method
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { type, name, cardNumber, cardHolder, expiryMonth, expiryYear, cvv, 
            bankName, accountNumber, accountHolder, routingNumber,
            walletAddress, walletType } = req.body;

    if (!type || !name) {
      return res.status(400).json({ message: "Type and name are required" });
    }

    // If this is the first payment method, set it as default
    const existingMethods = await PaymentMethod.find({ userId: req.authUserId, isActive: true });
    const isDefault = existingMethods.length === 0;

    const paymentMethod = new PaymentMethod({
      userId: req.authUserId,
      type,
      name,
      cardNumber, // Store full number
      cardHolder,
      expiryMonth,
      expiryYear,
      cvv, // Note: For production, never store CVV
      bankName,
      accountNumber, // Store full number
      accountHolder,
      routingNumber,
      walletAddress,
      walletType,
      isDefault
    });

    const saved = await paymentMethod.save();
    return res.status(201).json(mapDoc(saved));
  } catch (error) {
    return next(error);
  }
});

// Update payment method
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { name, isDefault } = req.body;

    const method = await PaymentMethod.findOne({
      _id: req.params.id,
      userId: req.authUserId
    });

    if (!method) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    if (name) method.name = name;

    // If setting as default, unset others as default
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.authUserId, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
      method.isDefault = true;
    }

    const updated = await method.save();
    return res.json(mapDoc(updated));
  } catch (error) {
    return next(error);
  }
});

// Delete payment method (soft delete)
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const method = await PaymentMethod.findOne({
      _id: req.params.id,
      userId: req.authUserId
    });

    if (!method) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    method.isActive = false;
    
    // If this was default, set another as default
    if (method.isDefault) {
      const anotherMethod = await PaymentMethod.findOne({
        userId: req.authUserId,
        isActive: true,
        _id: { $ne: req.params.id }
      });
      if (anotherMethod) {
        anotherMethod.isDefault = true;
        await anotherMethod.save();
      }
    }

    await method.save();
    return res.json({ message: "Payment method deleted" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
