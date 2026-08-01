import { useEffect, useState } from "react";
import { BarChart3, Box, ClipboardList, Grid3X3, Package, Star, Tag, Users } from "lucide-react";
import api from "../api";
import { getErrorMessage } from "../utils/errors";
import AdminOverview from "../components/admin/AdminOverview";
import AdminProducts from "../components/admin/AdminProducts";
import AdminOrders from "../components/admin/AdminOrders";
import AdminUsers from "../components/admin/AdminUsers";
import AdminReviews from "../components/admin/AdminReviews";
import AdminCategories from "../components/admin/AdminCategories";

const TABS = [
  { key: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
  { key: "products", label: "Products", icon: <Package size={16} /> },
  { key: "orders", label: "Orders", icon: <ClipboardList size={16} /> },
  { key: "users", label: "Users", icon: <Users size={16} /> },
  { key: "reviews", label: "Reviews", icon: <Star size={16} /> },
  { key: "categories", label: "Categories", icon: <Tag size={16} /> },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/insights");
      setInsights(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInsights(); }, []);

  return (
    <div className="container section">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="muted">Manage your store products, orders, and customers</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === "overview" && <DashboardOverviewWrapper insights={insights} loading={loading} onTabChange={setActiveTab} onRefresh={loadInsights} />}
        {activeTab === "products" && <AdminProducts onRefresh={loadInsights} />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "reviews" && <AdminReviews />}
        {activeTab === "categories" && <AdminCategories onRefresh={loadInsights} />}
      </div>
    </div>
  );
};

const DashboardOverviewWrapper = ({ insights, loading, onTabChange, onRefresh }) => {
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (insights) {
      setLowStock(insights.lowStock || []);
      setRecentOrders(insights.recentOrders || []);
    }
  }, [insights]);

  if (loading) return <p className="muted" style={{ padding: "2rem 0" }}>Loading dashboard...</p>;
  if (!insights) return null;

  return (
    <div>
      <div className="admin-stats-grid">
        <div className="glass admin-stat-card">
          <span className="admin-stat-value">${insights.totalSales.toFixed(2)}</span>
          <span className="admin-stat-label">Total Sales</span>
        </div>
        <div className="glass admin-stat-card">
          <span className="admin-stat-value">{insights.totalOrders}</span>
          <span className="admin-stat-label">Orders</span>
        </div>
        <div className="glass admin-stat-card">
          <span className="admin-stat-value">{insights.totalUsers}</span>
          <span className="admin-stat-label">Users</span>
        </div>
        <div className="glass admin-stat-card">
          <span className="admin-stat-value">{insights.totalProducts}</span>
          <span className="admin-stat-label">Products</span>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="glass admin-panel" style={{ marginTop: "1rem" }}>
          <h3 style={{ margin: "0 0 0.5rem" }}>Low Stock Warning</h3>
          {lowStock.map((p) => (
            <div key={p._id} className="admin-table-row">
              <span>{p.title}</span>
              <span className="admin-badge" style={{ background: "var(--yellow)", color: "#111" }}>{p.stock} left</span>
            </div>
          ))}
        </div>
      )}

      {recentOrders.length > 0 && (
        <div className="glass admin-panel" style={{ marginTop: "1rem" }}>
          <div className="admin-panel-header">
            <h3 style={{ margin: 0 }}>Recent Orders</h3>
            <button className="btn ghost" onClick={() => onTabChange("orders")}>View All</button>
          </div>
          {recentOrders.map((o) => (
            <div key={o._id} className="admin-table-row">
              <span>#{String(o._id).slice(-6)} - {o.customerName} - ${o.total.toFixed(2)}</span>
              <span className="admin-badge" style={{ background: "var(--primary)" }}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
