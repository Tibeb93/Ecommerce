import express from "express";
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
  const safeUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  return res.status(201).json({ token: signToken(safeUser.id), user: safeUser });
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

export default router;
