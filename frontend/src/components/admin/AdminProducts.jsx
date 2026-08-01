import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Eye, EyeOff, Archive } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";
import { isValidImageUrl } from "../../utils/validators";
import AdminProductForm from "./AdminProductForm";

const STATUS_OPTIONS = ["draft", "published", "out_of_stock", "archived", "coming_soon", "discontinued"];

const STATUS_COLORS = {
  draft: "var(--muted)",
  published: "var(--green)",
  out_of_stock: "var(--red)",
  archived: "var(--yellow)",
  coming_soon: "var(--primary)",
  discontinued: "#6b7280",
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [sort, setSort] = useState("createdAt_desc");

  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 12, sort };
      if (search) params.q = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (brandFilter) params.brand = brandFilter;
      const { data } = await api.get("/admin/products", { params });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load products."));
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter, brandFilter, sort]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/admin/categories");
      setCategories(data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, brandFilter, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const bulkAction = async (action) => {
    if (selected.size === 0) return;
    const confirmMsg = {
      delete: "Delete selected products?",
      publish: "Publish selected products?",
      draft: "Set selected products to draft?",
      archive: "Archive selected products?",
    };
    if (!window.confirm(confirmMsg[action] || "Proceed?")) return;
    try {
      setBulkLoading(true);
      await api.post("/admin/products/bulk", { ids: Array.from(selected), action });
      setMessage(`Bulk ${action} completed.`);
      setSelected(new Set());
      loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, `Bulk ${action} failed.`));
    } finally {
      setBulkLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setMessage("Product deleted.");
      loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete product."));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/products/${id}/status`, { status });
      setMessage("Status updated.");
      loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update status."));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleFormSaved = () => {
    setEditingProduct(null);
    setShowForm(false);
    loadProducts();
  };

  const getStockLabel = (p) => {
    if (p.stock === 0) return <span style={{ color: "var(--red)", fontWeight: 600 }}>Out of stock</span>;
    if (p.stock <= (p.lowStockAlert || 5)) return <span style={{ color: "var(--yellow)", fontWeight: 600 }}>{p.stock} left</span>;
    return <span style={{ color: "var(--green)" }}>{p.stock}</span>;
  };

  return (
    <div>
      {showForm && (
        <AdminProductForm
          product={editingProduct}
          categories={categories}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {message && <p className="form-success" style={{ marginBottom: "0.5rem" }}>{message}</p>}
      {error && <p className="form-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}

      <div className="admin-toolbar">
        <form onSubmit={handleSearch} className="admin-search" style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.35rem 0.6rem" }}>
            <Search size={16} className="muted" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", color: "var(--text)", flex: 1, outline: "none", fontSize: "13px" }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ fontSize: "13px" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: "13px" }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Brand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            style={{ width: "120px", fontSize: "13px" }}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ fontSize: "13px" }}>
            <option value="createdAt_desc">Newest</option>
            <option value="createdAt_asc">Oldest</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="title_asc">Title: A-Z</option>
            <option value="title_desc">Title: Z-A</option>
            <option value="stock_asc">Stock: Low to High</option>
          </select>
          <button className="btn" type="submit" style={{ fontSize: "13px" }}>Search</button>
        </form>
        <button className="btn" onClick={handleCreate} style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      {selected.size > 0 && (
        <div className="glass admin-bulk-bar">
          <span>{selected.size} selected</span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button className="btn" style={{ fontSize: "12px", padding: "0.3rem 0.6rem" }} disabled={bulkLoading} onClick={() => bulkAction("publish")}>
              <Eye size={12} /> Publish
            </button>
            <button className="btn ghost" style={{ fontSize: "12px", padding: "0.3rem 0.6rem" }} disabled={bulkLoading} onClick={() => bulkAction("draft")}>
              <EyeOff size={12} /> Draft
            </button>
            <button className="btn ghost" style={{ fontSize: "12px", padding: "0.3rem 0.6rem" }} disabled={bulkLoading} onClick={() => bulkAction("archive")}>
              <Archive size={12} /> Archive
            </button>
            <button
              className="btn ghost"
              style={{ fontSize: "12px", padding: "0.3rem 0.6rem", color: "var(--red)", borderColor: "var(--red)" }}
              disabled={bulkLoading}
              onClick={() => bulkAction("delete")}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      <div className="glass admin-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>No products found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selected.size === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id || p._id} className="admin-table-row" style={selected.has(p.id || p._id) ? { background: "rgba(108,125,255,0.08)" } : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id || p._id)}
                        onChange={() => toggleSelect(p.id || p._id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <img
                          src={isValidImageUrl(p.image) ? p.image : "https://placehold.co/60x60?text=No+Image"}
                          alt={p.title}
                          className="admin-thumb"
                          style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover" }}
                          onError={(e) => { e.target.src = "https://placehold.co/60x60?text=No+Image"; }}
                        />
                        <div>
                          <span className="admin-product-name" style={{ fontWeight: 600, fontSize: "13px" }}>{p.title}</span>
                          {p.brand && <span className="muted" style={{ display: "block", fontSize: "11px" }}>{p.brand}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: "12px", fontFamily: "monospace" }}>{p.sku || "—"}</td>
                    <td className="muted" style={{ fontSize: "13px" }}>{p.categoryName || "—"}</td>
                    <td style={{ fontWeight: 600, fontSize: "13px" }}>${Number(p.price).toFixed(2)}</td>
                    <td style={{ fontSize: "13px" }}>{getStockLabel(p)}</td>
                    <td>
                      <select
                        value={p.status || "draft"}
                        onChange={(e) => updateStatus(p.id || p._id, e.target.value)}
                        className="admin-badge"
                        style={{
                          background: STATUS_COLORS[p.status] || "var(--muted)",
                          color: "#fff",
                          border: "none",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} style={{ background: "var(--surface)", color: "var(--text)" }}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button
                          className="btn ghost"
                          style={{ padding: "0.3rem", width: "30px", height: "30px", justifyContent: "center" }}
                          onClick={() => handleEdit(p)}
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn ghost"
                          style={{ padding: "0.3rem", width: "30px", height: "30px", justifyContent: "center", color: "var(--red)" }}
                          onClick={() => deleteProduct(p.id || p._id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-pagination">
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="muted" style={{ fontSize: "13px" }}>Page {page} of {pages} ({total} products)</span>
        <button className="btn ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AdminProducts;
