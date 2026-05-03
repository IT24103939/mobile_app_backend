const express = require("express");
const Garage = require("../models/Garage");
const { requireAuth } = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/mapDoc");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const garages = await Garage.find().sort({ createdAt: -1 });
    return res.json(mapDocs(garages));
  } catch (error) {
    return next(error);
  }
});

router.get("/owner", requireAuth, async (req, res, next) => {
  try {
    const garages = await Garage.find({ ownerId: req.authUserId }).sort({ createdAt: -1 });
    return res.json(mapDocs(garages));
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    return res.json(mapDoc(garage));
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      ownerId: req.authUserId
    };

    const garage = await Garage.create(payload);
    return res.status(201).json(mapDoc(garage));
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    if (garage.ownerId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    Object.assign(garage, req.body);
    garage.ownerId = req.authUserId;
    await garage.save();

    return res.json(mapDoc(garage));
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    if (garage.ownerId !== req.authUserId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Garage.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
