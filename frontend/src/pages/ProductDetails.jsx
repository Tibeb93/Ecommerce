import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const { user } = useAuth();

  const load = async () => {
    const { data } = await api.get(`/products/${id}`);
    setProduct(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setError("");
    if (review.comment.trim().length < 5) {
      setError("Review comment must be at least 5 characters.");
      return;
    }
    try {
      await api.post(`/products/${id}/reviews`, review);
      setReview({ rating: 5, comment: "" });
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit review."));
    }
  };

  if (!product) return <div className="container section">Loading...</div>;

  return (
    <div className="container section details-wrap">
      <article className="glass details-card">
        <img src={product.image} alt={product.title} className="details-image" />
        <div>
          <h1>{product.title}</h1>
          <p className="muted">{product.description}</p>
          <p className="pill">{product.category}</p>
          <h2>${product.price.toFixed(2)}</h2>
          <button className="btn" onClick={() => addToCart(product)}>
            Add to cart
          </button>
        </div>
      </article>

      <section className="glass reviews">
        <h3>Reviews ({product.reviews?.length || 0})</h3>
        {product.reviews?.map((r) => (
          <div key={r.id} className="review-item">
            <strong>{r.userName}</strong> - {r.rating}/5
            <p>{r.comment}</p>
          </div>
        ))}
        {user && (
          <form className="review-form" onSubmit={submitReview}>
            {error && <p className="form-error">{error}</p>}
            <select value={review.rating} onChange={(e) => setReview((s) => ({ ...s, rating: Number(e.target.value) }))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Write your review..."
              value={review.comment}
              onChange={(e) => setReview((s) => ({ ...s, comment: e.target.value }))}
              required
            />
            <button className="btn" type="submit">
              Submit review
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default ProductDetails;
