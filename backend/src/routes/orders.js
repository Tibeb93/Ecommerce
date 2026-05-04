import express from "express";
import { protect } from "../middleware/auth.js";
import { isNonEmptyString } from "../utils/validators.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

const router = express.Router();

const makeTrackingCode = () => `TRK-${Date.now().toString().slice(-8)}`;

router.post("/", protect, async (req, res) => {
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
    const product = await Product.findById(item.productId).select("_id price stock title").lean();
    if (!product) return res.status(400).json({ message: "Invalid product found in cart" });
    if (item.quantity > product.stock) {
      return res.status(400).json({ message: `${product.title} has insufficient stock` });
    }
    const qty = Number(item.quantity);
    total += product.price * qty;
    normalized.push({ productId: product._id, quantity: qty, unitPrice: product.price });
  }

  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      for (const item of normalized) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } }, { session });
      }

      order = await Order.create(
        [
          {
            userId: req.user.id,
            total: Number(total.toFixed(2)),
            status: "Processing",
            paymentStatus: "Paid",
            paymentMethod,
            shippingAddress,
            trackingCode: makeTrackingCode(),
            items: normalized
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({ ...order[0].toObject(), id: order[0]._id });
});

router.get("/my", protect, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json(orders.map((o) => ({ ...o, id: o._id })));
});

router.get("/my/:id", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id })
    .populate("items.productId", "title image")
    .lean();
  if (!order) return res.status(404).json({ message: "Order not found" });

  const items = order.items.map((i) => ({
    ...i,
    title: i.productId?.title,
    image: i.productId?.image
  }));
  res.json({ ...order, id: order._id, items });
});

export default router;
