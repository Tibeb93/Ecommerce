import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

const ProductCard = ({ product, onWishlisted }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const addWishlist = async () => {
    if (!user) return alert("Login required to use wishlist.");
    try {
      await api.post(`/wishlist/${product.id}`);
      if (onWishlisted) onWishlisted(product.id);
    } catch (err) {
      alert(getErrorMessage(err, "Could not add to wishlist"));
    }
  };

  return (
    <motion.article className="glass product-card" whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Link to={`/product/${product.id}`}>
        <img src={product.image} alt={product.title} className="product-image" />
      </Link>
      <div className="product-content">
        <p className="pill">{product.category}</p>
        <Link to={`/product/${product.id}`} className="product-title">
          {product.title}
        </Link>
        <div className="price-row">
          <p className="price-tag">${product.price.toFixed(2)}</p>
          <p className="muted">Stock: {product.stock}</p>
        </div>
        <div className="product-actions">
          <button className="btn" onClick={() => addToCart(product)}>
            <ShoppingBag size={16} /> Add
          </button>
          <button className="btn ghost" onClick={addWishlist}>
            <Heart size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
