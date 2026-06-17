import type { MetadataRoute } from "next";

// 색인 대상 공개 페이지. result는 sessionStorage 기반 일회성 화면이라 제외한다.
const BASE_URL = "https://www.gukpyeongo.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/test`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
