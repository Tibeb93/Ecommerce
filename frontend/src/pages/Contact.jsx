import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, User, MessageSquare, CheckCircle } from "lucide-react";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import SEO from "../components/SEO";

const Contact = () => {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent successfully!");
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send message"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <SEO title="Contact Us" description="Get in touch with NovaShop support team" />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Contact Us</h1>
        <p className="muted" style={{ textAlign: "center", marginBottom: "2rem" }}>Have a question or need help? We'd love to hear from you.</p>

        {sent ? (
          <motion.div className="glass" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "3rem", textAlign: "center" }}>
            <CheckCircle size={48} style={{ color: "var(--green)", marginBottom: "1rem" }} />
            <h2>Message Sent!</h2>
            <p className="muted" style={{ margin: "0.5rem 0 1.5rem" }}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
            <button className="btn" onClick={() => setSent(false)}>Send Another Message</button>
          </motion.div>
        ) : (
          <motion.form className="glass" onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "1.5rem" }}>
            <div className="checkout-form-grid">
              <label><User size={14} /> Name *
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required />
              </label>
              <label><Mail size={14} /> Email *
                <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
              </label>
              <label className="full-width"><MessageSquare size={14} /> Subject
                <input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" />
              </label>
              <label className="full-width"><MessageSquare size={14} /> Message *
                <textarea
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us more..."
                  rows={5}
                  required
                  style={{ resize: "vertical" }}
                />
              </label>
            </div>
            <button className="btn btn-primary-lg" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
              <Send size={16} /> {loading ? "Sending..." : "Send Message"}
            </button>
          </motion.form>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "2rem" }}>
          {[
            { icon: Mail, title: "Email", detail: "support@novashop.com" },
            { icon: MessageSquare, title: "Response", detail: "Within 24 hours" },
            { icon: User, title: "Support", detail: "7 days a week" },
          ].map(({ icon: Icon, title, detail }) => (
            <div key={title} className="glass" style={{ padding: "1rem", textAlign: "center" }}>
              <Icon size={20} style={{ color: "var(--primary)", marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: "13px" }}>{title}</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px" }}>{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contact;
