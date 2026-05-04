import express from "express";
import { adminOnly, protect } from "../middleware/auth.js";
import { isNonEmptyString, isNonNegativeInteger, isPositiveNumber, isValidUrl, toSafeTrimmed } from "../utils/validators.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Wishlist from "../models/Wishlist.js";
import Review from "../models/Review.js";

const router = express.Router();
router.use(protect, adminOnly);

router.get("/insights", async (_, res) => {
  const [salesAgg, totalOrders, totalUsers, totalProducts] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: "Paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments()
  ]);
  const totalSales = salesAgg[0]?.total ?? 0;
  res.json({ totalSales, totalOrders, totalUsers, totalProducts });
});

router.get("/products", async (_, res) => {
  const products = await Product.find().populate("categoryId", "name").sort({ createdAt: -1 }).lean();
  res.json(
    products.map((p) => ({
      ...p,
      id: p._id,
      category: p.categoryId?.name,
      categoryId: p.categoryId?._id
    }))
  );
});

router.post("/products", async (req, res) => {
  const { title, description, image, price, stock, categoryId } = req.body;
  if (!isNonEmptyString(title, 3, 120)) return res.status(400).json({ message: "Title must be 3-120 characters" });
  if (!isNonEmptyString(description, 10, 1000)) {
    return res.status(400).json({ message: "Description must be 10-1000 characters" });
  }
  if (!isValidUrl(image)) return res.status(400).json({ message: "Image must be a valid URL" });
  if (!isPositiveNumber(price)) return res.status(400).json({ message: "Price must be greater than 0" });
  if (!isNonNegativeInteger(stock)) return res.status(400).json({ message: "Stock must be a non-negative integer" });
  const categoryExists = await Category.exists({ _id: categoryId });
  if (!categoryExists) return res.status(400).json({ message: "Category not found" });

  const product = await Product.create({
    title: toSafeTrimmed(title),
    description: toSafeTrimmed(description),
    image: toSafeTrimmed(image),
    price: Number(price),
    stock: Number(stock),
    categoryId
  });
  res.status(201).json({ id: product._id });
});

router.put("/products/:id", async (req, res) => {
  const { title, description, image, price, stock, categoryId } = req.body;
  if (!isNonEmptyString(title, 3, 120)) return res.status(400).json({ message: "Title must be 3-120 characters" });
  if (!isNonEmptyString(description, 10, 1000)) {
    return res.status(400).json({ message: "Description must be 10-1000 characters" });
  }
  if (!isValidUrl(image)) return res.status(400).json({ message: "Image must be a valid URL" });
  if (!isPositiveNumber(price)) return res.status(400).json({ message: "Price must be greater than 0" });
  if (!isNonNegativeInteger(stock)) return res.status(400).json({ message: "Stock must be a non-negative integer" });
  const categoryExists = await Category.exists({ _id: categoryId });
  if (!categoryExists) return res.status(400).json({ message: "Category not found" });

  await Product.findByIdAndUpdate(req.params.id, {
    title: toSafeTrimmed(title),
    description: toSafeTrimmed(description),
    image: toSafeTrimmed(image),
    price: Number(price),
    stock: Number(stock),
    categoryId
  });
  res.json({ message: "Product updated" });
});

router.delete("/products/:id", async (req, res) => {
  const inOrders = await Order.exists({ "items.productId": req.params.id });
  if (inOrders) {
    return res.status(400).json({ message: "Cannot delete product that exists in orders" });
  }
  await Product.findByIdAndDelete(req.params.id);
  await Wishlist.deleteMany({ productId: req.params.id });
  await Review.deleteMany({ productId: req.params.id });
  res.json({ message: "Product deleted" });
});

router.get("/orders", async (_, res) => {
  const orders = await Order.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  res.json(
    orders.map((o) => ({
      ...o,
      id: o._id,
      customerName: o.userId?.name,
      customerEmail: o.userId?.email
    }))
  );
});

router.patch("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }
  await Order.findByIdAndUpdate(req.params.id, { status });
  res.json({ message: "Order status updated" });
});

router.get("/users", async (_, res) => {
  const users = await User.find().select("_id name email role createdAt").sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => ({ ...u, id: u._id })));
});

router.get("/categories", async (_, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json(categories.map((c) => ({ ...c, id: c._id })));
});

router.post("/categories", async (req, res) => {
  const { name } = req.body;
  const cleanName = toSafeTrimmed(name);
  if (!isNonEmptyString(cleanName, 2, 80)) {
    return res.status(400).json({ message: "Category name must be 2-80 characters" });
  }
  try {
    const category = await Category.create({ name: cleanName });
    res.status(201).json({ id: category._id });
  } catch {
    res.status(409).json({ message: "Category already exists" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  const used = await Product.exists({ categoryId: req.params.id });
  if (used) {
    return res.status(400).json({ message: "Category is in use and cannot be removed" });
  }
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Unused category removed" });
});

export default router;
