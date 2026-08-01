import { motion } from "framer-motion";

const brandLogos = {
  apple: "🍎", samsung: "📱", nike: "👟", adidas: "🏃",
  sony: "🎮", lg: "📺", dell: "💻", hp: "🖨️",
};

const Brands = ({ brands, onSelect }) => {
  if (!brands.length) return null;
  return (
    <section className="section fade-in-section">
      <div className="container">
        <div className="section-head">
          <h2>Popular Brands</h2>
          <p className="muted">Shop by your favorite brands</p>
        </div>
        <div className="brands-grid">
          {brands.map((brand, i) => (
            <motion.button
              key={brand}
              className="glass brand-card"
              whileHover={{ y: -3, scale: 1.03 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelect(brand)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="brand-logo">{brandLogos[brand.toLowerCase()] || "🏷️"}</span>
              <span className="brand-name">{brand}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Brands;
