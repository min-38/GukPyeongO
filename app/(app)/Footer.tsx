import Link from "next/link";

// 공개 페이지(메인·결과) 하단 푸터. 운영자 문의처와 개인정보처리방침 링크.
// className으로 모바일 고정 CTA가 있는 메인에서 하단 여백을 보정한다.
export default function Footer({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-border px-6 py-8 text-center text-xs text-muted ${className}`}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <p className="font-display text-sm text-foreground">국평오</p>
        <nav className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="font-medium transition-colors hover:text-foreground"
          >
            개인정보처리방침
          </Link>
          <span className="text-border">·</span>
          <a
            href="mailto:contact@gukpyeongo.site"
            className="font-medium transition-colors hover:text-foreground"
          >
            문의 contact@gukpyeongo.site
          </a>
        </nav>
        <p className="text-muted/70">
          © 2026 국평오 · 회원가입 없이 즐기는 문해력 테스트
        </p>
      </div>
    </footer>
  );
}
