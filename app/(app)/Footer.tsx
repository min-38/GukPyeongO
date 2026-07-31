import Link from "next/link";

import InquiryDialog from "./InquiryDialog";

// 공개 페이지(메인·결과) 하단 푸터. 문의·후원·개인정보처리방침 링크.
// className으로 모바일 고정 CTA가 있는 메인에서 하단 여백을 보정한다.
export default function Footer({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-border px-6 py-8 text-center text-xs text-muted ${className}`}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <p className="font-display text-sm text-foreground">국평오</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href="/patch"
            className="font-medium transition-colors hover:text-foreground"
          >
            패치노트
          </Link>
          <span className="text-border">·</span>
          <Link
            href="/privacy"
            className="font-medium transition-colors hover:text-foreground"
          >
            개인정보처리방침
          </Link>
          <span className="text-border">·</span>
          {/* 메일 주소 대신 어드민 문의함으로 바로 받는다. */}
          <InquiryDialog />
          <span className="text-border">·</span>
          <a
            href="https://ko-fi.com/minbape"
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium transition-colors hover:text-foreground"
          >
            후원하기
          </a>
        </nav>
        <p className="text-muted">
          © 2026 국평오 · 국민 문해력 평균을 오르게
        </p>
      </div>
    </footer>
  );
}
