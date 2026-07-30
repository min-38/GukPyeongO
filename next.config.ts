import type { NextConfig } from "next";

// 어디에도 보안 헤더가 없어 클릭재킹·MIME 스니핑이 무방비였다.
//
// script-src 는 넣지 않는다. Next 가 하이드레이션용 인라인 <script> 를 심어서
// nonce 를 붙이지 않으면 앱이 통째로 멈춘다 — nonce 는 미들웨어에서 요청마다
// 만들어 내려보내야 하고, 그건 출시 직전에 건드릴 크기가 아니다.
// 지문 HTML 로 들어오는 스크립트는 app/lib/sanitize-html.ts 가 그리기 전에 거른다.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'", // 다른 사이트가 iframe 으로 감싸 클릭을 가로채지 못하게
      "object-src 'none'", // <object>/<embed> 로 플러그인을 띄우는 길을 닫는다
      "base-uri 'self'", // <base> 를 심어 상대경로 요청을 남의 서버로 돌리지 못하게
    ].join("; "),
  },
  // 응답 본문을 브라우저가 제멋대로 다른 타입으로 읽지 않게 한다.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // frame-ancestors 를 못 읽는 옛 브라우저용 같은 뜻의 헤더.
  { key: "X-Frame-Options", value: "DENY" },
  // 바깥으로 나갈 때 경로·쿼리는 빼고 출처만 보낸다.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 쓰지 않는 장치 권한은 아예 닫아 둔다.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
