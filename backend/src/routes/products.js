import express from "express";
import db from "../db.js";
import { protect } from "../middleware/auth.js";
import { isNonEmptyString, toSafeTrimmed } from "../utils/validators.js";

const router = express.Router();

router.get("/", (req, res) => {
  const { q = "", category = "", sort = "newest", min = 0, max = 999999 } = req.query;

  const sortMap = {
    newest: "p.createdAt DESC",
    priceAsc: "p.price ASC",
    priceDesc: "p.price DESC",
    rating: "p.rating DESC"
  };

  const rows = db.prepare(`
    SELECT p.*, c.name as category
    FROM products p
    JOIN categories c ON c.id = p.categoryId
    WHERE p.title LIKE @q
      AND c.name LIKE @category
      AND p.price BETWEEN @min AND @max
    ORDER BY ${sortMap[sort] ?? sortMap.newest}
  `).all({
    q: `%${q}%`,
    category: `%${category}%`,
    min: Number(min),
    max: Number(max)
  });

  res.json(rows);
});

router.get("/:id", (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category
    FROM products p JOIN categories c ON c.id = p.categoryId
    WHERE p.id = ?
  `).get(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const reviews = db.prepare(`
    SELECT r.*, u.name as userName
    FROM reviews r JOIN users u ON u.id = r.userId
    WHERE r.productId = ?
    ORDER BY r.createdAt DESC
  `).all(req.params.id);

  res.json({ ...product, reviews });
});

router.post("/:id/reviews", protect, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ message: "Rating and comment are required" });
  const numericRating = Number(rating);
  const cleanComment = toSafeTrimmed(comment);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
  }
  if (!isNonEmptyString(cleanComment, 5, 500)) {
    return res.status(400).json({ message: "Comment must be between 5 and 500 characters" });
  }
  const exists = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!exists) return res.status(404).json({ message: "Product not found" });

  try {
    db.prepare(`
      INSERT INTO reviews (userId, productId, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, req.params.id, numericRating, cleanComment);
  } catch {
    return res.status(409).json({ message: "You have already reviewed this product" });
  }

  const agg = db.prepare(`
    SELECT ROUND(AVG(rating), 1) as rating, COUNT(*) as count
    FROM reviews WHERE productId = ?
  `).get(req.params.id);

  db.prepare(`
    UPDATE products SET rating = ?, reviewsCount = ?
    WHERE id = ?
  `).run(agg.rating ?? 0, agg.count ?? 0, req.params.id);

  res.status(201).json({ message: "Review added" });
});

export default router;
