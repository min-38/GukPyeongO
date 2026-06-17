import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "국평오 테스트 — 검색 없이 10문제";
const description =
  "검색 없이 10문제. 당신의 문해력은 몇 등급?";

export const metadata: Metadata = {
  metadataBase: new URL("https://gukpyeongo.site"),
  title,
  description,
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
        {/* 한글 임팩트용 디스플레이 폰트. App Router 루트 레이아웃의 <head>는
            전 페이지에 적용되므로 no-page-custom-font 경고는 해당 없음. */}
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
      </body>
    </html>
  );
}
