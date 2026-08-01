import "dotenv/config";
import express from "express";

if (!process.env.JWT_SECRET?.trim()) {
  if (process.env.NODE_ENV === "production") {
    console.error("JWT_SECRET is required in production.");
    process.exit(1);
  }
  process.env.JWT_SECRET = "dev-only-change-me-before-deploy";
  console.warn("JWT_SECRET not set; using insecure development default.");
}
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db.js";

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";
import reviewRoutes from "./routes/reviews.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  app.set("trust proxy", 1);
}

app.use(helmet({ contentSecurityPolicy: false }));
const rawClientUrls = process.env.CLIENT_URL?.trim();
const allowedOrigins = rawClientUrls
  ? rawClientUrls
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  : ["http://localhost:5173"];
const allowAllOrigins = !rawClientUrls && isProd;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowAllOrigins || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS policy blocked request from ${origin}`),
        false,
      );
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  }),
);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
