import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, ClipboardList, DollarSign, Package, TrendingUp, Users } from "lucide-react";

const AdminOverview = ({ insights, loading, onTabChange, onRefresh }) => {
  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />;

  return (
    <div>
      <div className="admin-stats-grid">
        <div className="glass admin-stat-card">
          <DollarSign size={24} style={{ color: "var(--green)" }} />
          <div>
            <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Total Revenue</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.4rem" }}>${insights?.totalSales?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="glass admin-stat-card">
          <ClipboardList size={24} style={{ color: "var(--primary)" }} />
          <div>
            <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Total Orders</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.4rem" }}>{insights?.totalOrders || 0}</p>
          </div>
        </div>
        <div className="glass admin-stat-card">
          <Users size={24} style={{ color: "var(--yellow)" }} />
          <div>
            <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Total Users</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.4rem" }}>{insights?.totalUsers || 0}</p>
          </div>
        </div>
        <div className="glass admin-stat-card">
          <Package size={24} style={{ color: "var(--primary)" }} />
          <div>
            <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Total Products</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.4rem" }}>{insights?.totalProducts || 0}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <div className="glass" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <h3 style={{ margin: 0 }}>Recent Orders</h3>
            <button className="btn ghost" onClick={() => onTabChange("orders")} style={{ fontSize: "12px" }}>View All <ArrowRight size={12} /></button>
          </div>
          {insights?.recentOrders?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {insights.recentOrders.map((o) => (
                <div key={o._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
                  <div>
                    <span style={{ fontFamily: "monospace" }}>#{o.orderNumber || o._id?.slice(-6)}</span>
                    <span className="muted" style={{ marginLeft: "0.5rem" }}>{o.customerName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600 }}>${o.total?.toFixed(2)}</span>
                    <span className={`badge badge-${o.status === "Delivered" ? "new" : o.status === "Cancelled" ? "out" : "low"}`} style={{ fontSize: "10px" }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted" style={{ textAlign: "center" }}>No orders yet</p>}
        </div>

        <div className="glass" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <h3 style={{ margin: 0 }}>Low Stock</h3>
            <button className="btn ghost" onClick={() => onTabChange("products")} style={{ fontSize: "12px" }}>View All <ArrowRight size={12} /></button>
          </div>
          {insights?.lowStock?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {insights.lowStock.map((p) => (
                <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{p.title}</span>
                  <span style={{ color: p.stock <= 2 ? "var(--red)" : "var(--yellow)", fontWeight: 600 }}>{p.stock} left</span>
                </div>
              ))}
            </div>
          ) : <p className="muted" style={{ textAlign: "center" }}>All stocked up!</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
