const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { mapDoc } = require("../utils/mapDoc");

const router = express.Router();

router.use(requireAuth);

router.get("/me", async (req, res, next) => {
  try {
    const user = await User.findById(req.authUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(mapDoc(user));
  } catch (error) {
    return next(error);
  }
});

router.post("/setup-email", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findById(req.authUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.email) return res.status(400).json({ message: "Email already set for this account" });

    const existingEmail = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingEmail) return res.status(409).json({ message: "Email already in use by another account" });

    user.email = String(email).toLowerCase().trim();
    await user.save();
    return res.json(mapDoc(user));
  } catch (error) {
    return next(error);
  }
});

router.put("/me", async (req, res, next) => {
  try {
    const { fullName, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.authUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: "currentPassword is required" });
    }

    let passwordOk = await bcrypt.compare(currentPassword, user.password);
    if (!passwordOk && user.password === currentPassword) {
      passwordOk = true;
      user.password = await bcrypt.hash(currentPassword, 10);
    }

    if (!passwordOk) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (fullName) {
      user.fullName = String(fullName).trim();
    }

    if (phone) {
      const normalizedPhone = String(phone).trim();
      if (normalizedPhone !== user.phone) {
        const duplicate = await User.findOne({ phone: normalizedPhone });
        if (duplicate) {
          return res.status(409).json({ message: "Phone already in use" });
        }
        user.phone = normalizedPhone;
      }
    }

    if (newPassword) {
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    return res.json(mapDoc(user));
  } catch (error) {
    return next(error);
  }
});

router.delete("/me", async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.authUserId);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
