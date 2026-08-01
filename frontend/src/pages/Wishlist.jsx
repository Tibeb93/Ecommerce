import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, Heart, ShoppingCart, ArrowRight } from "lucide-react";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/wishlist");
      setItems(data);
    } catch {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMoveToCart = (item) => {
    addToCart(item);
    handleRemove(item.id, true);
    toast.success(`"${item.title}" moved to cart!`);
  };

  const handleRemove = async (productId, silent = false) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems(prev => prev.filter(i => i.id !== productId));
      if (!silent) toast.info("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear entire wishlist?")) return;
    try {
      await api.delete("/wishlist");
      setItems([]);
      toast.info("Wishlist cleared");
    } catch {
      toast.error("Failed to clear wishlist");
    }
  };

  if (loading) {
    return (
      <div className="container section">
        <h1>My Wishlist</h1>
        <div className="wishlist-grid" style={{ marginTop: "1rem" }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="glass" style={{ padding: "1rem" }}>
              <div className="skeleton" style={{ height: 160, marginBottom: "0.8rem" }} />
              <div className="skeleton" style={{ height: 20, width: "70%", marginBottom: "0.4rem" }} />
              <div className="skeleton" style={{ height: 16, width: "40%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <Heart size={64} style={{ color: "var(--muted)", marginBottom: "1rem" }} />
        <h1 style={{ marginBottom: "0.5rem" }}>Your Wishlist is Empty</h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>Save items you love for later!</p>
        <Link to="/" className="btn btn-primary-lg">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="cart-header">
        <div>
          <h1>My Wishlist</h1>
          <span className="muted">{items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>
        <button className="btn ghost" onClick={handleClearAll} style={{ color: "var(--red)" }}>
          <Trash2 size={14} /> Clear All
        </button>
      </div>

      <div className="wishlist-grid">
        <AnimatePresence>
          {items.map((item) => {
            const stockStatus = item.stock === 0 ? "out" : item.stock <= 5 ? "low" : "in";
            return (
              <motion.article
                key={item.id}
                className="glass wishlist-item"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Link to={`/product/${item.id}`} className="wishlist-item-img">
                  <img src={item.image} alt={item.title} />
                  {stockStatus === "out" && <span className="badge badge-out" style={{ position: "absolute", top: 8, left: 8 }}>Sold Out</span>}
                  {stockStatus === "low" && <span className="badge badge-low" style={{ position: "absolute", top: 8, left: 8 }}>Low Stock</span>}
                </Link>
                <div className="wishlist-item-info">
                  <Link to={`/product/${item.id}`}>{item.title}</Link>
                  <span className="price-tag">${item.price.toFixed(2)}</span>
                  {item.category && <span className="pill">{item.category}</span>}
                </div>
                <div className="wishlist-item-actions">
                  <button
                    className="btn"
                    onClick={() => handleMoveToCart(item)}
                    disabled={stockStatus === "out"}
                  >
                    <ShoppingCart size={14} /> {stockStatus === "out" ? "Out of Stock" : "Move to Cart"}
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => handleRemove(item.id)}
                    style={{ color: "var(--red)" }}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link to="/" className="btn ghost">
          <ArrowRight size={14} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default Wishlist;
