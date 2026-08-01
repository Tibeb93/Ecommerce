import { Star, User } from "lucide-react";
import { Link } from "react-router-dom";

const StarRating = ({ rating }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={14} fill={s <= rating ? "var(--primary)" : "none"} stroke={s <= rating ? "var(--primary)" : "var(--muted)"} />
    ))}
  </div>
);

const CustomerReviews = ({ reviews }) => {
  if (!reviews.length) return null;
  return (
    <section className="section fade-in-section">
      <div className="container">
        <div className="section-head">
          <h2>What Customers Say</h2>
          <p className="muted">Real reviews from real shoppers</p>
        </div>
        <div className="reviews-grid">
          {reviews.map((review) => (
            <div key={review.id} className="glass review-card">
              <StarRating rating={review.rating} />
              <p className="review-comment">"{review.comment}"</p>
              <div className="review-meta">
                <div className="review-author-row">
                  <div className="review-avatar"><User size={16} /></div>
                  <span className="review-author">{review.userName}</span>
                </div>
                {review.product && (
                  <Link to={`/product/${review.product.id}`} className="pill review-product">
                    {review.product.title}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
