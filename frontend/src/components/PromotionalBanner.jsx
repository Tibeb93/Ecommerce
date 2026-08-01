import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PromotionalBanner = () => (
  <section className="section fade-in-section">
    <div className="container">
      <div className="promo-banner glass">
        <div className="promo-text">
          <span className="pill">Weekend Special</span>
          <h2>Buy 2, Get 1 Free</h2>
          <p className="muted">On all clothing items. Limited time offer.</p>
          <Link to="/?category=clothing" className="btn">Shop Clothing <ArrowRight size={16} /></Link>
        </div>
        <div className="promo-visual">
          <div className="promo-tag">FREE</div>
        </div>
      </div>
    </div>
  </section>
);

export default PromotionalBanner;
