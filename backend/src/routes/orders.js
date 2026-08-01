import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import { isNonEmptyString } from "../utils/validators.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "../utils/email.js";

const router = express.Router();

const makeOrderNumber = () => `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(-4).toUpperCase()}`;
const makeTrackingCode = () => `TRK-${Date.now().toString().slice(-8)}`;

const DELIVERY_COSTS = { standard: 9.99, express: 19.99, free: 0 };
const FREE_SHIPPING_THRESHOLD = 100;
const TAX_RATE = 0.08;

const buildStatusHistory = (status, note = "") => [{ status, date: new Date(), note }];

const resolveShippingAddress = (addr) => {
  if (typeof addr === "string") return { fullName: "", address: addr, city: "", state: "", zip: "", phone: "" };
  return {
    fullName: addr.fullName || "",
    address: addr.address || addr.line1 || "",
    city: addr.city || "",
    state: addr.state || "",
    zip: addr.zip || addr.postalCode || "",
    phone: addr.phone || "",
  };
};

router.post("/", protect, async (req, res) => {
  const { items = [], shippingAddress, paymentMethod = "Card", deliveryMethod = "standard", couponCode = "", discount = 0, addressId } = req.body;

  if (!items.length) return res.status(400).json({ message: "Cart items are required" });

  let addr;
  if (addressId) {
    const Address = (await import("../models/Address.js")).default;
    const savedAddr = await Address.findOne({ _id: addressId, userId: req.user.id }).lean();
    if (!savedAddr) return res.status(400).json({ message: "Address not found" });
    addr = { fullName: savedAddr.fullName, address: savedAddr.address, city: savedAddr.city, state: savedAddr.state, zip: savedAddr.zip, phone: savedAddr.phone };
  } else if (shippingAddress) {
    addr = resolveShippingAddress(shippingAddress);
  } else {
    return res.status(400).json({ message: "Shipping address is required" });
  }
  if (!isNonEmptyString(addr.address, 5, 500)) return res.status(400).json({ message: "Valid shipping address is required" });

  if (!["Card", "PayPal", "CashOnDelivery"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Unsupported payment method" });
  }
  if (!["standard", "express", "free"].includes(deliveryMethod)) {
    return res.status(400).json({ message: "Invalid delivery method" });
  }

  let subtotal = 0;
  const normalized = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }
    const product = await Product.findById(item.productId).select("_id price stock title image salePrice saleEnds").lean();
    if (!product) return res.status(400).json({ message: `Product not found: ${item.productId}` });
    if (qty > product.stock) return res.status(400).json({ message: `${product.title} has insufficient stock (${product.stock} available)` });

    const isOnSale = product.salePrice > 0 && product.saleEnds && new Date(product.saleEnds) > new Date();
    const unitPrice = isOnSale ? product.salePrice : product.price;
    subtotal += unitPrice * qty;
    normalized.push({ productId: product._id, title: product.title, image: product.image, quantity: qty, unitPrice });
  }

  const shippingCost = deliveryMethod === "free" || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_COSTS[deliveryMethod] || 0;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));

  let discountAmount = Math.min(Number(discount) || 0, subtotal);
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && new Date(coupon.expiresAt) > new Date()) {
      if (coupon.usageLimit === 0 || coupon.usageCount < coupon.usageLimit) {
        if (subtotal >= coupon.minPurchase) {
          if (coupon.type === "fixed") {
            discountAmount = Math.min(coupon.value, subtotal);
          } else {
            let disc = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount > 0) disc = Math.min(disc, coupon.maxDiscount);
            discountAmount = Math.min(Number(disc.toFixed(2)), subtotal);
          }
          appliedCoupon = coupon;
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usageCount: 1 }, $addToSet: { usedBy: req.user.id } });
        }
      }
    }
  }
  const total = Number((subtotal + shippingCost + tax - discountAmount).toFixed(2));

  if (total <= 0) return res.status(400).json({ message: "Invalid order total" });

  const deliveryDays = deliveryMethod === "express" ? 3 : 7;
  const estimatedDelivery = new Date(Date.now() + deliveryDays * 86400000);

  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      for (const item of normalized) {
        const result = await Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session }
        );
        if (result.modifiedCount === 0) {
          throw new Error(`Insufficient stock for ${item.title}`);
        }
      }

      const orderData = {
        userId: req.user.id,
        orderNumber: makeOrderNumber(),
        total,
        subtotal: Number(subtotal.toFixed(2)),
        shippingCost,
        tax,
        discount: discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : couponCode,
        status: paymentMethod === "CashOnDelivery" ? "Processing" : "Paid",
        paymentStatus: paymentMethod === "CashOnDelivery" ? "Unpaid" : "Paid",
        paymentMethod,
        shippingAddress: addr,
        deliveryMethod,
        trackingCode: makeTrackingCode(),
        estimatedDelivery,
        items: normalized,
        statusHistory: buildStatusHistory(paymentMethod === "CashOnDelivery" ? "Processing" : "Paid", "Order placed"),
      };

      order = await Order.create([orderData], { session });
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Order creation failed" });
  } finally {
    await session.endSession();
  }

  res.status(201).json({ ...order[0].toObject(), id: order[0]._id });

  try {
    await Notification.create({
      userId: req.user.id,
      type: "order",
      title: "Order Confirmed",
      message: `Your order ${order[0].orderNumber} has been placed successfully.`,
      link: `/orders`,
    });
    sendOrderConfirmation(
      { name: req.user.name, email: req.user.email },
      order[0]
    ).catch(() => {});
  } catch {}
});

router.get("/my", protect, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 10), 50);
  const status = req.query.status;
  const filter = { userId: req.user.id };
  if (status && status !== "all") filter.status = status;

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json({
    orders: orders.map((o) => ({ ...o, id: o._id })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.get("/my/:id", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id })
    .populate("items.productId", "title image price")
    .lean();
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ ...order, id: order._id });
});

router.patch("/my/:id/cancel", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!["Pending", "Paid", "Processing"].includes(order.status)) {
    return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session });
      }
      order.status = "Cancelled";
      order.cancelledAt = new Date();
      order.cancelReason = req.body.reason || "Cancelled by customer";
      order.paymentStatus = order.paymentStatus === "Paid" ? "Refunded" : order.paymentStatus;
      order.statusHistory.push({ status: "Cancelled", date: new Date(), note: req.body.reason || "Cancelled by customer" });
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.json({ message: "Order cancelled", order: { ...order.toObject(), id: order._id } });
});

// Admin routes
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);
  const { status, search, sort = "newest", paymentMethod } = req.query;

  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (paymentMethod && paymentMethod !== "all") filter.paymentMethod = paymentMethod;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "shippingAddress.fullName": { $regex: search, $options: "i" } },
      { "shippingAddress.address": { $regex: search, $options: "i" } },
      { trackingCode: { $regex: search, $options: "i" } },
    ];
  }

  let sortObj = { createdAt: -1 };
  if (sort === "oldest") sortObj = { createdAt: 1 };
  else if (sort === "total_high") sortObj = { total: -1 };
  else if (sort === "total_low") sortObj = { total: 1 };

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("userId", "name email")
    .lean();

  res.json({
    orders: orders.map((o) => ({ ...o, id: o._id, customerName: o.userId?.name, customerEmail: o.userId?.email })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.get("/admin/:id", protect, adminOnly, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.productId", "title image price sku")
    .populate("userId", "name email")
    .lean();
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ ...order, id: order._id, customerName: order.userId?.name, customerEmail: order.userId?.email });
});

router.patch("/admin/:id/status", protect, adminOnly, async (req, res) => {
  const { status, note, trackingCode } = req.body;
  const validStatuses = ["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (status === "Cancelled" && order.status !== "Cancelled") {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const item of order.items) {
          await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session });
        }
        order.status = status;
        order.cancelledAt = new Date();
        if (order.paymentStatus === "Paid") order.paymentStatus = "Refunded";
        order.statusHistory.push({ status, date: new Date(), note: note || "Cancelled by admin" });
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }
  } else {
    if (status === "Delivered") order.deliveredAt = new Date();
    if (status === "Refunded") order.paymentStatus = "Refunded";
    if (trackingCode) order.trackingCode = trackingCode;
    order.status = status;
    order.statusHistory.push({ status, date: new Date(), note: note || "" });
    await order.save();
  }

  try {
    const statusMessages = {
      Processing: "Your order is being processed.",
      Shipped: `Your order has been shipped. Tracking: ${order.trackingCode}`,
      Delivered: "Your order has been delivered!",
      Cancelled: "Your order has been cancelled.",
      Refunded: "Your order has been refunded.",
    };
    if (statusMessages[status]) {
      const orderUser = await User.findById(order.userId).select("name email").lean();
      await Notification.create({
        userId: order.userId,
        type: "order",
        title: `Order ${status}`,
        message: statusMessages[status],
        link: "/orders",
      });
      if (orderUser) {
        sendOrderStatusUpdate(orderUser, order, status).catch(() => {});
      }
    }
  } catch {}

  res.json({ message: "Order updated", order: { ...order.toObject(), id: order._id } });
});

router.get("/admin/export/csv", protect, adminOnly, async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to + "T23:59:59.999Z");
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate("userId", "name email").lean();

  const csvHeader = "Order Number,Date,Customer,Email,Status,Payment Method,Subtotal,Shipping,Tax,Discount,Total\n";
  const csvRows = orders.map((o) => {
    const date = new Date(o.createdAt).toISOString().split("T")[0];
    const customer = o.userId?.name || "N/A";
    const email = o.userId?.email || "N/A";
    return `${o.orderNumber},${date},"${customer}","${email}",${o.status},${o.paymentMethod},${o.subtotal},${o.shippingCost},${o.tax},${o.discount},${o.total}`;
  }).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
  res.send(csvHeader + csvRows);
});

export default router;
