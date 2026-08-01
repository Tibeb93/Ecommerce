import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, Lock, MapPin, Plus, Trash2, Star, Edit2, Check, X } from "lucide-react";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

const Profile = () => {
  const { user: authUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", avatar: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({ label: "Home", fullName: "", phone: "", address: "", address2: "", city: "", state: "", zip: "", country: "US", isDefault: false });
  const [editingAddr, setEditingAddr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/profile/me");
      setUser(data);
      setForm({ name: data.name || "", phone: data.phone || "", avatar: data.avatar || "" });
    } catch { toast.error("Failed to load profile"); }
    finally { setLoading(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const formData = new FormData();
    formData.append("avatar", file);
    setSaving(true);
    try {
      const { data } = await api.post("/profile/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUser(data);
      setForm(f => ({ ...f, avatar: data.avatar || "" }));
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload avatar"));
    } finally { setSaving(false); }
  };

  const loadAddresses = async () => {
    try {
      const { data } = await api.get("/profile/addresses");
      setAddresses(data);
    } catch {}
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/profile/me", form);
      toast.success("Profile updated!");
      setEditing(false);
      loadProfile();
    } catch (err) { toast.error(getErrorMessage(err, "Failed to update profile")); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords don't match");
    }
    setSaving(true);
    try {
      await api.put("/profile/change-password", { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success("Password changed!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { toast.error(getErrorMessage(err, "Failed to change password")); }
    finally { setSaving(false); }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAddr) {
        await api.put(`/profile/addresses/${editingAddr}`, addrForm);
        toast.success("Address updated!");
      } else {
        await api.post("/profile/addresses", addrForm);
        toast.success("Address added!");
      }
      setEditingAddr(null);
      setAddrForm({ label: "Home", fullName: "", phone: "", address: "", address2: "", city: "", state: "", zip: "", country: "US", isDefault: false });
      loadAddresses();
    } catch (err) { toast.error(getErrorMessage(err, "Failed to save address")); }
    finally { setSaving(false); }
  };

  const deleteAddress = async (id) => {
    if (!confirm("Delete this address?")) return;
    try {
      await api.delete(`/profile/addresses/${id}`);
      toast.success("Address deleted");
      loadAddresses();
    } catch (err) { toast.error(getErrorMessage(err, "Failed to delete")); }
  };

  const startEditAddr = (addr) => {
    setEditingAddr(addr.id);
    setAddrForm({ label: addr.label || "Home", fullName: addr.fullName, phone: addr.phone, address: addr.address, address2: addr.address2 || "", city: addr.city, state: addr.state, zip: addr.zip, country: addr.country || "US", isDefault: addr.isDefault });
  };

  if (loading) return <div className="container section"><div className="skeleton" style={{ height: 300, borderRadius: 12 }} /></div>;

  return (
    <div className="container section">
      <h1 style={{ marginBottom: "1.5rem" }}>My Account</h1>
      <div className="profile-layout">
        <div className="profile-sidebar glass">
          <div className="profile-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
            {user?.avatar ? <img src={user.avatar} alt="" className="profile-avatar" /> : <div className="profile-avatar-placeholder"><User size={32} /></div>}
            <div className="profile-avatar-overlay"><Camera size={16} /></div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadAvatar} />
          </div>
          <h3 style={{ textAlign: "center", margin: "0.5rem 0 0.2rem" }}>{user?.name}</h3>
          <p className="muted" style={{ textAlign: "center", fontSize: "13px" }}>{user?.email}</p>
          <div className="profile-nav">
            {["profile", "password", "addresses"].map((t) => (
              <button key={t} className={`btn ${tab === t ? "" : "ghost"}`} onClick={() => setTab(t)} style={{ width: "100%", justifyContent: "flex-start" }}>
                {t === "profile" && <User size={14} />} {t === "password" && <Lock size={14} />} {t === "addresses" && <MapPin size={14} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="profile-content">
          {tab === "profile" && (
            <motion.div className="glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ marginBottom: "1rem" }}>Profile Information</h2>
              <div className="profile-form">
                <label><User size={14} /> Name</label>
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} disabled={!editing} />
                <label><Mail size={14} /> Email</label>
                <input value={user?.email || ""} disabled style={{ opacity: 0.6 }} />
                <label><Phone size={14} /> Phone</label>
                <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} disabled={!editing} placeholder="Optional" />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {editing ? (
                    <>
                      <button className="btn" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                      <button className="btn ghost" onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || "", avatar: user.avatar || "" }); }}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit Profile</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "password" && (
            <motion.div className="glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ marginBottom: "1rem" }}>Change Password</h2>
              <form onSubmit={changePassword} className="profile-form">
                <label><Lock size={14} /> Current Password</label>
                <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} required />
                <label><Lock size={14} /> New Password</label>
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required />
                <label><Lock size={14} /> Confirm New Password</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
                <button className="btn" type="submit" disabled={saving} style={{ marginTop: "0.5rem" }}>{saving ? "Changing..." : "Change Password"}</button>
              </form>
            </motion.div>
          )}

          {tab === "addresses" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2>Address Book</h2>
                {!editingAddr && <button className="btn" onClick={() => setEditingAddr("new")}><Plus size={14} /> Add Address</button>}
              </div>

              {(editingAddr !== null) && (
                <form className="glass" onSubmit={saveAddress} style={{ padding: "1rem", marginBottom: "1rem" }}>
                  <h3 style={{ marginBottom: "0.8rem" }}>{editingAddr === "new" ? "New Address" : "Edit Address"}</h3>
                  <div className="checkout-form-grid">
                    <label>Label
                      <select value={addrForm.label} onChange={(e) => setAddrForm(f => ({ ...f, label: e.target.value }))}>
                        {["Home", "Work", "Other"].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </label>
                    <label>Full Name <input value={addrForm.fullName} onChange={(e) => setAddrForm(f => ({ ...f, fullName: e.target.value }))} required /></label>
                    <label>Phone <input value={addrForm.phone} onChange={(e) => setAddrForm(f => ({ ...f, phone: e.target.value }))} required /></label>
                    <label className="full-width">Address <input value={addrForm.address} onChange={(e) => setAddrForm(f => ({ ...f, address: e.target.value }))} required /></label>
                    <label className="full-width">Address 2 (optional) <input value={addrForm.address2} onChange={(e) => setAddrForm(f => ({ ...f, address2: e.target.value }))} /></label>
                    <label>City <input value={addrForm.city} onChange={(e) => setAddrForm(f => ({ ...f, city: e.target.value }))} required /></label>
                    <label>State <input value={addrForm.state} onChange={(e) => setAddrForm(f => ({ ...f, state: e.target.value }))} required /></label>
                    <label>ZIP <input value={addrForm.zip} onChange={(e) => setAddrForm(f => ({ ...f, zip: e.target.value }))} required /></label>
                    <label>Country <input value={addrForm.country} onChange={(e) => setAddrForm(f => ({ ...f, country: e.target.value }))} /></label>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))} />
                    Set as default
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
                    <button className="btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Address"}</button>
                    <button className="btn ghost" type="button" onClick={() => { setEditingAddr(null); setAddrForm({ label: "Home", fullName: "", phone: "", address: "", address2: "", city: "", state: "", zip: "", country: "US", isDefault: false }); }}>Cancel</button>
                  </div>
                </form>
              )}

              {addresses.length === 0 && !editingAddr && (
                <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>No addresses saved yet.</p>
              )}
              <div className="address-grid">
                {addresses.map((addr) => (
                  <div key={addr.id} className={`glass address-card ${addr.isDefault ? "address-default" : ""}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{addr.label}</strong>
                      {addr.isDefault && <span className="badge badge-sale" style={{ fontSize: "10px" }}>Default</span>}
                    </div>
                    <p style={{ fontSize: "13px", margin: "0.4rem 0" }}>{addr.fullName}</p>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>{addr.address}{addr.address2 ? `, ${addr.address2}` : ""}</p>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>{addr.city}, {addr.state} {addr.zip}</p>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>{addr.phone}</p>
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                      <button className="btn ghost" onClick={() => startEditAddr(addr)} style={{ fontSize: "12px" }}><Edit2 size={12} /> Edit</button>
                      <button className="btn ghost" onClick={() => deleteAddress(addr.id)} style={{ fontSize: "12px", color: "var(--red)" }}><Trash2 size={12} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
