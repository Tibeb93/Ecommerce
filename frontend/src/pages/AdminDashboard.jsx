import { useEffect, useState } from "react";
import api from "../api";
import { getErrorMessage } from "../utils/errors";
import { isValidImageUrl } from "../utils/validators";

const AdminDashboard = () => {
  const [insights, setInsights] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    image: "",
    price: "",
    stock: "",
    categoryId: ""
  });

  const load = async () => {
    try {
      setLoading(true);
      const [i, p, o, u, c] = await Promise.all([
        api.get("/admin/insights"),
        api.get("/admin/products"),
        api.get("/admin/orders"),
        api.get("/admin/users"),
        api.get("/admin/categories")
      ]);
      setInsights(i.data);
      setProducts(p.data);
      setOrders(o.data);
      setUsers(u.data);
      setCategories(c.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createProduct = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (newProduct.title.trim().length < 3) return setError("Product title must be at least 3 characters.");
    if (newProduct.description.trim().length < 10) return setError("Description must be at least 10 characters.");
    if (!isValidImageUrl(newProduct.image)) return setError("Please enter a valid image URL.");
    if (Number(newProduct.price) <= 0) return setError("Price must be greater than 0.");
    if (!Number.isInteger(Number(newProduct.stock)) || Number(newProduct.stock) < 0) {
      return setError("Stock must be a non-negative integer.");
    }
    try {
      await api.post("/admin/products", newProduct);
      setNewProduct({ title: "", description: "", image: "", price: "", stock: "", categoryId: "" });
      setMessage("Product created successfully.");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create product."));
    }
  };

  const updateOrderStatus = async (id, status) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      setMessage(`Order #${id} updated.`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update order status."));
    }
  };

  const deleteProduct = async (id) => {
    setMessage("");
    setError("");
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setMessage("Product removed.");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete product."));
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (newCategory.trim().length < 2) return setError("Category name must be at least 2 characters.");
    try {
      await api.post("/admin/categories", { name: newCategory });
      setNewCategory("");
      setMessage("Category created.");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create category."));
    }
  };

  const deleteUnusedCategory = async (id) => {
    setMessage("");
    setError("");
    if (!window.confirm("Remove this unused category?")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setMessage("Unused category removed.");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Cannot remove category while it is used by products."));
    }
  };

  return (
    <div className="container section">
      <h1>Admin Dashboard</h1>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      {loading && <p className="muted">Loading dashboard...</p>}

      {insights && (
        <div className="stats-grid">
          <article className="glass stat-card">Sales: ${insights.totalSales.toFixed(2)}</article>
          <article className="glass stat-card">Orders: {insights.totalOrders}</article>
          <article className="glass stat-card">Users: {insights.totalUsers}</article>
          <article className="glass stat-card">Products: {insights.totalProducts}</article>
        </div>
      )}

      <section className="glass panel">
        <h2>Add product</h2>
        <form className="admin-form" onSubmit={createProduct}>
          <input placeholder="Title" value={newProduct.title} onChange={(e) => setNewProduct((s) => ({ ...s, title: e.target.value }))} required />
          <input placeholder="Image URL" value={newProduct.image} onChange={(e) => setNewProduct((s) => ({ ...s, image: e.target.value }))} required />
          <input type="number" step="0.01" placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct((s) => ({ ...s, price: e.target.value }))} required />
          <input type="number" placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct((s) => ({ ...s, stock: e.target.value }))} required />
          <select value={newProduct.categoryId} onChange={(e) => setNewProduct((s) => ({ ...s, categoryId: e.target.value }))} required>
            <option value="">Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct((s) => ({ ...s, description: e.target.value }))} required />
          <button className="btn" type="submit">
            Save product
          </button>
        </form>
      </section>

      <section className="glass panel">
        <h2>Categories</h2>
        <form className="inline-form" onSubmit={createCategory}>
          <input
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
          />
          <button className="btn" type="submit">
            Add category
          </button>
        </form>
        <div className="simple-table">
          {categories.map((cat) => {
            const used = products.some((p) => Number(p.categoryId) === Number(cat.id));
            return (
              <div key={cat.id} className="table-row">
                <span>
                  {cat.name} {used ? "(in use)" : "(unused)"}
                </span>
                <button className="btn ghost" disabled={used} onClick={() => deleteUnusedCategory(cat.id)}>
                  Remove unused
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass panel">
        <h2>Orders</h2>
        {orders.map((order) => (
          <div className="order-row" key={order.id}>
            <span>#{order.id} - {order.customerName} - ${order.total.toFixed(2)}</span>
            <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
              {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>

      <section className="glass panel">
        <h2>Users</h2>
        <div className="simple-table">
          {users.map((u) => (
            <div key={u.id}>
              {u.name} - {u.email} ({u.role})
            </div>
          ))}
        </div>
      </section>

      <section className="glass panel">
        <h2>Products</h2>
        <div className="simple-table">
          {products.map((p) => (
            <div key={p.id} className="table-row">
              <span>
                {p.title} - ${p.price.toFixed(2)} - Stock {p.stock}
              </span>
              <button className="btn ghost" onClick={() => deleteProduct(p.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
