import { Helmet } from "react-helmet-async";

const SEO = ({ title, description, url, image, type = "website" }) => {
  const siteName = "NovaShop";
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Premium E-Commerce`;
  const desc = description || "Discover amazing products at NovaShop. Quality electronics, fashion, and more with fast shipping.";
  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const ogImage = image || "https://placehold.co/1200x630/6c7dff/ffffff?text=NovaShop";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
