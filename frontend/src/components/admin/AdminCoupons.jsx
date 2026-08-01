import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, X } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";

const emptyCoupon = { code: "", description: "", type: "fixed", value: "", minPurchase: "", maxDiscount: "", usageLimit: "", expiresAt: "" };

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/coupons", { params: { page, limit: 15 } });
      setCoupons(data.coupons || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) { setError(getErrorMessage(err, "Failed to load coupons")); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        await api.put(`/admin/coupons/${form.id}`, form);
        setMessage("Coupon updated!");
      } else {
        await api.post("/admin/coupons", form);
        setMessage("Coupon created!");
      }
      setForm(null);
      load();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { setError(getErrorMessage(err, "Failed to save coupon")); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setMessage("Coupon deleted");
      load();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { setError(getErrorMessage(err, "Failed to delete")); }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/admin/coupons/${id}`, { isActive: !isActive });
      load();
    } catch {}
  };

  return (
    <div>
      {message && <p className="form-success" style={{ marginBottom: "0.5rem" }}>{message}</p>}
      {error && <p className="form-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}

      <div className="admin-toolbar">
        <span className="muted">{total} coupons</span>
        {!form && <button className="btn" onClick={() => setForm({ ...emptyCoupon })}><Plus size={14} /> Add Coupon</button>}
      </div>

      {form && (
        <form className="glass" onSubmit={save} style={{ padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <h3 style={{ margin: 0 }}>{form.id ? "Edit Coupon" : "New Coupon"}</h3>
            <button type="button" className="btn ghost" onClick={() => setForm(null)}><X size={14} /></button>
          </div>
          <div className="admin-form-grid">
            <label>Code <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required /></label>
            <label>Type
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="fixed">Fixed ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </label>
            <label>Value <input type="number" step="0.01" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} required /></label>
            <label>Min Purchase <input type="number" step="0.01" value={form.minPurchase} onChange={(e) => setForm(f => ({ ...f, minPurchase: e.target.value }))} placeholder="0" /></label>
            {form.type === "percentage" && <label>Max Discount <input type="number" step="0.01" value={form.maxDiscount} onChange={(e) => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="0" /></label>}
            <label>Usage Limit <input type="number" value={form.usageLimit} onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="0 = unlimited" /></label>
            <label>Expires At <input type="date" value={form.expiresAt?.split("T")[0] || ""} onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))} required /></label>
            <label className="admin-form-full">Description <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" /></label>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
            <button className="btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Coupon"}</button>
            <button className="btn ghost" type="button" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="glass admin-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>Loading...</p>
        ) : coupons.length === 0 ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>No coupons yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="admin-table-row">
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{c.code}</td>
                    <td>{c.type === "fixed" ? "Fixed" : "Percentage"}</td>
                    <td>{c.type === "fixed" ? `$${c.value}` : `${c.value}%`}</td>
                    <td>${c.minPurchase || 0}</td>
                    <td>{c.usageCount}{c.usageLimit > 0 ? `/${c.usageLimit}` : ""}</td>
                    <td style={{ fontSize: "12px" }}>{new Date(c.expiresAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{ color: c.isActive ? "var(--green)" : "var(--red)", fontSize: "12px", cursor: "pointer" }} onClick={() => toggleActive(c.id, c.isActive)}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: "0.3rem" }}>
                      <button className="btn ghost" onClick={() => setForm(c)} style={{ padding: "0.2rem" }}><Edit2 size={12} /></button>
                      <button className="btn ghost" onClick={() => remove(c.id)} style={{ padding: "0.2rem", color: "var(--red)" }}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-pagination">
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /> Prev</button>
        <span className="muted" style={{ fontSize: "13px" }}>Page {page} of {pages}</span>
        <button className="btn ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export default AdminCoupons;
