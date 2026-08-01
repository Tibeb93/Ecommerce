import { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldAlert } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";

const ROLE_COLORS = {
  admin: "var(--accent)",
  user: "var(--primary)",
};

const ROLE_ICONS = {
  admin: ShieldAlert,
  user: Shield,
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (search) params.q = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get("/admin/users", { params });
      setUsers(data.users || data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div>
      {error && <p className="form-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}

      <div className="admin-toolbar">
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
          <div className="admin-search" style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.35rem 0.6rem" }}>
            <Search size={16} className="muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", color: "var(--text)", flex: 1, outline: "none", fontSize: "13px" }}
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ fontSize: "13px" }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button className="btn" type="submit" style={{ fontSize: "13px" }}>Search</button>
        </form>
      </div>

      <div className="glass admin-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p className="muted" style={{ padding: "2rem", textAlign: "center" }}>No users found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const uid = u.id || u._id;
                  const RoleIcon = ROLE_ICONS[u.role] || Shield;
                  return (
                    <tr key={uid} className="admin-table-row">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: ROLE_COLORS[u.role] || "var(--muted)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "13px",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>{u.name}</span>
                        </div>
                      </td>
                      <td className="muted" style={{ fontSize: "13px" }}>{u.email}</td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: ROLE_COLORS[u.role] || "var(--muted)",
                            color: "#fff",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <RoleIcon size={11} />
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.isVerified || u.emailVerified ? (
                          <span style={{ color: "var(--green)", fontSize: "12px", fontWeight: 600 }}>Verified</span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: "12px" }}>Pending</span>
                        )}
                      </td>
                      <td className="muted" style={{ fontSize: "12px" }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
