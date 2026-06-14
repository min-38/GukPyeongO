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
  "검색 없이 10문제. 당신의 문해력은 몇 등급? 친구와 점수로 승부 보세요.";

export const metadata: Metadata = {
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
      <body className="flex min-h-full justify-center sm:p-6">
        <div className="flex min-h-[100dvh] w-full max-w-[var(--app-max-width)] flex-col bg-surface shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)] sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-border">
          {children}
        </div>
      </body>
    </html>
  );
}
