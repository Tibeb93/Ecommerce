import express from "express";
import { protect } from "../middleware/auth.js";
import Coupon from "../models/Coupon.js";
import { toSafeTrimmed } from "../utils/validators.js";

const router = express.Router();

router.get("/validate/:code", protect, async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const coupon = await Coupon.findOne({ code, isActive: true }).lean();
  if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
  if (new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ message: "Coupon has expired" });
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return res.status(400).json({ message: "Coupon usage limit reached" });
  }

  res.json({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    maxDiscount: coupon.maxDiscount || 0,
    minPurchase: coupon.minPurchase || 0,
    description: coupon.description,
  });
});

export default router;
