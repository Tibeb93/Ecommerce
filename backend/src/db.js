import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";

let memoryServer = null;

/** True when we should spin up an ephemeral MongoDB instead of connecting to MONGO_URI. */
const shouldUseMemoryMongo = () => {
  if (process.env.USE_MEMORY_DB === "true") return true;
  const raw = process.env.MONGO_URI?.trim();
  if (!raw) return true;
  // Atlas/local examples often ship with unfilled placeholders like <username>
  if (/<[^>]+>/.test(raw)) return true;
  return false;
};

const seedProductsByCategory = {
  Electronics: [
    {
      title: "NeoNoise Pro Headphones",
      description: "Premium wireless headphones with active noise cancellation.",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
      price: 129.99,
      stock: 40
    },
    {
      title: "Aurora Smart Watch",
      description: "Track fitness and notifications with all-day battery life.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      price: 199.99,
      stock: 26
    },
    {
      title: "PulseBeam Bluetooth Speaker",
      description: "Portable speaker with deep bass and 18-hour battery life.",
      image: "https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?w=800",
      price: 79.99,
      stock: 58
    },
    {
      title: "Vertex Ultra Laptop",
      description: "Lightweight 14-inch laptop with fast performance for daily work.",
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
      price: 899,
      stock: 17
    }
  ],
  Fashion: [
    {
      title: "Urban Comfort Hoodie",
      description: "Soft premium cotton hoodie with modern unisex fit.",
      image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
      price: 59.99,
      stock: 72
    },
    {
      title: "Classic Denim Jacket",
      description: "Everyday denim jacket with a timeless cut and durable stitching.",
      image: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800",
      price: 84.5,
      stock: 34
    },
    {
      title: "Aero Knit Sneakers",
      description: "Breathable knit sneakers built for city walks and all-day comfort.",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      price: 109.99,
      stock: 49
    }
  ],
  Home: [
    {
      title: "Luma Table Lamp",
      description: "Minimal lamp with warm adjustable lighting.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
      price: 44.5,
      stock: 65
    },
    {
      title: "CloudRest Bedding Set",
      description: "Ultra-soft breathable bedding set for cozy, restful nights.",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      price: 119.99,
      stock: 23
    },
    {
      title: "OakLine Wall Shelf",
      description: "Floating wood shelf set designed for modern home organization.",
      image: "https://images.unsplash.com/photo-1595515106864-b8f4f1d5f6ae?w=800",
      price: 54,
      stock: 41
    }
  ],
  Accessories: [
    {
      title: "Metro Leather Wallet",
      description: "Slim RFID-blocking wallet with premium stitched leather.",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
      price: 39.99,
      stock: 85
    },
    {
      title: "Titan Steel Water Bottle",
      description: "Insulated stainless bottle that keeps drinks cold for 24 hours.",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
      price: 24.99,
      stock: 77
    },
    {
      title: "Travel Pro Backpack",
      description: "Multi-pocket water-resistant backpack with padded laptop sleeve.",
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
      price: 69.99,
      stock: 39
    }
  ],
  Beauty: [
    {
      title: "Silk Touch Serum",
      description: "Hydrating daily serum designed for glow and smoothness.",
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
      price: 34.25,
      stock: 90
    },
    {
      title: "Glow Ritual Face Mask",
      description: "Nourishing clay mask to refresh, purify, and brighten skin.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
      price: 21.5,
      stock: 64
    },
    {
      title: "Velvet Matte Lip Set",
      description: "Long-lasting matte lip shades with smooth, lightweight finish.",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
      price: 29.9,
      stock: 52
    }
  ]
};

export const connectDB = async () => {
  let uri = process.env.MONGO_URI?.trim();
  const memory = shouldUseMemoryMongo();

  if (memory) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "In production set a valid MONGO_URI (or USE_MEMORY_DB is not supported in production)."
      );
    }
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.warn(
      "Using in-memory MongoDB (data is cleared when the server stops). For a persistent DB, set MONGO_URI and USE_MEMORY_DB=false."
    );
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  } catch (err) {
    const text = String(err?.message || err);
    if (
      text.includes("whitelist") ||
      text.includes("IP that isn't") ||
      err?.name === "MongooseServerSelectionError"
    ) {
      console.error(`
[MongoDB] Cannot reach your cluster. If you use MongoDB Atlas, allow your IP:
  1) https://cloud.mongodb.com  →  your project
  2) Security → Network Access  →  Add IP Address
  3) Add "Your Current IP" OR for dev only: 0.0.0.0/0 (allow anywhere)
  4) Wait 1–3 minutes, save .env if you changed it, restart the backend

Also check: cluster not paused (Clusters → Resume), DB user/password correct, password URL-encoded in MONGO_URI if it has @ # : / ? etc.
`);
    }
    throw err;
  }
  await seedDatabase();
};

const seedDatabase = async () => {
  const categoriesCount = await Category.countDocuments();
  if (categoriesCount === 0) {
    await Category.insertMany(["Electronics", "Fashion", "Home", "Accessories", "Beauty"].map((name) => ({ name })));
  }

  const categories = await Category.find();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.name, c._id]));
  const allSeedProducts = Object.entries(seedProductsByCategory).flatMap(([categoryName, items]) =>
    items.map((item) => ({ ...item, categoryId: categoryMap[categoryName] }))
  );
  const existingTitles = new Set((await Product.find().select("title").lean()).map((p) => p.title));
  const missingProducts = allSeedProducts.filter((item) => !existingTitles.has(item.title));
  if (missingProducts.length) {
    await Product.insertMany(missingProducts);
  }

  const adminExists = await User.exists({ role: "admin" });
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("Admin@123", 10);
    await User.create({
      name: "System Admin",
      email: "admin@shop.com",
      password: hashedPassword,
      role: "admin"
    });
  }
};
