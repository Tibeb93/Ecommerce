import express from "express";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import { isStrongPassword, isValidEmail, toSafeTrimmed } from "../utils/validators.js";
import { upload, processUpload } from "../middleware/upload.js";
import { deleteImage } from "../utils/cloudinary.js";

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires").lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ ...user, id: user._id });
});

router.put("/me", protect, async (req, res) => {
  const { name, phone, avatar } = req.body;
  const updates = {};
  if (name !== undefined) {
    const cleanName = toSafeTrimmed(name);
    if (cleanName.length < 2) return res.status(400).json({ message: "Name must be at least 2 characters" });
    updates.name = cleanName;
  }
  if (phone !== undefined) updates.phone = toSafeTrimmed(phone);
  if (avatar !== undefined) updates.avatar = toSafeTrimmed(avatar);

  await User.findByIdAndUpdate(req.user.id, updates);
  const user = await User.findById(req.user.id).select("-password").lean();
  res.json({ ...user, id: user._id });
});

router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const currentUser = await User.findById(req.user.id).select("avatar").lean();
    const result = await processUpload(req.file, "avatars");
    if (!result) return res.status(500).json({ message: "Upload failed" });
    await User.findByIdAndUpdate(req.user.id, { avatar: result.url });
    if (currentUser?.avatar && currentUser.avatar.includes("cloudinary")) {
      const publicId = currentUser.avatar.split("/").pop()?.split(".")[0];
      if (publicId) deleteImage(`avatars/${publicId}`).catch(() => {});
    }
    const user = await User.findById(req.user.id).select("-password").lean();
    res.json({ ...user, id: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

router.put("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords are required" });
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: "New password must be at least 8 chars with uppercase, lowercase, and number" });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }
  user.password = bcrypt.hashSync(newPassword, 10);
  await user.save({ validateBeforeSave: false });
  res.json({ message: "Password changed successfully" });
});

router.get("/addresses", protect, async (req, res) => {
  const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 }).lean();
  res.json(addresses.map((a) => ({ ...a, id: a._id })));
});

router.post("/addresses", protect, async (req, res) => {
  const { label, fullName, phone, address, address2, city, state, zip, country, isDefault } = req.body;
  if (!fullName?.trim()) return res.status(400).json({ message: "Full name is required" });
  if (!phone?.trim()) return res.status(400).json({ message: "Phone is required" });
  if (!address?.trim()) return res.status(400).json({ message: "Address is required" });
  if (!city?.trim()) return res.status(400).json({ message: "City is required" });
  if (!state?.trim()) return res.status(400).json({ message: "State is required" });
  if (!zip?.trim()) return res.status(400).json({ message: "ZIP code is required" });

  if (isDefault) {
    await Address.updateMany({ userId: req.user.id }, { isDefault: false });
  }

  const addr = await Address.create({
    userId: req.user.id,
    label: toSafeTrimmed(label) || "Home",
    fullName: toSafeTrimmed(fullName),
    phone: toSafeTrimmed(phone),
    address: toSafeTrimmed(address),
    address2: toSafeTrimmed(address2 || ""),
    city: toSafeTrimmed(city),
    state: toSafeTrimmed(state),
    zip: toSafeTrimmed(zip),
    country: toSafeTrimmed(country) || "US",
    isDefault: !!isDefault,
  });

  const count = await Address.countDocuments({ userId: req.user.id });
  if (count === 1) {
    addr.isDefault = true;
    await addr.save();
  }

  res.status(201).json({ ...addr.toObject(), id: addr._id });
});

router.put("/addresses/:id", protect, async (req, res) => {
  const addr = await Address.findOne({ _id: req.params.id, userId: req.user.id });
  if (!addr) return res.status(404).json({ message: "Address not found" });

  const { label, fullName, phone, address, address2, city, state, zip, country, isDefault } = req.body;
  if (isDefault) await Address.updateMany({ userId: req.user.id, _id: { $ne: addr._id } }, { isDefault: false });

  if (label !== undefined) addr.label = toSafeTrimmed(label) || addr.label;
  if (fullName !== undefined) addr.fullName = toSafeTrimmed(fullName);
  if (phone !== undefined) addr.phone = toSafeTrimmed(phone);
  if (address !== undefined) addr.address = toSafeTrimmed(address);
  if (address2 !== undefined) addr.address2 = toSafeTrimmed(address2);
  if (city !== undefined) addr.city = toSafeTrimmed(city);
  if (state !== undefined) addr.state = toSafeTrimmed(state);
  if (zip !== undefined) addr.zip = toSafeTrimmed(zip);
  if (country !== undefined) addr.country = toSafeTrimmed(country);
  if (isDefault !== undefined) addr.isDefault = !!isDefault;
  await addr.save();
  res.json({ ...addr.toObject(), id: addr._id });
});

router.delete("/addresses/:id", protect, async (req, res) => {
  const addr = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!addr) return res.status(404).json({ message: "Address not found" });
  if (addr.isDefault) {
    const next = await Address.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    if (next) await Address.findByIdAndUpdate(next._id, { isDefault: true });
  }
  res.json({ message: "Address deleted" });
});

router.get("/orders", protect, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 10), 50);
  const total = await Order.countDocuments({ userId: req.user.id });
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  res.json({
    orders: orders.map((o) => ({ ...o, id: o._id })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export default router;
