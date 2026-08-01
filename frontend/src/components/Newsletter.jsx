import { useState } from "react";
import { Mail, Send } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="section fade-in-section">
      <div className="container">
        <div className="newsletter-section glass">
          <div className="newsletter-content">
            <Mail size={36} className="newsletter-icon" />
            <h2>Join Our Newsletter</h2>
            <p className="muted">Subscribe for exclusive deals, new arrivals, and insider updates.</p>
            {subscribed ? (
              <p className="form-success">Thanks for subscribing! Check your inbox.</p>
            ) : (
              <form className="newsletter-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn"><Send size={16} /> Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
