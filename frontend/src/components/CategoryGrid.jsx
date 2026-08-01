import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const categoryIcons = {
  electronics: "💻", clothing: "👕", books: "📚", home: "🏠",
  sports: "⚽", beauty: "💄", toys: "🎮", food: "🍔",
  furniture: "🛋️", accessories: "⌚",
};

const CategoryGrid = ({ categories, onSelect }) => (
  <section className="section fade-in-section">
    <div className="container">
      <div className="section-head">
        <h2>Browse Categories</h2>
        <p className="muted">Find exactly what you're looking for</p>
      </div>
      <div className="category-grid">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            className="glass category-card"
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => onSelect(cat.name)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
          >
            <span className="category-icon">{categoryIcons[cat.name.toLowerCase()] || "📦"}</span>
            <span className="category-name">{cat.name}</span>
            <span className="category-count muted">{cat.count || 0} Products</span>
            <ArrowRight size={14} className="category-arrow muted" />
          </motion.button>
        ))}
      </div>
    </div>
  </section>
);

export default CategoryGrid;
