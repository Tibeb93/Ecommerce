import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Package, Tag, AlertTriangle, Info, X } from "lucide-react";
import api from "../api";
import { useToast } from "../context/ToastContext";

const iconMap = { order: Package, stock: AlertTriangle, promo: Tag, system: Info, review: Info };

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadUnread = async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnread(data.unread);
    } catch {}
  };

  const loadAll = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setUnread(0);
    } catch {}
  };

  const toggleOpen = () => {
    if (!open) loadAll();
    setOpen(!open);
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={toggleOpen} style={{ position: "relative", background: "none", border: "none", color: "var(--text)", cursor: "pointer", padding: "0.4rem" }}>
        <Bell size={18} />
        {unread > 0 && <span className="cart-badge" style={{ top: -4, right: -4 }}>{unread > 99 ? "99+" : unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="glass notification-dropdown" initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1rem", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0, fontSize: "14px" }}>Notifications</h3>
              {unread > 0 && <button className="btn ghost" onClick={markAllRead} style={{ fontSize: "11px", padding: "0.2rem 0.4rem" }}><Check size={12} /> Mark all read</button>}
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <p className="muted" style={{ padding: "2rem", textAlign: "center", fontSize: "13px" }}>No notifications</p>
              ) : notifications.slice(0, 20).map((n) => {
                const Icon = iconMap[n.type] || Info;
                return (
                  <div key={n.id} className={`notification-item ${!n.read ? "unread" : ""}`} onClick={() => markRead(n.id)}>
                    <div className={`notification-icon notification-icon-${n.type}`}><Icon size={14} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{n.title}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>{n.message}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)", marginTop: "0.2rem" }}>{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
