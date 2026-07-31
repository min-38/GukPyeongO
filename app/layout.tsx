import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// 애드센스 게시자 ID. 소유 확인용 스크립트를 심어야 심사가 시작된다
// (등록만 해두면 "검토 필요"에서 멈춰 있다).
// 승인 전에는 광고가 뜨지 않으므로 지금 넣어둬도 화면은 그대로다.
const ADSENSE_CLIENT = "ca-pub-3592494210740135";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "국평오 테스트 — 이 주의 문해력 문제";
const description =
  "일주일마다 바뀌는 실생활 문제. 당신의 문해력은 몇 등급?";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gukpyeongo.site"),
  // 페이지마다 제목을 붙일 수 있게 틀을 둔다. 제목이 없는 페이지는 default 를 쓴다.
  title: { default: title, template: "%s — 국평오 테스트" },
  description,
  // www 와 비-www 가 따로 색인돼 점수가 갈리지 않게 정본 주소를 밝힌다.
  alternates: { canonical: "/" },
  // 네이버 서치어드바이저 소유확인.
  // 국내 검색은 네이버 몫이 절반이라 구글만 등록하면 그만큼을 통째로 놓친다.
  // 이 값은 페이지 소스에 그대로 나가는 공개 문자열이라 환경변수로 감출 이유가 없다 —
  // 코드에 두면 배포 설정을 빠뜨려 확인이 풀릴 일도 없다.
  verification: {
    other: {
      "naver-site-verification": "8f0926d9d4613448b2efccf9c827ebe031ab98c0",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* 한글 임팩트용 디스플레이 폰트.
            next/font/google 로 self-host 하면 렌더링 차단이 사라지지만(측정값 750ms),
            이 폰트는 구글이 서브셋 99개로 쪼개 놓아 Vercel 의 Turbopack 빌드가 깨진다
            ("Can't resolve @vercel/turbopack-next/internal/font/google/font").
            로컬에서는 캐시를 지워도 통과해 재현이 안 되므로, 검증된 <link> 방식으로 둔다.
            성능이 아쉬우면 woff2 를 저장소에 넣어 next/font/local 로 가는 길이 남아 있다. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* 카드 셸은 각 라우트 그룹 레이아웃에서 폭을 다르게 적용한다
          (공개 페이지: 폰 프레임 / 관리자: 넓은 레이아웃) */}
      <body className="flex min-h-full justify-center overflow-x-hidden sm:p-6">
        {children}
        {/* 렌더링을 막지 않도록 화면이 그려진 뒤에 불러온다 — 소유 확인에는 지장이 없다. */}
        <Script
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
