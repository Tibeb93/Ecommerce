import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Clock } from "lucide-react";

const CountdownTimer = ({ saleEnds }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const target = new Date(saleEnds).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [saleEnds]);

  return (
    <div className="countdown">
      <Clock size={14} />
      {timeLeft.days > 0 && <span className="countdown-unit">{timeLeft.days}d</span>}
      <span className="countdown-unit">{String(timeLeft.hours || 0).padStart(2, "0")}</span>
      <span className="countdown-sep">:</span>
      <span className="countdown-unit">{String(timeLeft.minutes || 0).padStart(2, "0")}</span>
      <span className="countdown-sep">:</span>
      <span className="countdown-unit">{String(timeLeft.seconds || 0).padStart(2, "0")}</span>
    </div>
  );
};

const FlashDeals = ({ products }) => {
  if (!products.length) return null;
  return (
    <section className="section fade-in-section">
      <div className="container">
        <div className="section-head">
          <div className="section-head-left">
            <Zap size={22} className="flash-icon" />
            <div>
              <h2>Flash Deals</h2>
              <p className="muted">Limited time offers - grab them before they expire!</p>
            </div>
          </div>
        </div>
        <div className="flash-deals-grid">
          {products.map((product) => {
            const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
            return (
              <motion.article
                key={product.id}
                className="glass flash-deal-card"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flash-deal-badge">-{discount}% OFF</div>
                <Link to={`/product/${product.id}`}>
                  <img src={product.image} alt={product.title} className="product-image" />
                </Link>
                <div className="product-content">
                  <p className="pill">{product.category}</p>
                  <Link to={`/product/${product.id}`} className="product-title">{product.title}</Link>
                  <div className="price-row">
                    <div className="price-group">
                      <p className="price-tag">${product.salePrice.toFixed(2)}</p>
                      <p className="original-price">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  {product.saleEnds && <CountdownTimer saleEnds={product.saleEnds} />}
                  <Link to={`/product/${product.id}`} className="btn product-add-btn">Shop Now</Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FlashDeals;
