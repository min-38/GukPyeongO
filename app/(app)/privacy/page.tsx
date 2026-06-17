import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 국평오 테스트",
  description: "국평오 테스트가 수집하는 정보와 처리 방침 안내.",
};

// 실제 서비스가 수집·저장하는 항목에 맞춘 안내. 회원가입·로그인이 없으므로
// 이름·연락처 등 식별 정보는 수집하지 않는다.
export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-10 lg:items-center lg:py-16">
      <article className="w-full max-w-2xl">
        <h1 className="font-display text-3xl lg:text-4xl">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-muted">최종 업데이트: 2026년 6월</p>

        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-foreground">
          <section>
            <p>
              국평오 테스트(이하 &lsquo;서비스&rsquo;)는 회원가입과 로그인이 없는
              익명 서비스입니다. 이름·전화번호·이메일 등 개인을 식별하는 정보를
              수집하지 않습니다. 아래는 서비스 운영 과정에서 처리되는 정보의
              범위와 목적입니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">1. 수집하는 정보</h2>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <span className="font-bold">댓글 작성 시</span> — 닉네임(직접
                입력 또는 자동 생성)과 댓글 내용. 작성자 구분을 위해 접속 IP의
                앞 2자리만 마스킹하여 저장하며(예: 123.45.*.*), 전체 IP는
                저장하지 않습니다.
              </li>
              <li>
                <span className="font-bold">문제 오류 신고 시</span> — 신고 사유
                및 상세 내용.
              </li>
              <li>
                <span className="font-bold">테스트 진행 정보</span> — 응시 결과와
                튜토리얼 표시 여부는 브라우저 내 저장소(localStorage·
                sessionStorage)에만 보관되며 서버로 전송되지 않습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl">2. 이용 목적</h2>
            <p className="mt-3">
              댓글·통계 표시, 중복 및 악용 방지, 문제 품질 개선을 위해서만
              이용합니다. 그 외의 목적으로 사용하거나 제3자에게 판매·제공하지
              않습니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">3. 보관 및 파기</h2>
            <p className="mt-3">
              댓글과 신고 내용은 서비스 운영에 필요한 기간 동안 보관하며,
              운영자가 부적절하다고 판단하거나 삭제 요청을 받은 경우 지체 없이
              파기합니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">4. 광고 및 외부 서비스</h2>
            <p className="mt-3">
              서비스에 광고가 게재되는 경우, 광고 제공사(예: Google AdSense,
              Kakao AdFit)가 광고 식별을 위한 쿠키를 사용할 수 있습니다. 쿠키
              설정은 브라우저에서 거부하거나 삭제할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">5. 문의</h2>
            <p className="mt-3">
              개인정보 관련 문의는{" "}
              <a
                href="mailto:contact@gukpyeongo.site"
                className="font-bold text-brand hover:underline"
              >
                contact@gukpyeongo.site
              </a>
              로 보내주세요.
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-2xl border-2 border-border px-6 text-base font-bold transition-colors hover:bg-surface-muted"
        >
          ← 홈으로
        </Link>
      </article>
    </main>
  );
}
