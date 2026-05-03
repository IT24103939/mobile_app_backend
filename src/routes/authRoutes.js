const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { mapDoc } = require("../utils/mapDoc");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "phone and password are required" });
    }

    const user = await User.findOne({ phone: String(phone).trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isValid = await bcrypt.compare(password, user.password);

    // Compatibility path for legacy demo users stored in plain text.
    if (!isValid && user.password === password) {
      isValid = true;
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: String(user._id), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: mapDoc(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { phone, email, fullName, password, role } = req.body;
    if (!phone || !email || !fullName || !password || !role) {
      return res.status(400).json({ message: "phone, email, fullName, password and role are required" });
    }

    const allowedRoles = ["USER", "GARAGE_OWNER", "SUPPLIER", "ADMIN"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingPhone = await User.findOne({ phone: String(phone).trim() });
    if (existingPhone) {
      return res.status(409).json({ message: "Phone already registered" });
    }

    const existingEmail = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      phone: String(phone).trim(),
      email: String(email).toLowerCase().trim(),
      fullName: String(fullName).trim(),
      password: passwordHash,
      role
    });

    return res.status(201).json(mapDoc(user));
  } catch (error) {
    return next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { phone, email } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    const user = await User.findOne({ phone: String(phone).trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has no email and didn't provide one, tell frontend to prompt for it
    if (!user.email && !email) {
      return res.json({ requiresEmail: true, message: "Account has no email. Please provide one for recovery." });
    }

    // If frontend provided an email (because we asked), update the user's email
    if (!user.email && email) {
      const existingEmail = await User.findOne({ email: String(email).toLowerCase().trim() });
      if (existingEmail) {
        return res.status(409).json({ message: "This email is already linked to another account" });
      }
      user.email = String(email).toLowerCase().trim();
      await user.save();
    }

    const targetEmail = user.email || String(email).toLowerCase().trim();

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    console.log(`[Mock Email] OTP for ${targetEmail} is ${otp}`);

    // Email Integration (Nodemailer)
    const emailService = process.env.EMAIL_SERVICE;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (emailUser && emailPassword) {
      try {
        const transporter = nodemailer.createTransport({
          service: emailService || "gmail",
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || "noreply@wmtapp.com",
          to: targetEmail,
          subject: "AutoHub Password Reset",
          text: `Your AutoHub verification code is: ${otp}. It expires in 15 minutes.`,
        });
        console.log(`[Email] OTP sent successfully to ${targetEmail}`);
      } catch (emailError) {
        console.error("[Email Error] Failed to send Email:", emailError);
      }
    }

    return res.json({ message: "OTP sent successfully to your email", otp }); 
  } catch (error) {
    return next(error);
  }
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required" });

    const user = await User.findOne({ phone: String(phone).trim() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetPasswordOtp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    return res.json({ message: "OTP verified successfully" });
  } catch (error) {
    return next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ message: "Phone, OTP and new password are required" });
    }

    const user = await User.findOne({ phone: String(phone).trim() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetPasswordOtp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
