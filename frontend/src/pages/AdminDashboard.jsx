import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BarChart3, ClipboardList, CreditCard, FileText, Package, Star, Tag, Users } from "lucide-react";
import api from "../api";
import { getErrorMessage } from "../utils/errors";

const AdminOverview = lazy(() => import("../components/admin/AdminOverview"));
const AdminProducts = lazy(() => import("../components/admin/AdminProducts"));
const AdminOrders = lazy(() => import("../components/admin/AdminOrders"));
const AdminUsers = lazy(() => import("../components/admin/AdminUsers"));
const AdminReviews = lazy(() => import("../components/admin/AdminReviews"));
const AdminCategories = lazy(() => import("../components/admin/AdminCategories"));
const AdminCoupons = lazy(() => import("../components/admin/AdminCoupons"));
const AdminReports = lazy(() => import("../components/admin/AdminReports"));

const TABS = [
  { key: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
  { key: "products", label: "Products", icon: <Package size={16} /> },
  { key: "orders", label: "Orders", icon: <ClipboardList size={16} /> },
  { key: "users", label: "Users", icon: <Users size={16} /> },
  { key: "reviews", label: "Reviews", icon: <Star size={16} /> },
  { key: "categories", label: "Categories", icon: <Tag size={16} /> },
  { key: "coupons", label: "Coupons", icon: <CreditCard size={16} /> },
  { key: "reports", label: "Reports", icon: <FileText size={16} /> },
];

const TabLoader = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <div className="skeleton" style={{ width: 150, height: 16, margin: "0 auto" }} />
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/insights");
      setInsights(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInsights(); }, [loadInsights]);

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
        <Suspense fallback={<TabLoader />}>
          {activeTab === "overview" && <AdminOverview insights={insights} loading={loading} onTabChange={setActiveTab} onRefresh={loadInsights} />}
          {activeTab === "products" && <AdminProducts onRefresh={loadInsights} />}
          {activeTab === "orders" && <AdminOrders />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "reviews" && <AdminReviews />}
          {activeTab === "categories" && <AdminCategories onRefresh={loadInsights} />}
          {activeTab === "coupons" && <AdminCoupons />}
          {activeTab === "reports" && <AdminReports />}
        </Suspense>
      </div>
    </div>
  );
};

export default AdminDashboard;
