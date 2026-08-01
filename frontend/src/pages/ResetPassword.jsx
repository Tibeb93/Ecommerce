import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import { getErrorMessage } from "../utils/errors";
import { isStrongPassword } from "../utils/validators";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must be 8+ chars and include upper, lower, and number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/reset-password", { token, password });
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err, "Reset failed. Token may have expired."));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container section">
        <div className="glass auth-form">
          <h1>Invalid link</h1>
          <p className="muted">This password reset link is invalid or missing.</p>
          <Link to="/forgot-password" className="btn">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <form className="glass auth-form" onSubmit={onSubmit}>
        <h1>Reset password</h1>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <input
          placeholder="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          placeholder="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <small className="muted">Use 8+ chars, uppercase, lowercase, and number.</small>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </button>
        <p>
          <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;
