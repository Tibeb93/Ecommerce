import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, XCircle, Download, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";

const STATUS_CONFIG = {
  Pending: { color: "var(--yellow)", icon: Clock },
  Paid: { color: "var(--primary)", icon: CheckCircle },
  Processing: { color: "var(--primary)", icon: Package },
  Shipped: { color: "var(--primary)", icon: Truck },
  Delivered: { color: "var(--green)", icon: CheckCircle },
  Cancelled: { color: "var(--red)", icon: XCircle },
  Refunded: { color: "var(--muted)", icon: XCircle },
};

const generateInvoiceHTML = (order) => {
  const items = order.items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.title || "Product"}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${i.unitPrice.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html><html><head><title>Invoice ${order.orderNumber}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#6c7dff}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f5f5f5;padding:8px;text-align:left;border-bottom:2px solid #ddd}.summary{text-align:right;margin-top:20px}.summary p{margin:5px 0}</style>
    </head><body>
    <h1>NovaShop Invoice</h1>
    <p><strong>Order #:</strong> ${order.orderNumber || order.id}</p>
    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <hr/>
    <p><strong>Ship to:</strong><br/>${order.shippingAddress?.fullName || ""}<br/>${order.shippingAddress?.address || ""}<br/>${order.shippingAddress?.city || ""} ${order.shippingAddress?.state || ""} ${order.shippingAddress?.zip || ""}</p>
    <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${items}</tbody></table>
    <div class="summary">
      <p>Subtotal: $${(order.subtotal || 0).toFixed(2)}</p>
      <p>Shipping: ${order.shippingCost === 0 ? "Free" : "$" + (order.shippingCost || 0).toFixed(2)}</p>
      <p>Tax: $${(order.tax || 0).toFixed(2)}</p>
      ${order.discount ? `<p>Discount: -$${order.discount.toFixed(2)}</p>` : ""}
      <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
    </div>
    <hr/>
    <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
    <p><strong>Tracking:</strong> ${order.trackingCode}</p>
    <p style="margin-top:40px;color:#999;font-size:12px">NovaShop - Thank you for your purchase!</p>
    </body></html>`;
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const toast = useToast();

  const loadOrders = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/my", { params: { page, limit: 10, status: statusFilter } });
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const toggleExpand = async (orderId) => {
    if (expandedId === orderId) { setExpandedId(null); setExpandedOrder(null); return; }
    setExpandedId(orderId);
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/orders/my/${orderId}`);
      setExpandedOrder(data);
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!confirm("Cancel this order?")) return;
    try {
      await api.patch(`/orders/my/${orderId}/cancel`, { reason: "Cancelled by customer" });
      toast.success("Order cancelled");
      loadOrders(pagination.page);
      setExpandedId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not cancel order"));
    }
  };

  const downloadInvoice = (order) => {
    const html = generateInvoiceHTML(order);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.orderNumber || order.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded!");
  };

  if (loading) {
    return (
      <div className="container section">
        <h1>My Orders</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
          {[1, 2, 3].map(n => <div key={n} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <Package size={64} style={{ color: "var(--muted)", marginBottom: "1rem" }} />
        <h1 style={{ marginBottom: "0.5rem" }}>No Orders Yet</h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>Start shopping to see your orders here!</p>
        <Link to="/" className="btn btn-primary-lg">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="cart-header">
        <h1>My Orders</h1>
        <span className="muted">{pagination.total} orders</span>
      </div>

      <div className="orders-filter">
        {["all", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
          <button key={s} className={`btn ${statusFilter === s ? "" : "ghost"}`} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
          const StatusIcon = config.icon;
          return (
            <motion.article key={order.id} className="glass order-card" layout>
              <div className="order-card-header" onClick={() => toggleExpand(order.id)}>
                <div className="order-card-info">
                  <div>
                    <span className="order-number">{order.orderNumber || order.id}</span>
                    <span className="muted" style={{ fontSize: "12px" }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="order-card-status" style={{ color: config.color }}>
                    <StatusIcon size={14} /> {order.status}
                  </div>
                </div>
                <div className="order-card-right">
                  <span className="price-tag">${order.total.toFixed(2)}</span>
                  {expandedId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === order.id && (
                  <motion.div className="order-detail" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    {loadingDetail ? (
                      <p className="muted" style={{ padding: "1rem", textAlign: "center" }}>Loading...</p>
                    ) : expandedOrder && (
                      <div className="order-detail-content">
                        {/* Status Timeline */}
                        <div className="order-timeline">
                          {(expandedOrder.statusHistory || []).map((entry, i) => {
                            const tc = STATUS_CONFIG[entry.status] || STATUS_CONFIG.Pending;
                            const Icon = tc.icon;
                            return (
                              <div key={i} className="timeline-item">
                                <div className="timeline-dot" style={{ background: tc.color }}><Icon size={12} /></div>
                                <div className="timeline-content">
                                  <strong>{entry.status}</strong>
                                  <span className="muted" style={{ fontSize: "12px" }}>{new Date(entry.date).toLocaleString()}</span>
                                  {entry.note && <p className="muted" style={{ fontSize: "12px" }}>{entry.note}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="order-detail-grid">
                          <div className="order-detail-section">
                            <h4>Shipping</h4>
                            <p>{expandedOrder.shippingAddress?.fullName}</p>
                            <p>{expandedOrder.shippingAddress?.address}</p>
                            <p>{expandedOrder.shippingAddress?.city} {expandedOrder.shippingAddress?.state} {expandedOrder.shippingAddress?.zip}</p>
                          </div>
                          <div className="order-detail-section">
                            <h4>Payment</h4>
                            <p>{expandedOrder.paymentMethod} - {expandedOrder.paymentStatus}</p>
                            <p>Tracking: {expandedOrder.trackingCode}</p>
                          </div>
                        </div>

                        <div className="order-items-list">
                          {expandedOrder.items.map((item, i) => (
                            <div key={i} className="order-item-row">
                              <img src={item.image || item.productId?.image} alt="" className="order-item-img" />
                              <div className="order-item-info">
                                <span>{item.title || item.productId?.title}</span>
                                <span className="muted">x{item.quantity} @ ${item.unitPrice.toFixed(2)}</span>
                              </div>
                              <span className="price-tag">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="order-totals">
                          <div className="summary-row"><span>Subtotal</span><span>${(expandedOrder.subtotal || 0).toFixed(2)}</span></div>
                          <div className="summary-row"><span>Shipping</span><span>{expandedOrder.shippingCost === 0 ? "Free" : `$${(expandedOrder.shippingCost || 0).toFixed(2)}`}</span></div>
                          <div className="summary-row"><span>Tax</span><span>${(expandedOrder.tax || 0).toFixed(2)}</span></div>
                          {expandedOrder.discount > 0 && <div className="summary-row"><span>Discount</span><span style={{ color: "var(--green)" }}>-${expandedOrder.discount.toFixed(2)}</span></div>}
                          <div className="summary-row summary-total"><span>Total</span><span>${expandedOrder.total.toFixed(2)}</span></div>
                        </div>

                        <div className="order-actions">
                          <button className="btn" onClick={() => downloadInvoice(expandedOrder)}>
                            <Download size={14} /> Download Invoice
                          </button>
                          {["Pending", "Paid", "Processing"].includes(expandedOrder.status) && (
                            <button className="btn ghost" style={{ color: "var(--red)" }} onClick={() => handleCancel(expandedOrder.id)}>
                              <XCircle size={14} /> Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>

      {pagination.pages > 1 && (
        <div className="reviews-pagination" style={{ marginTop: "1rem" }}>
          <button className="btn ghost" disabled={pagination.page <= 1} onClick={() => loadOrders(pagination.page - 1)}>Prev</button>
          <span className="muted">Page {pagination.page} of {pagination.pages}</span>
          <button className="btn ghost" disabled={pagination.page >= pagination.pages} onClick={() => loadOrders(pagination.page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Orders;
