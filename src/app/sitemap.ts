import type { MetadataRoute } from "next";

const BASE_URL = "https://hikeit.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/trails", "/clubs", "/trips", "/pricing", "/about"];
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
