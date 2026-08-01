import express from "express";
import { protect } from "../middleware/auth.js";
import Notification from "../models/Notification.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 50);
  const total = await Notification.countDocuments({ userId: req.user.id });
  const unread = await Notification.countDocuments({ userId: req.user.id, read: false });
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  res.json({
    notifications: notifications.map((n) => ({ ...n, id: n._id })),
    unread,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.get("/unread-count", protect, async (req, res) => {
  const unread = await Notification.countDocuments({ userId: req.user.id, read: false });
  res.json({ unread });
});

router.patch("/read-all", protect, async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read" });
});

router.patch("/read/:id", protect, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { read: true });
  res.json({ message: "Notification marked as read" });
});

router.delete("/:id", protect, async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ message: "Notification deleted" });
});

export default router;
