import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HikeIt — Komuniteti i Alpinizmit",
    short_name: "HikeIt",
    description:
      "Gjej shtigje, bashkohu me klube dhe rezervo udhëtime malore.",
    start_url: "/",
    display: "standalone",
    background_color: "#2D5F3F",
    theme_color: "#2D5F3F",
    orientation: "portrait",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    categories: ["lifestyle", "sports", "travel"],
    lang: "sq",
  };
}
