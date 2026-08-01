import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";

const Footer = () => (
  <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand">
        <Link to="/" className="logo">NovaShop</Link>
        <p className="muted">Your trusted marketplace for quality products at unbeatable prices.</p>
        <div className="footer-social">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-link"><Facebook size={18} /></a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social-link"><Instagram size={18} /></a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-link"><Linkedin size={18} /></a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer-social-link"><Youtube size={18} /></a>
        </div>
      </div>
      <div className="footer-col">
        <h4>Shop</h4>
        <Link to="/">All Products</Link>
        <Link to="/?sort=newest">New Arrivals</Link>
        <Link to="/?sort=rating">Best Sellers</Link>
        <Link to="/cart">Cart</Link>
      </div>
      <div className="footer-col">
        <h4>Customer</h4>
        <Link to="/orders">My Orders</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
      <div className="footer-col">
        <h4>Contact</h4>
        <div className="footer-contact"><Mail size={14} /> support@novashop.com</div>
        <div className="footer-contact"><Phone size={14} /> +1 (555) 123-4567</div>
        <div className="footer-contact"><MapPin size={14} /> 123 Commerce St, NY</div>
      </div>
    </div>
    <div className="container footer-bottom">
      <p className="muted">&copy; {new Date().getFullYear()} NovaShop. All rights reserved.</p>
      <div className="footer-payments">
        <span className="payment-badge">Visa</span>
        <span className="payment-badge">MasterCard</span>
        <span className="payment-badge">PayPal</span>
        <span className="payment-badge">Stripe</span>
      </div>
    </div>
  </footer>
);

export default Footer;
