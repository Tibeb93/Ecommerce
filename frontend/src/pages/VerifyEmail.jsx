import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import { getErrorMessage } from "../utils/errors";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!token) {
      setError("Invalid or missing verification token.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/verify-email", { token });
      setSuccess("Email verified successfully!");
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed. Token may have expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <div className="glass auth-form">
        <h1>Verify email</h1>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        {!success && (
          <button className="btn" onClick={verify} disabled={loading || !token}>
            {loading ? "Verifying..." : "Verify my email"}
          </button>
        )}
        <p>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
