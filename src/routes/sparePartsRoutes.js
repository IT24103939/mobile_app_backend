const express = require("express");
const SparePart = require("../models/SparePart");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/mapDoc");

const router = express.Router();

// Get all spare parts
router.get("/", async (req, res, next) => {
  try {
    const spareParts = await SparePart.find().sort({ createdAt: -1 });
    return res.json(mapDocs(spareParts));
  } catch (error) {
    return next(error);
  }
});

// Get supplier's spare parts (authenticated) - must come before /supplier/:supplierId
router.get("/my-inventory", requireAuth, async (req, res, next) => {
  try {
    console.log("[GET /my-inventory] Fetching inventory for supplierId:", req.authUserId);
    const spareParts = await SparePart.find({ supplierId: req.authUserId }).sort({ createdAt: -1 });
    console.log("[GET /my-inventory] Found", spareParts.length, "parts");
    return res.json(mapDocs(spareParts));
  } catch (error) {
    console.error("[GET /my-inventory] Error:", error.message);
    return next(error);
  }
});

// Get spare parts by supplier
router.get("/supplier/:supplierId", async (req, res, next) => {
  try {
    const spareParts = await SparePart.find({ supplierId: req.params.supplierId }).sort({ createdAt: -1 });
    return res.json(mapDocs(spareParts));
  } catch (error) {
    return next(error);
  }
});

/**
 * Get supplier public profile by supplierId
 * GET /api/spare-parts/supplier/:supplierId/profile
 * MUST be before /:id to avoid route shadowing
 */
router.get("/supplier/:supplierId/profile", async (req, res, next) => {
  try {
    const supplier = await User.findById(req.params.supplierId).select("-password");
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    const parts = await SparePart.find({ supplierId: req.params.supplierId });
    return res.json({
      id: supplier._id.toString(),
      fullName: supplier.fullName,
      email: supplier.email || null,
      phone: supplier.phone || null,
      role: supplier.role,
      joinedDate: supplier.createdAt,
      totalParts: parts.length,
    });
  } catch (error) {
    return next(error);
  }
});

// Get single spare part
router.get("/:id", async (req, res, next) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }
    return res.json(mapDoc(sparePart));
  } catch (error) {
    return next(error);
  }
});

// Create spare part (supplier only)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      supplierId: req.authUserId
    };

    console.log("[POST /spare-parts] Creating part for supplierId:", req.authUserId, payload);
    const sparePart = await SparePart.create(payload);
    console.log("[POST /spare-parts] Created part:", mapDoc(sparePart));
    return res.status(201).json(mapDoc(sparePart));
  } catch (error) {
    console.error("[POST /spare-parts] Error:", error.message);
    return next(error);
  }
});

// Update spare part
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }

    if (sparePart.supplierId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    Object.assign(sparePart, req.body);
    sparePart.supplierId = req.authUserId;
    await sparePart.save();

    return res.json(mapDoc(sparePart));
  } catch (error) {
    return next(error);
  }
});

// Delete spare part
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }

    if (sparePart.supplierId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await SparePart.findByIdAndDelete(req.params.id);
    return res.json({ message: "Spare part deleted" });
  } catch (error) {
    return next(error);
  }
});



module.exports = router;
