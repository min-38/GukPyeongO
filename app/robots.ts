import type { MetadataRoute } from "next";

const BASE_URL = "https://gukpyeongo.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 관리자·API·일회성 결과 화면은 색인 제외
      disallow: ["/admin", "/api", "/result"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
