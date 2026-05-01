import express from "express";
import db from "../db.js";
import { adminOnly, protect } from "../middleware/auth.js";
import { isNonEmptyString, isNonNegativeInteger, isPositiveNumber, isValidUrl, toSafeTrimmed } from "../utils/validators.js";

const router = express.Router();
router.use(protect, adminOnly);

router.get("/insights", (_, res) => {
  const totalSales = db.prepare("SELECT IFNULL(SUM(total), 0) as total FROM orders WHERE paymentStatus = 'Paid'").get().total;
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
  res.json({ totalSales, totalOrders, totalUsers, totalProducts });
});

router.get("/products", (_, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category
    FROM products p JOIN categories c ON c.id = p.categoryId
    ORDER BY p.createdAt DESC
  `).all();
  res.json(products);
});

router.post("/products", (req, res) => {
  const { title, description, image, price, stock, categoryId } = req.body;
  if (!isNonEmptyString(title, 3, 120)) return res.status(400).json({ message: "Title must be 3-120 characters" });
  if (!isNonEmptyString(description, 10, 1000)) {
    return res.status(400).json({ message: "Description must be 10-1000 characters" });
  }
  if (!isValidUrl(image)) return res.status(400).json({ message: "Image must be a valid URL" });
  if (!isPositiveNumber(price)) return res.status(400).json({ message: "Price must be greater than 0" });
  if (!isNonNegativeInteger(stock)) return res.status(400).json({ message: "Stock must be a non-negative integer" });
  const categoryExists = db.prepare("SELECT id FROM categories WHERE id = ?").get(Number(categoryId));
  if (!categoryExists) return res.status(400).json({ message: "Category not found" });

  const result = db.prepare(`
    INSERT INTO products (title, description, image, price, stock, categoryId)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(toSafeTrimmed(title), toSafeTrimmed(description), toSafeTrimmed(image), Number(price), Number(stock), Number(categoryId));
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put("/products/:id", (req, res) => {
  const { title, description, image, price, stock, categoryId } = req.body;
  if (!isNonEmptyString(title, 3, 120)) return res.status(400).json({ message: "Title must be 3-120 characters" });
  if (!isNonEmptyString(description, 10, 1000)) {
    return res.status(400).json({ message: "Description must be 10-1000 characters" });
  }
  if (!isValidUrl(image)) return res.status(400).json({ message: "Image must be a valid URL" });
  if (!isPositiveNumber(price)) return res.status(400).json({ message: "Price must be greater than 0" });
  if (!isNonNegativeInteger(stock)) return res.status(400).json({ message: "Stock must be a non-negative integer" });

  db.prepare(`
    UPDATE products
    SET title = ?, description = ?, image = ?, price = ?, stock = ?, categoryId = ?
    WHERE id = ?
  `).run(toSafeTrimmed(title), toSafeTrimmed(description), toSafeTrimmed(image), Number(price), Number(stock), Number(categoryId), req.params.id);
  res.json({ message: "Product updated" });
});

router.delete("/products/:id", (req, res) => {
  const inOrders = db.prepare("SELECT id FROM order_items WHERE productId = ? LIMIT 1").get(req.params.id);
  if (inOrders) {
    return res.status(400).json({ message: "Cannot delete product that exists in orders" });
  }
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  db.prepare("DELETE FROM wishlist WHERE productId = ?").run(req.params.id);
  db.prepare("DELETE FROM reviews WHERE productId = ?").run(req.params.id);
  res.json({ message: "Product deleted" });
});

router.get("/orders", (_, res) => {
  const orders = db.prepare(`
    SELECT o.*, u.name as customerName, u.email as customerEmail
    FROM orders o JOIN users u ON u.id = o.userId
    ORDER BY o.createdAt DESC
  `).all();
  res.json(orders);
});

router.patch("/orders/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ message: "Order status updated" });
});

router.get("/users", (_, res) => {
  const users = db.prepare("SELECT id, name, email, role, createdAt FROM users ORDER BY createdAt DESC").all();
  res.json(users);
});

router.get("/categories", (_, res) => {
  const categories = db.prepare("SELECT * FROM categories ORDER BY name").all();
  res.json(categories);
});

router.post("/categories", (req, res) => {
  const { name } = req.body;
  const cleanName = toSafeTrimmed(name);
  if (!isNonEmptyString(cleanName, 2, 80)) {
    return res.status(400).json({ message: "Category name must be 2-80 characters" });
  }
  try {
    const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(cleanName);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch {
    res.status(409).json({ message: "Category already exists" });
  }
});

router.delete("/categories/:id", (req, res) => {
  const used = db.prepare("SELECT id FROM products WHERE categoryId = ? LIMIT 1").get(req.params.id);
  if (used) {
    return res.status(400).json({ message: "Category is in use and cannot be removed" });
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ message: "Unused category removed" });
});

export default router;
