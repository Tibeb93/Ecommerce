import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Package, DollarSign, ShoppingCart } from "lucide-react";
import api from "../../api";

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [period]);

  const load = async () => {
    setLoading(true);
    try {
      const [overviewRes, salesRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get(`/analytics/sales?period=${period}`),
      ]);
      setData(overviewRes.data);
      setSalesData(salesRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />;

  const maxRevenue = Math.max(...(salesData?.revenueByDay?.map(d => d.revenue) || [1]));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Analytics & Reports</h2>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ fontSize: "13px" }}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {data && (
        <div className="admin-stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="glass admin-stat-card">
            <DollarSign size={20} style={{ color: "var(--green)" }} />
            <div>
              <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Monthly Revenue</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem" }}>${data.revenue?.current?.toLocaleString() || 0}</p>
              <p style={{ margin: 0, fontSize: "11px", color: data.revenue?.growth >= 0 ? "var(--green)" : "var(--red)" }}>
                {data.revenue?.growth >= 0 ? "+" : ""}{data.revenue?.growth || 0}% vs last month
              </p>
            </div>
          </div>
          <div className="glass admin-stat-card">
            <ShoppingCart size={20} style={{ color: "var(--primary)" }} />
            <div>
              <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Monthly Orders</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem" }}>{data.orders?.current || 0}</p>
              <p style={{ margin: 0, fontSize: "11px", color: data.orders?.growth >= 0 ? "var(--green)" : "var(--red)" }}>
                {data.orders?.growth >= 0 ? "+" : ""}{data.orders?.growth || 0}% vs last month
              </p>
            </div>
          </div>
          <div className="glass admin-stat-card">
            <Users size={20} style={{ color: "var(--yellow)" }} />
            <div>
              <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Total Users</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem" }}>{data.totalUsers || 0}</p>
            </div>
          </div>
          <div className="glass admin-stat-card">
            <Package size={20} style={{ color: "var(--primary)" }} />
            <div>
              <p className="muted" style={{ fontSize: "12px", margin: 0 }}>Total Products</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem" }}>{data.totalProducts || 0}</p>
            </div>
          </div>
        </div>
      )}

      {salesData && (
        <>
          <div className="glass" style={{ padding: "1rem", marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.8rem" }}>Revenue Over Time</h3>
            <div className="chart-bars">
              {salesData.revenueByDay.slice(-14).map((d, i) => (
                <div key={i} className="chart-bar-col">
                  <div className="chart-bar-tooltip">${d.revenue.toFixed(0)}</div>
                  <div className="chart-bar" style={{ height: `${(d.revenue / maxRevenue) * 150}px` }} />
                  <span className="chart-bar-label">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="glass" style={{ padding: "1rem" }}>
              <h3 style={{ margin: "0 0 0.8rem" }}>Orders by Status</h3>
              {salesData.ordersByStatus.map((s) => {
                const total = salesData.ordersByStatus.reduce((sum, x) => sum + x.count, 0);
                const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : 0;
                return (
                  <div key={s.status} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <span style={{ width: 80, fontSize: "12px" }}>{s.status}</span>
                    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{s.count}</span>
                  </div>
                );
              })}
            </div>

            <div className="glass" style={{ padding: "1rem" }}>
              <h3 style={{ margin: "0 0 0.8rem" }}>Top Products</h3>
              {salesData.topProducts.slice(0, 5).map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
                  <span>{p.title}</span>
                  <span style={{ color: "var(--green)" }}>${p.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: "1rem", marginTop: "1rem" }}>
            <h3 style={{ margin: "0 0 0.8rem" }}>Top Customers</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spent</th></tr></thead>
                <tbody>
                  {salesData.topCustomers.map((c) => (
                    <tr key={c.id} className="admin-table-row">
                      <td>{c.name || "N/A"}</td>
                      <td className="muted" style={{ fontSize: "12px" }}>{c.email}</td>
                      <td>{c.orders}</td>
                      <td style={{ fontWeight: 600 }}>${c.totalSpent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
