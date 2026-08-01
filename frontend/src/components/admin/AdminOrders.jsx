import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 15, sort: `${sortOrder === "desc" ? "-" : ""}${sortBy}` };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get("/admin/orders", { params });
      setOrders(data.orders || data || []);
      setTotal(data.total || (data.orders || data || []).length);
      setPages(data.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load orders."));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter, search, sortBy, sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      setMessage(`Order updated to ${status}.`);
      setTimeout(() => setMessage(""), 3000);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update order status."));
      setTimeout(() => setError(""), 3000);
    }
  };

  const exportCSV = async () => {
    try {
      const { data } = await api.get("/admin/orders/export/csv", { params: statusFilter ? { status: statusFilter } : {} });
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Orders exported successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to export orders."));
      setTimeout(() => setError(""), 3000);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(o => o === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div>
      {message && <p className="form-success" style={{ marginBottom: "0.5rem" }}>{message}</p>}
      {error && <p className="form-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}

      <div className="admin-toolbar" style={{ flexDirection: "column", gap: "0.8rem", alignItems: "stretch" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.4rem", flex: 1, maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Search by name or order #..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: 1, fontSize: "13px" }}
            />
            <button className="btn" type="submit"><Search size={14} /></button>
          </form>
          <button className="btn" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: "13px" }}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={`${sortBy}-${sortOrder}`} onChange={(e) => { const [f, o] = e.target.value.split("-"); setSortBy(f); setSortOrder(o); }} style={{ fontSize: "13px" }}>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="total-desc">Highest Total</option>
            <option value="total-asc">Lowest Total</option>
          </select>
          <span className="muted" style={{ fontSize: "13px" }}>{total} orders</span>
        </div>
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
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
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
                      <td style={{ fontFamily: "monospace", fontSize: "13px" }}>#{order.orderNumber || String(oid).slice(-6)}</td>
                      <td style={{ fontSize: "13px" }}>{order.customerName || order.user?.name || "—"}</td>
                      <td style={{ fontSize: "13px" }}>{order.items?.length || 0}</td>
                      <td style={{ fontWeight: 600, fontSize: "13px" }}>${Number(order.total).toFixed(2)}</td>
                      <td style={{ fontSize: "12px" }}>
                        <span style={{
                          color: order.paymentStatus === "paid" ? "var(--green)" : order.paymentStatus === "failed" ? "var(--red)" : "var(--yellow)"
                        }}>
                          {order.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: STATUS_COLORS[order.status] || "var(--muted)",
                          color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "6px",
                          fontSize: "11px", fontWeight: 700,
                        }}>
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
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="muted" style={{ fontSize: "13px" }}>Page {page} of {pages}</span>
        <button className="btn ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AdminOrders;
