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
      // 실제 입구는 회차 페이지다(#100). v1 /test 는 미들웨어가 프로덕션에서 404로 막으므로
      // 여기 적어 두면 없는 주소를 색인하라고 알리는 꼴이 된다.
      url: `${BASE_URL}/today`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      // 지난 회차 기록(#114). 매주 한 줄씩 늘어나는 페이지라 검색으로도 들어온다.
      url: `${BASE_URL}/rounds`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
