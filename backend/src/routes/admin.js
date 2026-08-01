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

const normalize = (p) => ({
  ...p,
  id: p._id,
  category: p.categoryId?.name,
  categoryId: p.categoryId?._id,
});

// ======================== INSIGHTS ========================
router.get("/insights", async (_, res) => {
  const [salesAgg, totalOrders, totalUsers, totalProducts, lowStock, recentOrders] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: "Paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments({ isDeleted: { $ne: true } }),
    Product.find({ stock: { $lte: 5 }, isDeleted: { $ne: true } }).select("title stock").limit(5).lean(),
    Order.find().sort({ createdAt: -1 }).limit(5).populate("userId", "name").lean(),
  ]);
  const totalSales = salesAgg[0]?.total ?? 0;
  res.json({
    totalSales,
    totalOrders,
    totalUsers,
    totalProducts,
    lowStock,
    recentOrders: recentOrders.map((o) => ({ ...o, id: o._id, customerName: o.userId?.name })),
  });
});

// ======================== PRODUCTS ========================
router.get("/products", async (req, res) => {
  const { q = "", category = "", brand = "", status = "", sort = "newest", page = 1, limit = 20, minPrice, maxPrice, minStock, maxStock } = req.query;

  const filter = { isDeleted: { $ne: true } };
  if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }, { brand: { $regex: q, $options: "i" } }];
  if (category) {
    const cat = await Category.findOne({ name: { $regex: `^${category}$`, $options: "i" } }).select("_id").lean();
    if (cat) filter.categoryId = cat._id;
  }
  if (brand) filter.brand = { $regex: brand, $options: "i" };
  if (status) filter.status = status;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (minStock || maxStock) {
    filter.stock = {};
    if (minStock) filter.stock.$gte = Number(minStock);
    if (maxStock) filter.stock.$lte = Number(maxStock);
  }

  const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, priceAsc: { price: 1 }, priceDesc: { price: -1 }, nameAsc: { title: 1 }, nameDesc: { title: -1 }, stock: { stock: 1 } };
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).populate("categoryId", "name").sort(sortMap[sort] ?? sortMap.newest).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    products: products.map(normalize),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
});

router.get("/products/all", async (_, res) => {
  const products = await Product.find({ isDeleted: { $ne: true } }).populate("categoryId", "name").sort({ createdAt: -1 }).lean();
  res.json(products.map(normalize));
});

router.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).populate("categoryId", "name").lean();
  if (!product || product.isDeleted) return res.status(404).json({ message: "Product not found" });
  res.json(normalize(product));
});

router.post("/products", async (req, res) => {
  const { title, description, image, images, price, costPrice, stock, lowStockAlert, categoryId, brand, salePrice, saleEnds, status, sku, barcode, tags, slug, seoTitle, seoDescription, seoKeywords, weight, dimensions, variants } = req.body;

  if (!isNonEmptyString(title, 3, 120)) return res.status(400).json({ message: "Title must be 3-120 characters" });
  if (!isNonEmptyString(description, 10, 2000)) return res.status(400).json({ message: "Description must be 10-2000 characters" });
  if (!isValidUrl(image)) return res.status(400).json({ message: "Image must be a valid URL" });
  if (!isPositiveNumber(price)) return res.status(400).json({ message: "Price must be greater than 0" });
  if (!isNonNegativeInteger(stock)) return res.status(400).json({ message: "Stock must be a non-negative integer" });
  const categoryExists = await Category.exists({ _id: categoryId });
  if (!categoryExists) return res.status(400).json({ message: "Category not found" });

  if (sku) {
    const skuExists = await Product.findOne({ sku: toSafeTrimmed(sku), isDeleted: { $ne: true } });
    if (skuExists) return res.status(409).json({ message: "SKU already exists" });
  }

  const product = await Product.create({
    title: toSafeTrimmed(title),
    description: toSafeTrimmed(description),
    image: toSafeTrimmed(image),
    images: Array.isArray(images) ? images.filter(isValidUrl) : [],
    price: Number(price),
    costPrice: costPrice ? Number(costPrice) : 0,
    salePrice: salePrice ? Number(salePrice) : 0,
    saleEnds: saleEnds || null,
    stock: Number(stock),
    lowStockAlert: lowStockAlert ? Number(lowStockAlert) : 5,
    categoryId,
    brand: brand ? toSafeTrimmed(brand) : "",
    tags: Array.isArray(tags) ? tags.map(toSafeTrimmed).filter(Boolean) : [],
    status: ["draft", "published", "out_of_stock", "archived", "coming_soon", "discontinued"].includes(status) ? status : "published",
    sku: sku ? toSafeTrimmed(sku) : "",
    barcode: barcode ? toSafeTrimmed(barcode) : "",
    slug: slug ? toSafeTrimmed(slug).toLowerCase().replace(/\s+/g, "-") : "",
    seoTitle: seoTitle ? toSafeTrimmed(seoTitle) : "",
    seoDescription: seoDescription ? toSafeTrimmed(seoDescription) : "",
    seoKeywords: seoKeywords ? toSafeTrimmed(seoKeywords) : "",
    weight: weight ? Number(weight) : 0,
    dimensions: dimensions || { length: 0, width: 0, height: 0 },
    variants: Array.isArray(variants) ? variants : [],
  });
  res.status(201).json({ id: product._id });
});

router.put("/products/:id", async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing || existing.isDeleted) return res.status(404).json({ message: "Product not found" });

  const { title, description, image, images, price, costPrice, stock, lowStockAlert, categoryId, brand, salePrice, saleEnds, status, sku, barcode, tags, slug, seoTitle, seoDescription, seoKeywords, weight, dimensions, variants } = req.body;

  if (!isNonEmptyString(title, 3, 120)) return res.status(400).json({ message: "Title must be 3-120 characters" });
  if (!isNonEmptyString(description, 10, 2000)) return res.status(400).json({ message: "Description must be 10-2000 characters" });
  if (!isValidUrl(image)) return res.status(400).json({ message: "Image must be a valid URL" });
  if (!isPositiveNumber(price)) return res.status(400).json({ message: "Price must be greater than 0" });
  if (!isNonNegativeInteger(stock)) return res.status(400).json({ message: "Stock must be a non-negative integer" });
  const categoryExists = await Category.exists({ _id: categoryId });
  if (!categoryExists) return res.status(400).json({ message: "Category not found" });

  if (sku && sku !== existing.sku) {
    const skuExists = await Product.findOne({ sku: toSafeTrimmed(sku), _id: { $ne: req.params.id }, isDeleted: { $ne: true } });
    if (skuExists) return res.status(409).json({ message: "SKU already exists" });
  }

  await Product.findByIdAndUpdate(req.params.id, {
    title: toSafeTrimmed(title),
    description: toSafeTrimmed(description),
    image: toSafeTrimmed(image),
    images: Array.isArray(images) ? images.filter(isValidUrl) : existing.images,
    price: Number(price),
    costPrice: costPrice ? Number(costPrice) : existing.costPrice,
    salePrice: salePrice ? Number(salePrice) : 0,
    saleEnds: saleEnds || null,
    stock: Number(stock),
    lowStockAlert: lowStockAlert ? Number(lowStockAlert) : existing.lowStockAlert,
    categoryId,
    brand: brand ? toSafeTrimmed(brand) : "",
    tags: Array.isArray(tags) ? tags.map(toSafeTrimmed).filter(Boolean) : existing.tags,
    status: ["draft", "published", "out_of_stock", "archived", "coming_soon", "discontinued"].includes(status) ? status : existing.status,
    sku: sku ? toSafeTrimmed(sku) : existing.sku,
    barcode: barcode ? toSafeTrimmed(barcode) : existing.barcode,
    slug: slug ? toSafeTrimmed(slug).toLowerCase().replace(/\s+/g, "-") : existing.slug,
    seoTitle: seoTitle ? toSafeTrimmed(seoTitle) : existing.seoTitle,
    seoDescription: seoDescription ? toSafeTrimmed(seoDescription) : existing.seoDescription,
    seoKeywords: seoKeywords ? toSafeTrimmed(seoKeywords) : existing.seoKeywords,
    weight: weight ? Number(weight) : existing.weight,
    dimensions: dimensions || existing.dimensions,
    variants: Array.isArray(variants) ? variants : existing.variants,
  });
  res.json({ message: "Product updated" });
});

router.delete("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  await Product.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
  res.json({ message: "Product deleted" });
});

router.patch("/products/:id/restore", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  await Product.findByIdAndUpdate(req.params.id, { isDeleted: false, deletedAt: null });
  res.json({ message: "Product restored" });
});

router.patch("/products/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["draft", "published", "out_of_stock", "archived", "coming_soon", "discontinued"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  await Product.findByIdAndUpdate(req.params.id, { status });
  res.json({ message: "Status updated" });
});

router.post("/products/bulk", async (req, res) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: "No products selected" });

  if (action === "delete") {
    await Product.updateMany({ _id: { $in: ids } }, { isDeleted: true, deletedAt: new Date() });
    return res.json({ message: `${ids.length} products deleted` });
  }
  if (action === "publish") {
    await Product.updateMany({ _id: { $in: ids } }, { status: "published" });
    return res.json({ message: `${ids.length} products published` });
  }
  if (action === "archive") {
    await Product.updateMany({ _id: { $in: ids } }, { status: "archived" });
    return res.json({ message: `${ids.length} products archived` });
  }
  if (action === "draft") {
    await Product.updateMany({ _id: { $in: ids } }, { status: "draft" });
    return res.json({ message: `${ids.length} products set to draft` });
  }
  res.status(400).json({ message: "Invalid action" });
});

router.get("/products/:id/analytics", async (req, res) => {
  const product = await Product.findById(req.params.id).select("title stock rating reviewsCount price salePrice").lean();
  if (!product) return res.status(404).json({ message: "Product not found" });

  const [orderCount, revenueAgg, wishlistCount] = await Promise.all([
    Order.countDocuments({ "items.productId": req.params.id }),
    Order.aggregate([
      { $match: { "items.productId": product._id, paymentStatus: "Paid" } },
      { $unwind: "$items" },
      { $match: { "items.productId": product._id } },
      { $group: { _id: null, revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } }, sold: { $sum: "$items.quantity" } } },
    ]),
    Wishlist.countDocuments({ productId: req.params.id }),
  ]);

  res.json({
    title: product.title,
    stock: product.stock,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    orderCount,
    revenue: revenueAgg[0]?.revenue ?? 0,
    sold: revenueAgg[0]?.sold ?? 0,
    wishlistCount,
  });
});

// ======================== CATEGORIES ========================
router.get("/categories", async (_, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(categories.map((c) => ({ ...c, id: c._id, count: countMap[String(c._id)] || 0 })));
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
  const used = await Product.exists({ categoryId: req.params.id, isDeleted: { $ne: true } });
  if (used) return res.status(400).json({ message: "Category is in use and cannot be removed" });
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Category removed" });
});

// ======================== ORDERS ========================
router.get("/orders", async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter).populate("userId", "name email").sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders: orders.map((o) => ({ ...o, id: o._id, customerName: o.userId?.name, customerEmail: o.userId?.email })),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
});

router.patch("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }
  await Order.findByIdAndUpdate(req.params.id, { status });
  res.json({ message: "Order status updated" });
});

// ======================== USERS ========================
router.get("/users", async (req, res) => {
  const { q = "", role = "" } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];
  if (role) filter.role = role;

  const users = await User.find(filter).select("_id name email role isEmailVerified createdAt").sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => ({ ...u, id: u._id })));
});

// ======================== REVIEWS ========================
router.get("/reviews", async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(Math.max(1, Number(limit)), 100);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find().populate("userId", "name email").populate("productId", "title image").sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Review.countDocuments(),
  ]);

  res.json({
    reviews: reviews.map((r) => ({
      ...r,
      id: r._id,
      userName: r.userId?.name || "User",
      userEmail: r.userId?.email || "",
      productTitle: r.productId?.title || "Deleted Product",
      productImage: r.productId?.image || "",
      productId: r.productId?._id,
    })),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
});

router.delete("/reviews/:id", async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });

  await Review.findByIdAndDelete(req.params.id);

  const agg = await Review.aggregate([
    { $match: { productId: review.productId } },
    { $group: { _id: "$productId", rating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avgRating = agg[0]?.rating ? Number(agg[0].rating.toFixed(1)) : 0;
  const count = agg[0]?.count ?? 0;
  await Product.findByIdAndUpdate(review.productId, { rating: avgRating, reviewsCount: count });

  res.json({ message: "Review deleted" });
});

export default router;
