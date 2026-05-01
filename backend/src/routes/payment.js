import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/intent", protect, (req, res) => {
  const { amount } = req.body;
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 100000) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  return res.json({
    clientSecret: `demo_pi_${Date.now()}`,
    message: "Demo payment intent created. Replace with Stripe/PayPal SDK in production."
  });
});

export default router;
