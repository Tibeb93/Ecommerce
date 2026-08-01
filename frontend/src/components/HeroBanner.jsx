import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Star, Truck } from "lucide-react";

const HeroBanner = ({ productCount, categoryCount }) => (
  <section className="hero-banner glass">
    <div className="hero-text">
      <span className="pill hero-badge">New Season 2025</span>
      <h1>Discover Premium Products at Unbeatable Prices</h1>
      <p className="muted">Shop the latest trends across fashion, electronics, home, and more. Free shipping on orders over $50.</p>
      <div className="hero-actions">
        <Link to="/cart" className="btn btn-primary-lg"><ShoppingBag size={18} /> Shop Now <ArrowRight size={16} /></Link>
      </div>
      <div className="hero-trust">
        <span><Truck size={16} /> Free Shipping</span>
        <span><Star size={16} /> Top Rated</span>
        <span><ShoppingBag size={16} /> {productCount}+ Products</span>
      </div>
    </div>
    <div className="hero-stats">
      <div className="glass mini-stat">
        <strong>{productCount}</strong>
        <span>Products</span>
      </div>
      <div className="glass mini-stat">
        <strong>{categoryCount}</strong>
        <span>Categories</span>
      </div>
      <div className="glass mini-stat">
        <strong>4.8</strong>
        <span>Avg Rating</span>
      </div>
    </div>
  </section>
);

export default HeroBanner;
