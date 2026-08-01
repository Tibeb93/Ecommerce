import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { getErrorMessage } from "../utils/errors";

const ProductCard = ({ product, onWishlisted }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const isOnSale = product.salePrice > 0 && product.saleEnds && new Date(product.saleEnds) > new Date();
  const discount = isOnSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  const stockStatus = product.stock === 0 ? "out" : product.stock <= 5 ? "low" : "in";

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
    <motion.article
      className="glass product-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="product-card-img-wrap">
        <Link to={`/product/${product.id}`}>
          <img
            src={imgError ? "https://placehold.co/400x300?text=No+Image" : product.image}
            alt={product.title}
            className="product-image"
            onError={() => setImgError(true)}
          />
        </Link>
        <div className="product-card-badges">
          {isOnSale && <span className="badge badge-sale">-{discount}%</span>}
          {!isOnSale && product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 86400000) && (
            <span className="badge badge-new">NEW</span>
          )}
          {stockStatus === "out" && <span className="badge badge-out">Sold Out</span>}
          {stockStatus === "low" && <span className="badge badge-low">Low Stock</span>}
        </div>
        <div className="product-card-actions">
          <button className="pc-action" onClick={addWishlist} title="Add to Wishlist">
            <Heart size={16} />
          </button>
          <Link to={`/product/${product.id}`} className="pc-action" title="Quick View">
            <Eye size={16} />
          </Link>
        </div>
      </div>
      <div className="product-content">
        <p className="pill">{product.category}</p>
        <Link to={`/product/${product.id}`} className="product-title">{product.title}</Link>
        <div className="product-rating">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={13}
              fill={s <= Math.round(product.rating) ? "var(--primary)" : "none"}
              stroke={s <= Math.round(product.rating) ? "var(--primary)" : "var(--muted)"}
            />
          ))}
          {product.reviewsCount > 0 && <span className="muted">({product.reviewsCount})</span>}
        </div>
        <div className="price-row">
          <div className="price-group">
            <p className="price-tag">${isOnSale ? product.salePrice.toFixed(2) : product.price.toFixed(2)}</p>
            {isOnSale && <p className="original-price">${product.price.toFixed(2)}</p>}
          </div>
        </div>
        <button className="btn product-add-btn" onClick={() => addToCart(product)} disabled={stockStatus === "out"}>
          <ShoppingBag size={14} /> {stockStatus === "out" ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </motion.article>
  );
};

export default ProductCard;
