import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import "./index.css";

function applySiteUrlMeta() {
  const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl || typeof document === "undefined") return;

  const upsertLink = (rel, href) => {
    let element = document.querySelector(`link[rel="${rel}"]`);
    if (!element) {
      element = document.createElement("link");
      element.setAttribute("rel", rel);
      document.head.appendChild(element);
    }
    element.setAttribute("href", href);
  };

  const upsertMeta = (attribute, key, content) => {
    let element = document.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  upsertLink("canonical", siteUrl);
  upsertMeta("property", "og:url", siteUrl);
  upsertMeta("property", "og:image", `${siteUrl}/images/logo-webp.webp`);
  upsertMeta("name", "twitter:image", `${siteUrl}/images/logo-webp.webp`);
}

applySiteUrlMeta();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>
);
