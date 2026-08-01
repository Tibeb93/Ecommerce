import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const router = express.Router();
router.use(protect, adminOnly);

router.get("/sales", async (req, res) => {
  const { period = "30d" } = req.query;
  let startDate = new Date();
  if (period === "7d") startDate.setDate(startDate.getDate() - 7);
  else if (period === "30d") startDate.setDate(startDate.getDate() - 30);
  else if (period === "90d") startDate.setDate(startDate.getDate() - 90);
  else if (period === "1y") startDate.setFullYear(startDate.getFullYear() - 1);
  else startDate.setDate(startDate.getDate() - 30);

  const [totalRevenue, revenueByDay, topProducts, topCustomers, ordersByStatus, conversionRate] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", title: { $first: "$items.title" }, sold: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startDate } } },
      { $group: { _id: "$userId", totalSpent: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, name: "$user.name", email: "$user.email", totalSpent: 1, orders: 1 } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    (async () => {
      const [visitors, orders] = await Promise.all([
        Order.distinct("userId", { createdAt: { $gte: startDate } }).then((u) => u.length),
        Order.countDocuments({ createdAt: { $gte: startDate } }),
      ]);
      return { visitors, orders, rate: visitors > 0 ? Number(((orders / visitors) * 100).toFixed(1)) : 0 };
    })(),
  ]);

  res.json({
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders: totalRevenue[0]?.count || 0,
    revenueByDay: revenueByDay.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
    topProducts: topProducts.map((p) => ({ id: p._id, title: p.title, sold: p.sold, revenue: p.revenue })),
    topCustomers: topCustomers.map((c) => ({ id: c._id, name: c.name, email: c.email, totalSpent: c.totalSpent, orders: c.orders })),
    ordersByStatus: ordersByStatus.map((s) => ({ status: s._id, count: s.count })),
    conversion: conversionRate,
  });
});

router.get("/overview", async (_, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonth, lastMonth, totalUsers, totalProducts, totalOrders, lowStock] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    User.countDocuments(),
    Product.countDocuments({ isDeleted: { $ne: true } }),
    Order.countDocuments(),
    Product.find({ stock: { $lte: 5 }, isDeleted: { $ne: true } }).select("title stock").limit(5).lean(),
  ]);

  const tm = thisMonth[0] || { revenue: 0, count: 0 };
  const lm = lastMonth[0] || { revenue: 0, count: 0 };
  const revenueGrowth = lm.revenue > 0 ? Number((((tm.revenue - lm.revenue) / lm.revenue) * 100).toFixed(1)) : tm.revenue > 0 ? 100 : 0;
  const orderGrowth = lm.count > 0 ? Number((((tm.count - lm.count) / lm.count) * 100).toFixed(1)) : tm.count > 0 ? 100 : 0;

  res.json({
    revenue: { current: tm.revenue, previous: lm.revenue, growth: revenueGrowth },
    orders: { current: tm.count, previous: lm.count, growth: orderGrowth },
    totalUsers,
    totalProducts,
    totalOrders,
    lowStock,
  });
});

export default router;
