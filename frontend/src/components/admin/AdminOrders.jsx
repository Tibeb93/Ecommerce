import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  Pending: "var(--yellow)",
  Processing: "var(--primary)",
  Shipped: "#8b5cf6",
  Delivered: "var(--green)",
  Cancelled: "var(--red)",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/admin/orders", { params });
      setOrders(data.orders || data || []);
      setTotal(data.total || (data.orders || data || []).length);
      setPages(data.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load orders."));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      setMessage(`Order updated to ${status}.`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update order status."));
    }
  };

  return (
    <div>
      {message && <p className="form-success" style={{ marginBottom: "0.5rem" }}>{message}</p>}
      {error && <p className="form-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}

      <div className="admin-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="muted" style={{ fontSize: "13px" }}>Filter by status:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: "13px" }}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <span className="muted" style={{ fontSize: "13px" }}>{total} orders</span>
      </div>

      <div className="glass admin-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>No orders found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const oid = order.id || order._id;
                  return (
                    <tr key={oid} className="admin-table-row">
                      <td style={{ fontFamily: "monospace", fontSize: "13px" }}>#{String(oid).slice(-6)}</td>
                      <td style={{ fontSize: "13px" }}>{order.customerName || order.user?.name || "—"}</td>
                      <td style={{ fontWeight: 600, fontSize: "13px" }}>${Number(order.total).toFixed(2)}</td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: STATUS_COLORS[order.status] || "var(--muted)",
                            color: "#fff",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="muted" style={{ fontSize: "12px" }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(oid, e.target.value)}
                          style={{ fontSize: "12px", padding: "0.25rem 0.5rem" }}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
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
        <span className="muted" style={{ fontSize: "13px" }}>Page {page} of {pages}</span>
        <button className="btn ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AdminOrders;
