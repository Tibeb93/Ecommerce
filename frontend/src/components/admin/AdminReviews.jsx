import { useEffect, useState, useCallback } from "react";
import { Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";
import { isValidImageUrl } from "../../utils/validators";

const StarRating = ({ rating }) => (
  <div style={{ display: "flex", gap: "2px" }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={14}
        fill={s <= rating ? "var(--primary)" : "none"}
        stroke={s <= rating ? "var(--primary)" : "var(--muted)"}
      />
    ))}
  </div>
);

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/reviews", { params: { page, limit: 15 } });
      setReviews(data.reviews || data || []);
      setTotal(data.total || (data.reviews || data || []).length);
      setPages(data.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load reviews."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      setMessage("Review deleted.");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete review."));
    }
  };

  return (
    <div>
      {message && <p className="form-success" style={{ marginBottom: "0.5rem" }}>{message}</p>}
      {error && <p className="form-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}

      <div className="glass admin-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>No reviews found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => {
                  const rid = r.id || r._id;
                  return (
                    <tr key={rid} className="admin-table-row">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "11px",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {(r.userName || r.user?.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 600 }}>{r.userName || r.user?.name || "Anonymous"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {r.product?.image && isValidImageUrl(r.product.image) ? (
                            <img
                              src={r.product.image}
                              alt={r.product.title}
                              className="admin-thumb"
                              style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : null}
                          <span style={{ fontSize: "13px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.product?.title || "—"}
                          </span>
                        </div>
                      </td>
                      <td><StarRating rating={r.rating} /></td>
                      <td>
                        <p style={{ margin: 0, fontSize: "13px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.comment}
                        </p>
                      </td>
                      <td className="muted" style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <button
                          className="btn ghost"
                          style={{ padding: "0.3rem", width: "30px", height: "30px", justifyContent: "center", color: "var(--red)" }}
                          onClick={() => deleteReview(rid)}
                          title="Delete review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-pagination">
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="muted" style={{ fontSize: "13px" }}>Page {page} of {pages} ({total} reviews)</span>
        <button className="btn ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AdminReviews;
