import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 한글 임팩트용 디스플레이 폰트.
// 구글에서 <link>로 받아오면 스타일시트가 렌더링을 막아 첫 화면이 그만큼 늦는다
// (측정값 750ms). next/font는 빌드 때 받아 우리 도메인에서 내보내므로 그 왕복이 사라진다.
const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  // 구글은 이 한글 폰트를 여러 조각으로 쪼개면서 전부 latin 으로 이름 붙였다.
  // unicode-range 를 보면 한글이 들어 있고, latin 하나로 전체가 받아진다.
  subsets: ["latin"],
  weight: "400",
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${blackHanSans.variable} h-full antialiased`}
    >
      {/* 카드 셸은 각 라우트 그룹 레이아웃에서 폭을 다르게 적용한다
          (공개 페이지: 폰 프레임 / 관리자: 넓은 레이아웃) */}
      <body className="flex min-h-full justify-center overflow-x-hidden sm:p-6">
        {children}
      </body>
    </html>
  );
}
