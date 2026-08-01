import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, Clock } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";
const AdminOverview = ({ onTabSwitch }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/insights");
      setInsights(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load insights."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="muted" style={{ padding: "2rem 0" }}>Loading dashboard...</p>;
  if (error) return <p className="form-error" style={{ padding: "2rem 0" }}>{error}</p>;
  if (!insights) return null;

  const stats = [
    { label: "Total Sales", value: `$${insights.totalSales.toFixed(2)}`, icon: DollarSign, color: "var(--green)" },
    { label: "Total Orders", value: insights.totalOrders, icon: ShoppingCart, color: "var(--primary)" },
    { label: "Total Users", value: insights.totalUsers, icon: Users, color: "var(--accent)" },
    { label: "Total Products", value: insights.totalProducts, icon: Package, color: "var(--yellow)" },
  ];

  return (
    <div>
      <div className="admin-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="glass admin-stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="muted" style={{ fontSize: "13px" }}>{s.label}</span>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {insights.lowStock && insights.lowStock.length > 0 && (
        <div className="glass admin-panel" style={{ marginTop: "1.5rem", padding: "1.2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <AlertTriangle size={18} style={{ color: "var(--yellow)" }} />
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Low Stock Alerts ({insights.lowStock.length})</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {insights.lowStock.map((item) => (
                  <tr key={item.id} className="admin-table-row">
                    <td>{item.title}</td>
                    <td>
                      <span style={{ color: item.stock === 0 ? "var(--red)" : "var(--yellow)", fontWeight: 600 }}>
                        {item.stock} left
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn ghost"
                        style={{ fontSize: "12px", padding: "0.3rem 0.6rem" }}
                        onClick={() => onTabSwitch && onTabSwitch("products")}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {insights.recentOrders && insights.recentOrders.length > 0 && (
        <div className="glass admin-panel" style={{ marginTop: "1.5rem", padding: "1.2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Clock size={18} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Recent Orders</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {insights.recentOrders.map((order) => (
                  <tr key={order.id} className="admin-table-row">
                    <td style={{ fontFamily: "monospace" }}>#{String(order.id).slice(-6)}</td>
                    <td>{order.customerName || "—"}</td>
                    <td style={{ fontWeight: 600 }}>${Number(order.total).toFixed(2)}</td>
                    <td>
                      <span
                        className="admin-badge"
                        style={{
                          background: STATUS_COLORS[order.status] || "var(--muted)",
                          color: "#fff",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: "13px" }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn ghost"
            style={{ marginTop: "1rem", fontSize: "13px" }}
            onClick={() => onTabSwitch && onTabSwitch("orders")}
          >
            View All Orders
          </button>
        </div>
      )}
    </div>
  );
};

const STATUS_COLORS = {
  Pending: "var(--yellow)",
  Processing: "var(--primary)",
  Shipped: "#8b5cf6",
  Delivered: "var(--green)",
  Cancelled: "var(--red)",
};

export default AdminOverview;
