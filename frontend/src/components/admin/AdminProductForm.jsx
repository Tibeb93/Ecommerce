import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp, Upload } from "lucide-react";
import api from "../../api";
import { getErrorMessage } from "../../utils/errors";
import { isValidImageUrl } from "../../utils/validators";

const STATUS_OPTIONS = ["draft", "published", "out_of_stock", "archived", "coming_soon", "discontinued"];

const emptyProduct = {
  title: "",
  description: "",
  image: "",
  images: [],
  price: "",
  costPrice: "",
  salePrice: "",
  saleEnds: "",
  stock: "",
  lowStockAlert: "",
  sku: "",
  barcode: "",
  categoryId: "",
  brand: "",
  tags: [],
  status: "draft",
  slug: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  weight: "",
  dimensions: { length: "", width: "", height: "" },
  variants: [],
};

const AdminProductForm = ({ product, categories, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyProduct);
  const [tagInput, setTagInput] = useState("");
  const [seoKeywordsInput, setSeoKeywordsInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgPreview, setImgPreview] = useState("");
  const [expandedVariants, setExpandedVariants] = useState(new Set());
  const fileInputRef = useRef(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const isEdit = !!product;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB"); return; }
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "products");
      const { data } = await api.post("/upload/single", formData, { headers: { "Content-Type": "multipart/form-data" } });
      set("image", data.url);
      setImgPreview(data.url);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
    } finally { setUploadingImg(false); }
  };

  useEffect(() => {
    if (product) {
      setForm({
        ...emptyProduct,
        ...product,
        dimensions: product.dimensions || { length: "", width: "", height: "" },
        variants: product.variants || [],
        images: product.images || [],
        tags: product.tags || [],
        saleEnds: product.saleEnds ? new Date(product.saleEnds).toISOString().slice(0, 16) : "",
      });
      setSeoKeywordsInput((product.seoKeywords || []).join(", "));
      if (isValidImageUrl(product.image)) setImgPreview(product.image);
    }
  }, [product]);

  useEffect(() => {
    if (isValidImageUrl(form.image)) {
      setImgPreview(form.image);
    } else {
      setImgPreview("");
    }
  }, [form.image]);

  const set = (field, value) => setForm((s) => ({ ...s, [field]: value }));

  const setDimension = (field, value) =>
    setForm((s) => ({ ...s, dimensions: { ...s.dimensions, [field]: value } }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => set("tags", form.tags.filter((t) => t !== tag));

  const addSeoKeywords = () => {
    const words = seoKeywordsInput
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w && !form.seoKeywords.includes(w));
    if (words.length) set("seoKeywords", [...form.seoKeywords, ...words]);
    setSeoKeywordsInput("");
  };

  const removeKeyword = (kw) => set("seoKeywords", form.seoKeywords.filter((k) => k !== kw));

  const addVariant = () => {
    const variants = [...form.variants, { name: "", options: [{ label: "", sku: "", price: "", stock: "", image: "" }] }];
    set("variants", variants);
    setExpandedVariants(new Set([variants.length - 1]));
  };

  const removeVariant = (vi) => {
    const variants = form.variants.filter((_, i) => i !== vi);
    set("variants", variants);
  };

  const setVariantName = (vi, name) => {
    const variants = [...form.variants];
    variants[vi] = { ...variants[vi], name };
    set("variants", variants);
  };

  const addVariantOption = (vi) => {
    const variants = [...form.variants];
    variants[vi] = {
      ...variants[vi],
      options: [...variants[vi].options, { label: "", sku: "", price: "", stock: "", image: "" }],
    };
    set("variants", variants);
  };

  const removeVariantOption = (vi, oi) => {
    const variants = [...form.variants];
    variants[vi] = {
      ...variants[vi],
      options: variants[vi].options.filter((_, i) => i !== oi),
    };
    set("variants", variants);
  };

  const setVariantOption = (vi, oi, field, value) => {
    const variants = [...form.variants];
    const options = [...variants[vi].options];
    options[oi] = { ...options[oi], [field]: value };
    variants[vi] = { ...variants[vi], options };
    set("variants", variants);
  };

  const toggleVariantExpand = (vi) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(vi)) next.delete(vi);
      else next.add(vi);
      return next;
    });
  };

  const validate = () => {
    if (!form.title.trim() || form.title.trim().length < 3) return "Title must be at least 3 characters.";
    if (!form.description.trim() || form.description.trim().length < 10) return "Description must be at least 10 characters.";
    if (!isValidImageUrl(form.image)) return "Please enter a valid image URL.";
    if (!form.price || Number(form.price) <= 0) return "Price must be greater than 0.";
    if (form.costPrice && Number(form.costPrice) < 0) return "Cost price cannot be negative.";
    if (form.salePrice && Number(form.salePrice) < 0) return "Sale price cannot be negative.";
    if (form.salePrice && Number(form.salePrice) >= Number(form.price)) return "Sale price must be less than regular price.";
    if (form.saleEnds && !form.salePrice) return "Sale price is required to set a sale end date.";
    if (form.stock === "" || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) return "Stock must be a non-negative integer.";
    if (form.lowStockAlert && (Number(form.lowStockAlert) < 0 || !Number.isInteger(Number(form.lowStockAlert)))) {
      return "Low stock alert must be a non-negative integer.";
    }
    for (const v of form.variants) {
      if (!v.name.trim()) return "Variant name is required.";
      for (const opt of v.options) {
        if (!opt.label.trim()) return "Variant option label is required.";
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) return setError(err);

    const payload = {
      ...form,
      price: Number(form.price),
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      saleEnds: form.saleEnds || undefined,
      stock: Number(form.stock),
      lowStockAlert: form.lowStockAlert ? Number(form.lowStockAlert) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      dimensions: {
        length: form.dimensions.length ? Number(form.dimensions.length) : undefined,
        width: form.dimensions.width ? Number(form.dimensions.width) : undefined,
        height: form.dimensions.height ? Number(form.dimensions.height) : undefined,
      },
      seoKeywords: form.seoKeywords.length ? form.seoKeywords : undefined,
      tags: form.tags.length ? form.tags : undefined,
      variants: form.variants.length ? form.variants : undefined,
    };

    try {
      setLoading(true);
      if (isEdit) {
        await api.put(`/admin/products/${product.id || product._id}`, payload);
      } else {
        await api.post("/admin/products", payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to ${isEdit ? "update" : "create"} product.`));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", marginBottom: 0 };
  const labelStyle = { fontSize: "12px", fontWeight: 600, marginBottom: "0.3rem", display: "block", color: "var(--muted)" };

  return (
    <div className="glass admin-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <h3 style={{ margin: 0 }}>{isEdit ? "Edit Product" : "New Product"}</h3>
        <button className="btn ghost" onClick={onClose} style={{ padding: "0.3rem", width: "32px", height: "32px", justifyContent: "center" }}>
          <X size={18} />
        </button>
      </div>

      {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="admin-form-section">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "14px" }}>Basic Info</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} placeholder="Product title" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Image URL *</label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="https://..." value={form.image} onChange={(e) => set("image", e.target.value)} />
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleImageUpload} />
                <button type="button" className="btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg} style={{ whiteSpace: "nowrap" }}>
                  <Upload size={14} /> {uploadingImg ? "Uploading..." : "Upload"}
                </button>
              </div>
              {imgPreview && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img src={imgPreview} alt="Preview" style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border)" }}
                    onError={() => setImgPreview("")} />
                </div>
              )}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description *</label>
              <textarea style={{ ...inputStyle, minHeight: "80px" }} placeholder="Product description" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="admin-form-section">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "14px" }}>Pricing</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.8rem" }}>
            <div>
              <label style={labelStyle}>Price *</label>
              <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Cost Price</label>
              <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Sale Price</label>
              <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Sale Ends</label>
              <input style={inputStyle} type="datetime-local" value={form.saleEnds} onChange={(e) => set("saleEnds", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="admin-form-section">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "14px" }}>Inventory</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.8rem" }}>
            <div>
              <label style={labelStyle}>Stock *</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Low Stock Alert</label>
              <input style={inputStyle} type="number" min="0" placeholder="5" value={form.lowStockAlert} onChange={(e) => set("lowStockAlert", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>SKU</label>
              <input style={inputStyle} placeholder="SKU-001" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Barcode</label>
              <input style={inputStyle} placeholder="123456789" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="admin-form-section">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "14px" }}>Organization</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "0.8rem", alignItems: "start" }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Brand</label>
              <input style={inputStyle} placeholder="Brand name" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Tags</label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Add tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag(); }
                  }}
                />
                <button type="button" className="btn ghost" style={{ padding: "0.3rem 0.6rem", fontSize: "12px" }} onClick={addTag}>Add</button>
              </div>
              {form.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" }}>
                  {form.tags.map((tag) => (
                    <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "rgba(108,125,255,0.15)", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "11px" }}>
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1 }}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: "0.8rem" }}>
            <label style={labelStyle}>Status</label>
            <select style={{ ...inputStyle, width: "200px" }} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SEO */}
        <div className="admin-form-section">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "14px" }}>SEO</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <div>
              <label style={labelStyle}>SEO Title</label>
              <input style={inputStyle} placeholder="SEO title" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input style={inputStyle} placeholder="product-slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>SEO Description</label>
              <textarea style={{ ...inputStyle, minHeight: "60px" }} placeholder="SEO description" value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>SEO Keywords</label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="keyword1, keyword2"
                  value={seoKeywordsInput}
                  onChange={(e) => setSeoKeywordsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addSeoKeywords(); }
                  }}
                />
                <button type="button" className="btn ghost" style={{ padding: "0.3rem 0.6rem", fontSize: "12px" }} onClick={addSeoKeywords}>Add</button>
              </div>
              {form.seoKeywords.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" }}>
                  {form.seoKeywords.map((kw) => (
                    <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "rgba(236,72,153,0.15)", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "11px" }}>
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1 }}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="admin-form-section">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "14px" }}>Shipping</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.8rem" }}>
            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Length (cm)</label>
              <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0" value={form.dimensions.length} onChange={(e) => setDimension("length", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Width (cm)</label>
              <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0" value={form.dimensions.width} onChange={(e) => setDimension("width", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Height (cm)</label>
              <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0" value={form.dimensions.height} onChange={(e) => setDimension("height", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="admin-form-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <h4 style={{ margin: 0, fontSize: "14px" }}>Variants</h4>
            <button type="button" className="btn ghost" style={{ fontSize: "12px", padding: "0.3rem 0.6rem" }} onClick={addVariant}>
              <Plus size={12} /> Add Variant
            </button>
          </div>

          {form.variants.length === 0 && <p className="muted" style={{ fontSize: "13px" }}>No variants added.</p>}

          {form.variants.map((variant, vi) => (
            <div key={vi} className="admin-variant-row" style={{ marginBottom: "0.8rem", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.03)", cursor: "pointer" }}
                onClick={() => toggleVariantExpand(vi)}
              >
                <input
                  style={{ flex: 1, border: "none", background: "transparent", color: "var(--text)", fontSize: "13px", fontWeight: 600, outline: "none" }}
                  placeholder="Variant name (e.g. Size, Color)"
                  value={variant.name}
                  onChange={(e) => setVariantName(vi, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button type="button" onClick={(e) => { e.stopPropagation(); removeVariant(vi); }} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: "0.2rem" }}>
                  <Trash2 size={14} />
                </button>
                {expandedVariants.has(vi) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>

              {expandedVariants.has(vi) && (
                <div style={{ padding: "0.8rem" }}>
                  {variant.options.map((opt, oi) => (
                    <div key={oi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "end" }}>
                      <div>
                        <label style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "0.2rem", display: "block" }}>Label *</label>
                        <input style={{ width: "100%", fontSize: "12px" }} placeholder="e.g. Large, Red" value={opt.label} onChange={(e) => setVariantOption(vi, oi, "label", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "0.2rem", display: "block" }}>SKU</label>
                        <input style={{ width: "100%", fontSize: "12px" }} placeholder="SKU" value={opt.sku} onChange={(e) => setVariantOption(vi, oi, "sku", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "0.2rem", display: "block" }}>Price</label>
                        <input style={{ width: "100%", fontSize: "12px" }} type="number" step="0.01" min="0" placeholder="0.00" value={opt.price} onChange={(e) => setVariantOption(vi, oi, "price", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "0.2rem", display: "block" }}>Stock</label>
                        <input style={{ width: "100%", fontSize: "12px" }} type="number" min="0" placeholder="0" value={opt.stock} onChange={(e) => setVariantOption(vi, oi, "stock", e.target.value)} />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariantOption(vi, oi)}
                        style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: "0.3rem", alignSelf: "end" }}
                        disabled={variant.options.length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn ghost" style={{ fontSize: "11px", padding: "0.25rem 0.5rem", marginTop: "0.3rem" }} onClick={() => addVariantOption(vi)}>
                    <Plus size={11} /> Add Option
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
