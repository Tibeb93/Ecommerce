import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("ecommerce.db");

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  categoryId INTEGER NOT NULL,
  rating REAL NOT NULL DEFAULT 0,
  reviewsCount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  productId INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users (id),
  FOREIGN KEY (productId) REFERENCES products (id),
  UNIQUE(userId, productId)
);

CREATE TABLE IF NOT EXISTS wishlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  productId INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users (id),
  FOREIGN KEY (productId) REFERENCES products (id),
  UNIQUE(userId, productId)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  paymentStatus TEXT NOT NULL DEFAULT 'Unpaid',
  paymentMethod TEXT NOT NULL,
  shippingAddress TEXT NOT NULL,
  trackingCode TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL,
  productId INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unitPrice REAL NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders (id),
  FOREIGN KEY (productId) REFERENCES products (id)
);
`);

const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get().count;
if (categoryCount === 0) {
  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  ["Electronics", "Fashion", "Home", "Accessories", "Beauty"].forEach((name) => {
    insertCategory.run(name);
  });
}

const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
if (productCount === 0) {
  const categories = db.prepare("SELECT id, name FROM categories").all();
  const map = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const insertProduct = db.prepare(`
    INSERT INTO products (title, description, image, price, stock, categoryId)
    VALUES (@title, @description, @image, @price, @stock, @categoryId)
  `);

  const seedProducts = [
    {
      title: "NeoNoise Pro Headphones",
      description: "Premium wireless headphones with active noise cancellation.",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
      price: 129.99,
      stock: 40,
      categoryId: map.Electronics
    },
    {
      title: "Aurora Smart Watch",
      description: "Track fitness and notifications with all-day battery life.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      price: 199.99,
      stock: 26,
      categoryId: map.Electronics
    },
    {
      title: "Urban Comfort Hoodie",
      description: "Soft premium cotton hoodie with modern unisex fit.",
      image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
      price: 59.99,
      stock: 72,
      categoryId: map.Fashion
    },
    {
      title: "Luma Table Lamp",
      description: "Minimal lamp with warm adjustable lighting.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
      price: 44.5,
      stock: 65,
      categoryId: map.Home
    },
    {
      title: "Silk Touch Serum",
      description: "Hydrating daily serum designed for glow and smoothness.",
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
      price: 34.25,
      stock: 90,
      categoryId: map.Beauty
    }
  ];

  seedProducts.forEach((p) => insertProduct.run(p));
}

const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("Admin@123", 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, 'admin')
  `).run("System Admin", "admin@shop.com", hashedPassword);
}

export default db;
