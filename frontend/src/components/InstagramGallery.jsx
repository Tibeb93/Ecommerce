import { Instagram } from "lucide-react";

const galleryImages = [
  "https://placehold.co/300x300/1a1f35/6c7dff?text=Style+1",
  "https://placehold.co/300x300/1a1f35/85f7be?text=Style+2",
  "https://placehold.co/300x300/1a1f35/ff7f8f?text=Style+3",
  "https://placehold.co/300x300/1a1f35/facc15?text=Style+4",
  "https://placehold.co/300x300/1a1f35/6c7dff?text=Style+5",
  "https://placehold.co/300x300/1a1f35/85f7be?text=Style+6",
  "https://placehold.co/300x300/1a1f35/ff7f8f?text=Style+7",
  "https://placehold.co/300x300/1a1f35/facc15?text=Style+8",
];

const InstagramGallery = () => (
  <section className="section fade-in-section">
    <div className="container">
      <div className="section-head">
        <h2>@NovaShop</h2>
        <p className="muted">Follow us on Instagram for style inspiration</p>
      </div>
      <div className="instagram-grid">
        {galleryImages.map((src, i) => (
          <a key={i} href="https://instagram.com" target="_blank" rel="noreferrer" className="instagram-item">
            <img src={src} alt={`Gallery ${i + 1}`} />
            <div className="instagram-overlay">
              <Instagram size={24} />
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default InstagramGallery;
