import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { getErrorMessage } from "../utils/errors";
import { isValidEmail } from "../utils/validators";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSuccess(data.message);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <form className="glass auth-form" onSubmit={onSubmit}>
        <h1>Forgot password</h1>
        <p className="muted">Enter your email and we&apos;ll send you a reset link.</p>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <p>
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
