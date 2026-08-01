import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { isStrongPassword, isValidEmail, toSafeTrimmed } from "../utils/validators.js";

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const cleanName = toSafeTrimmed(name);
  const cleanEmail = toSafeTrimmed(email).toLowerCase();
  if (cleanName.length < 2) return res.status(400).json({ message: "Name must be at least 2 characters" });
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ message: "Invalid email format" });
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 chars and include uppercase, lowercase, and number"
    });
  }

  const exists = await User.findOne({ email: cleanEmail }).select("_id").lean();
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const hashed = bcrypt.hashSync(password, 10);
  const user = await User.create({ name: cleanName, email: cleanEmail, password: hashed, role: "customer" });

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const safeUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  return res.status(201).json({
    token: signToken(safeUser.id),
    user: safeUser,
    emailVerificationToken: verificationToken
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const cleanEmail = toSafeTrimmed(email).toLowerCase();
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ message: "Invalid email format" });

  const user = await User.findOne({ email: cleanEmail }).lean();
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const safeUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  return res.json({ token: signToken(safeUser.id), user: safeUser });
});

router.get("/me", protect, (req, res) => res.json(req.user));

router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Token is required" });

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save({ validateBeforeSave: false });

  res.json({ message: "Email verified successfully" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const cleanEmail = toSafeTrimmed(email).toLowerCase();
  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    return res.json({ message: "If that email exists, a reset link has been sent" });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  res.json({
    message: "If that email exists, a reset link has been sent",
    passwordResetToken: resetToken
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: "Token and password are required" });
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 chars and include uppercase, lowercase, and number"
    });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  user.password = bcrypt.hashSync(password, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save({ validateBeforeSave: false });

  res.json({ message: "Password reset successful" });
});

export default router;
