import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/categories");
      setCategories(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load categories."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newCategory.trim().length < 2) return setError("Category name must be at least 2 characters.");
    try {
      setSubmitting(true);
      await api.post("/admin/categories", { name: newCategory.trim() });
      setNewCategory("");
      setMessage("Category created.");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create category."));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setMessage("Category deleted.");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Cannot delete category — it may still be in use by products."));
    }
  };

  return (
    <div>
      {message && <p className="form-success" style={{ marginBottom: "0.5rem" }}>{message}</p>}
      {error && <p className="form-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}

      <div className="glass admin-panel" style={{ padding: "1.2rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.8rem", fontSize: "14px" }}>Add Category</h3>
        <form onSubmit={addCategory} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ flex: 1, fontSize: "13px" }}
          />
          <button className="btn" type="submit" disabled={submitting} style={{ fontSize: "13px" }}>
            <Plus size={14} /> {submitting ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      <div className="glass admin-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>No categories yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const cid = cat.id || cat._id;
                  const count = cat.productCount ?? cat.count ?? 0;
                  const inUse = count > 0;
                  return (
                    <tr key={cid} className="admin-table-row">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Tag size={16} style={{ color: "var(--primary)" }} />
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>{cat.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "13px" }}>
                        <span style={{ fontWeight: 600, color: inUse ? "var(--green)" : "var(--muted)" }}>{count}</span>
                        <span className="muted" style={{ marginLeft: "0.3rem" }}>products</span>
                      </td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: inUse ? "var(--green)" : "var(--muted)",
                            color: "#fff",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {inUse ? "In Use" : "Unused"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn ghost"
                          style={{
                            padding: "0.3rem",
                            width: "30px",
                            height: "30px",
                            justifyContent: "center",
                            color: inUse ? "var(--muted)" : "var(--red)",
                            opacity: inUse ? 0.4 : 1,
                            cursor: inUse ? "not-allowed" : "pointer",
                          }}
                          disabled={inUse}
                          onClick={() => deleteCategory(cid)}
                          title={inUse ? "Cannot delete — category is in use" : "Delete category"}
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
    </div>
  );
};

export default AdminCategories;
