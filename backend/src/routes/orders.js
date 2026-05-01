import express from "express";
import db from "../db.js";
import { protect } from "../middleware/auth.js";
import { isNonEmptyString } from "../utils/validators.js";

const router = express.Router();

const makeTrackingCode = () => `TRK-${Date.now().toString().slice(-8)}`;

router.post("/", protect, (req, res) => {
  const { items = [], shippingAddress, paymentMethod = "Card" } = req.body;
  if (!items.length || !shippingAddress) {
    return res.status(400).json({ message: "Items and shipping address are required" });
  }
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Cart items are required" });
  if (!isNonEmptyString(shippingAddress, 10, 500)) {
    return res.status(400).json({ message: "Shipping address must be between 10 and 500 characters" });
  }
  if (!["Card", "PayPal", "CashOnDelivery"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Unsupported payment method" });
  }

  let total = 0;
  const normalized = [];

  for (const item of items) {
    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }
    const product = db.prepare("SELECT id, price, stock, title FROM products WHERE id = ?").get(item.productId);
    if (!product) return res.status(400).json({ message: "Invalid product found in cart" });
    if (item.quantity > product.stock) {
      return res.status(400).json({ message: `${product.title} has insufficient stock` });
    }
    const qty = Number(item.quantity);
    total += product.price * qty;
    normalized.push({ productId: product.id, quantity: qty, unitPrice: product.price });
  }

  const createOrder = db.transaction(() => {
    const order = db.prepare(`
      INSERT INTO orders (userId, total, status, paymentStatus, paymentMethod, shippingAddress, trackingCode)
      VALUES (?, ?, 'Processing', 'Paid', ?, ?, ?)
    `).run(req.user.id, Number(total.toFixed(2)), paymentMethod, shippingAddress, makeTrackingCode());

    const orderId = order.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO order_items (orderId, productId, quantity, unitPrice)
      VALUES (?, ?, ?, ?)
    `);
    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    normalized.forEach((item) => {
      insertItem.run(orderId, item.productId, item.quantity, item.unitPrice);
      updateStock.run(item.quantity, item.productId);
    });

    return db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  });

  const order = createOrder();
  res.status(201).json(order);
});

router.get("/my", protect, (req, res) => {
  const orders = db.prepare(`
    SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC
  `).all(req.user.id);
  res.json(orders);
});

router.get("/my/:id", protect, (req, res) => {
  const order = db.prepare(`
    SELECT * FROM orders WHERE id = ? AND userId = ?
  `).get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const items = db.prepare(`
    SELECT oi.*, p.title, p.image
    FROM order_items oi
    JOIN products p ON p.id = oi.productId
    WHERE oi.orderId = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

export default router;
