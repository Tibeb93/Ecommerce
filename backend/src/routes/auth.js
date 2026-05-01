import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { protect } from "../middleware/auth.js";
import { isStrongPassword, isValidEmail, toSafeTrimmed } from "../utils/validators.js";

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", (req, res) => {
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

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, 'customer')
  `).run(cleanName, cleanEmail, hashed);

  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ token: signToken(user.id), user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const cleanEmail = toSafeTrimmed(email).toLowerCase();
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ message: "Invalid email format" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return res.json({ token: signToken(user.id), user: safeUser });
});

router.get("/me", protect, (req, res) => res.json(req.user));

export default router;
