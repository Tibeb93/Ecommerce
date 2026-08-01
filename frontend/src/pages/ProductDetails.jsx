import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Star, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Minus, Plus, ThumbsUp, Edit3, Trash2, Check, X, Filter } from "lucide-react";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import { trackRecent } from "../components/RecentlyViewed";
import ProductRecommendations from "../components/ProductRecommendations";

const TABS = ["Description", "Specifications", "Reviews"];

function StarRating({ rating, size = 16 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} fill={s <= rating ? "var(--primary)" : "none"} stroke={s <= rating ? "var(--primary)" : "var(--muted)"} />
      ))}
    </div>
  );
}

function RatingDistribution({ distribution, total, onFilter }) {
  return (
    <div className="rating-distribution">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <button key={stars} className="rating-bar-row" onClick={() => onFilter(stars)}>
            <span className="rating-bar-label">{stars}★</span>
            <div className="rating-bar-track">
              <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="rating-bar-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function ReviewForm({ productId, onSuccess, editingReview, onCancelEdit }) {
  const { user } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(editingReview?.rating || 5);
  const [comment, setComment] = useState(editingReview?.comment || "");
  const [error, setError] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setComment(editingReview.comment);
    }
  }, [editingReview]);

  if (!user) return <p className="muted" style={{ marginTop: "1rem" }}><Link to="/login">Log in</Link> to leave a review.</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (comment.trim().length < 5) {
      setError("Review must be at least 5 characters.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingReview) {
        await api.put(`/reviews/${editingReview.id}`, { rating, comment: comment.trim() });
        toast.success("Review updated!");
      } else {
        await api.post(`/products/${productId}/reviews`, { rating, comment: comment.trim() });
        toast.success("Review submitted!");
      }
      setComment("");
      setRating(5);
      onCancelEdit?.();
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit review."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form glass" onSubmit={handleSubmit}>
      <h4>{editingReview ? "Edit Review" : "Write a Review"}</h4>
      {error && <p className="form-error">{error}</p>}
      <div className="review-stars-input">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" className="review-star-btn"
            onMouseEnter={() => setHoveredStar(s)} onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(s)}>
            <Star size={22} fill={(hoveredStar || rating) >= s ? "var(--primary)" : "none"}
              stroke={(hoveredStar || rating) >= s ? "var(--primary)" : "var(--muted)"} />
          </button>
        ))}
        <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "13px" }}>{rating}/5</span>
      </div>
      <textarea className="review-textarea" placeholder="Write your review (min 5 characters)..."
        value={comment} onChange={(e) => setComment(e.target.value)} required rows={4} />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : editingReview ? "Update Review" : "Submit Review"}
        </button>
        {editingReview && (
          <button type="button" className="btn ghost" onClick={() => { onCancelEdit?.(); setComment(""); setRating(5); }}>
            <X size={14} /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [reviewsData, setReviewsData] = useState({ reviews: [], pagination: { page: 1, pages: 1, total: 0 }, distribution: {}, average: 0 });
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      trackRecent(data.id);
      setSelectedImage(0);
      setQuantity(1);
    } catch {
      toast.error("Product not found");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const loadReviews = useCallback(async () => {
    setReviewLoading(true);
    try {
      const { data } = await api.get(`/reviews/product/${id}`, { params: { page: reviewPage, sort: reviewSort, limit: 5 } });
      setReviewsData(data);
    } catch { /* silent */ } finally {
      setReviewLoading(false);
    }
  }, [id, reviewPage, reviewSort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeTab === 2) loadReviews(); }, [activeTab, loadReviews]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    toast.success(`${product.title} added to cart!`);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted");
      loadReviews();
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete review"));
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const { data } = await api.post(`/reviews/${reviewId}/helpful`);
      setReviewsData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => r.id === reviewId ? { ...r, helpful: data.helpful } : r)
      }));
      toast.success("Thanks for your feedback!");
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="container section">
        <div className="product-details-skeleton">
          <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="skeleton" style={{ height: 32, width: "60%" }} />
            <div className="skeleton" style={{ height: 20, width: "40%" }} />
            <div className="skeleton" style={{ height: 60, width: "30%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const isOnSale = product.salePrice > 0 && product.saleEnds && new Date(product.saleEnds) > new Date();
  const displayPrice = isOnSale ? product.salePrice : product.price;
  const discount = isOnSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  const inStock = product.stock > 0;
  const stockStatus = product.stock === 0 ? "out" : product.stock <= 5 ? "low" : "in";

  const specs = [
    product.brand && { label: "Brand", value: product.brand },
    product.sku && { label: "SKU", value: product.sku },
    product.weight && { label: "Weight", value: `${product.weight} kg` },
    product.dimensions && { label: "Dimensions", value: product.dimensions },
    product.barcode && { label: "Barcode", value: product.barcode },
    product.category && { label: "Category", value: product.category },
    ...((product.variants || []).map(v => ({ label: v.name, value: v.options?.map(o => o.label).join(", ") || "" }))),
  ].filter(Boolean);

  return (
    <>
      <div className="container section">
        <nav className="breadcrumb">
          <Link to="/">Home</Link><span>/</span>
          {product.category && <><Link to={`/?category=${product.categoryId}`}>{product.category}</Link><span>/</span></>}
          <span className="muted">{product.title}</span>
        </nav>

        <div className="product-details-grid">
          <div className="product-gallery">
            <div className="product-main-image glass">
              <img src={images[selectedImage]} alt={product.title} />
              {isOnSale && <span className="badge badge-sale product-detail-badge">-{discount}%</span>}
              {!inStock && <span className="badge badge-out product-detail-badge">Out of Stock</span>}
              {stockStatus === "low" && <span className="badge badge-low product-detail-badge">Only {product.stock} left!</span>}
            </div>
            {images.length > 1 && (
              <div className="product-thumbnails">
                {images.map((img, i) => (
                  <button key={i} className={`product-thumb ${i === selectedImage ? "active" : ""}`} onClick={() => setSelectedImage(i)}>
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            <div className="product-info-header">
              <h1 className="product-detail-title">{product.title}</h1>
              <div className="product-detail-rating">
                <StarRating rating={Math.round(product.rating)} size={18} />
                <span className="muted">({product.reviewsCount || 0} reviews)</span>
              </div>
            </div>

            <div className="product-detail-price">
              <span className="price-tag" style={{ fontSize: "1.8rem" }}>${displayPrice.toFixed(2)}</span>
              {isOnSale && <span className="original-price" style={{ fontSize: "1.1rem" }}>${product.price.toFixed(2)}</span>}
              {isOnSale && <span className="discount-badge">Save {discount}%</span>}
            </div>

            {product.category && <Link to={`/?category=${product.categoryId}`} className="pill product-category-link">{product.category}</Link>}

            <p className="product-detail-desc">{product.description}</p>

            <div className="product-purchase">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))} disabled={quantity >= (product.stock || 99)}><Plus size={16} /></button>
              </div>
              <button className="btn btn-primary-lg product-buy-btn" onClick={handleAddToCart} disabled={!inStock} style={{ flex: 1 }}>
                <ShoppingBag size={18} /> {inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>

            <div className="trust-badges">
              <div className="trust-badge"><Truck size={18} /> Free Shipping</div>
              <div className="trust-badge"><Shield size={18} /> Secure Payment</div>
              <div className="trust-badge"><RotateCcw size={18} /> Easy Returns</div>
            </div>

            <div className="product-tabs">
              <div className="product-tab-nav">
                {TABS.map((tab, i) => (
                  <button key={tab} className={`product-tab-btn ${i === activeTab ? "active" : ""}`} onClick={() => setActiveTab(i)}>
                    {tab}
                    {i === 2 && reviewsData.pagination.total > 0 && <span className="tab-count">{reviewsData.pagination.total}</span>}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} className="product-tab-content glass"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

                  {activeTab === 0 && (
                    <div className="tab-description">
                      <p>{product.description}</p>
                      {product.tags?.length > 0 && (
                        <div className="product-tags">{product.tags.map((tag) => <span key={tag} className="product-tag">{tag}</span>)}</div>
                      )}
                    </div>
                  )}

                  {activeTab === 1 && (
                    <div className="tab-specs">
                      {specs.length > 0 ? (
                        <table className="specs-table">
                          <tbody>{specs.map((s, i) => <tr key={i}><td className="spec-label">{s.label}</td><td className="spec-value">{s.value}</td></tr>)}</tbody>
                        </table>
                      ) : <p className="muted">No specifications available.</p>}
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="tab-reviews">
                      <div className="reviews-summary">
                        <div className="reviews-summary-left">
                          <span className="reviews-avg">{reviewsData.average}</span>
                          <StarRating rating={Math.round(reviewsData.average)} size={20} />
                          <span className="muted">{reviewsData.pagination.total} reviews</span>
                        </div>
                        <RatingDistribution distribution={reviewsData.distribution} total={reviewsData.pagination.total} onFilter={(stars) => {}} />
                      </div>

                      <ReviewForm productId={id} onSuccess={() => { loadReviews(); load(); }} editingReview={editingReview} onCancelEdit={() => setEditingReview(null)} />

                      <div className="reviews-toolbar">
                        <span className="muted">{reviewsData.pagination.total} reviews</span>
                        <select value={reviewSort} onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }}>
                          <option value="newest">Newest</option>
                          <option value="highest">Highest Rated</option>
                          <option value="lowest">Lowest Rated</option>
                          <option value="helpful">Most Helpful</option>
                        </select>
                      </div>

                      <div className="reviews-list">
                        {reviewLoading && <p className="muted" style={{ textAlign: "center" }}>Loading reviews...</p>}
                        {!reviewLoading && reviewsData.reviews.length === 0 && (
                          <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>No reviews yet. Be the first!</p>
                        )}
                        {reviewsData.reviews.map((r) => (
                          <div key={r.id} className="review-item glass">
                            <div className="review-item-header">
                              <div className="review-avatar">{r.userName?.charAt(0)?.toUpperCase()}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <strong>{r.userName}</strong>
                                  {r.isVerified && <span className="verified-badge"><Check size={10} /> Verified Purchase</span>}
                                </div>
                                <StarRating rating={r.rating} size={13} />
                              </div>
                              <span className="muted" style={{ fontSize: "12px" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: "0.5rem 0", lineHeight: 1.6 }}>{r.comment}</p>
                            <div className="review-actions">
                              <button className="review-action-btn" onClick={() => handleHelpful(r.id)}>
                                <ThumbsUp size={13} /> {r.helpful > 0 ? r.helpful : ""} Helpful
                              </button>
                              {r.isOwner && (
                                <>
                                  <button className="review-action-btn" onClick={() => setEditingReview(r)}><Edit3 size={13} /> Edit</button>
                                  <button className="review-action-btn" style={{ color: "var(--red)" }} onClick={() => handleDeleteReview(r.id)}><Trash2 size={13} /> Delete</button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {reviewsData.pagination.pages > 1 && (
                        <div className="reviews-pagination">
                          <button className="btn ghost" disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)}>Prev</button>
                          <span className="muted">Page {reviewPage} of {reviewsData.pagination.pages}</span>
                          <button className="btn ghost" disabled={reviewPage >= reviewsData.pagination.pages} onClick={() => setReviewPage(p => p + 1)}>Next</button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <ProductRecommendations productId={id} />
    </>
  );
};

export default ProductDetails;
