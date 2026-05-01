import express from "express";
import db from "../db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, (req, res) => {
  const items = db.prepare(`
    SELECT p.*, c.name as category
    FROM wishlist w
    JOIN products p ON p.id = w.productId
    JOIN categories c ON c.id = p.categoryId
    WHERE w.userId = ?
    ORDER BY w.createdAt DESC
  `).all(req.user.id);
  res.json(items);
});

router.post("/:productId", protect, (req, res) => {
  try {
    db.prepare("INSERT INTO wishlist (userId, productId) VALUES (?, ?)").run(req.user.id, req.params.productId);
    res.status(201).json({ message: "Added to wishlist" });
  } catch {
    res.status(409).json({ message: "Already in wishlist" });
  }
});

router.delete("/:productId", protect, (req, res) => {
  db.prepare("DELETE FROM wishlist WHERE userId = ? AND productId = ?").run(req.user.id, req.params.productId);
  res.json({ message: "Removed from wishlist" });
});

export default router;
