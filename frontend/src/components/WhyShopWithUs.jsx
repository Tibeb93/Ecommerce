import { motion } from "framer-motion";
import { Headphones, RefreshCcw, ShieldCheck, Truck } from "lucide-react";

const features = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $50" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected transactions" },
  { icon: RefreshCcw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: Headphones, title: "24/7 Support", desc: "Dedicated customer care" },
];

const WhyShopWithUs = () => (
  <section className="section fade-in-section">
    <div className="container">
      <div className="trust-grid">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass trust-card"
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <f.icon size={28} className="trust-icon" />
            <h3>{f.title}</h3>
            <p className="muted">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyShopWithUs;
