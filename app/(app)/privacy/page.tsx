import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "국평오 테스트가 수집하는 정보와 처리 방침 안내.",
};

// 실제 서비스가 수집·저장하는 항목에 맞춘 안내.
// 회원가입·로그인은 없지만 회차 응시 기록은 익명 식별자와 함께 서버에 남는다(#100).
// 화면에 적힌 것과 실제 저장하는 것이 어긋나면 안 되므로, 표가 늘거나 바뀌면 여기도 같이 고친다.
export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-10 lg:items-center lg:py-16">
      <article className="w-full max-w-2xl">
        <h1 className="font-display text-3xl lg:text-4xl">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-muted">최종 업데이트: 2026년 7월</p>

        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-foreground">
          <section>
            <p>
              국평오 테스트(이하 &lsquo;서비스&rsquo;)는 회원가입과 로그인이 없는
              익명 서비스입니다. 이름·전화번호를 묻지 않으며, 이메일은 문의하실
              때 답장받을 곳으로 직접 적어 넣으신 경우에만 보관합니다. 아래는
              서비스 운영 과정에서 처리되는 정보의 범위와 목적입니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">1. 수집하는 정보</h2>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <span className="font-bold">방문자 식별값</span> — 같은 사람이 한
                회차를 두 번 응시하지 않도록, 브라우저에 무작위로 만든 값 하나를
                쿠키(gukpyeongo_vid)로 저장합니다. 이름·계정과 연결되지 않는
                값이며, 브라우저에서 쿠키를 지우면 사라집니다.
              </li>
              <li>
                <span className="font-bold">회차 응시 기록</span> — 위 식별값과
                함께 응시 시각, 문항별로 고른 답, 점수와 등급이 서버에
                저장됩니다. 채점과 등급 분포 표시에 쓰입니다.
              </li>
              <li>
                <span className="font-bold">댓글 작성 시</span> — 닉네임(직접
                입력 또는 자동 생성)과 댓글 내용. 작성자 구분을 위해 접속 IP의 앞
                2자리만 마스킹하여 저장하며(예: 123.45.*.*), 전체 IP는 저장하지
                않습니다.
              </li>
              <li>
                <span className="font-bold">문항 항의·별점</span> — 항의 사유와
                상세 내용, 별점과 함께 남기신 한마디, 그리고 위 방문자 식별값.
              </li>
              <li>
                <span className="font-bold">문의 시</span> — 문의 종류와 내용,
                작성하신 화면의 주소, 마스킹된 IP. 답장받을 곳(이메일 등)은 선택
                항목이며 적어 넣으신 경우에만 보관합니다.
              </li>
              <li>
                <span className="font-bold">브라우저에만 남는 정보</span> — 직전
                응시 결과와 튜토리얼 표시 여부는 브라우저 내
                저장소(localStorage·sessionStorage)에 보관되며, 이 값 자체는
                서버로 전송되지 않습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl">2. 이용 목적</h2>
            <p className="mt-3">
              채점과 등급 분포 표시, 댓글·통계 표시, 중복 응시 및 악용 방지, 문제
              품질 개선, 문의에 대한 답변을 위해서만 이용합니다. 그 외의 목적으로
              사용하거나 제3자에게 판매·제공하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">3. 보관 및 파기</h2>
            <p className="mt-3">
              방문자 식별 쿠키는 발급일로부터 1년간 유지되며, 브라우저 설정에서
              언제든 삭제하실 수 있습니다. 응시 기록·댓글·항의·문의는 서비스
              운영에 필요한 기간 동안 보관하며, 운영자가 부적절하다고 판단하거나
              삭제 요청을 받은 경우 지체 없이 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">4. 광고 및 외부 서비스</h2>
            <p className="mt-3">
              서비스에는 카카오 애드핏(Kakao AdFit) 광고가 게재되며, 광고
              제공사가 광고 식별을 위한 쿠키를 사용할 수 있습니다. 쿠키 설정은
              브라우저에서 거부하거나 삭제하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl">5. 문의</h2>
            <p className="mt-3">
              개인정보 관련 문의를 포함한 모든 문의는 화면 아래 &lsquo;문의
              하기&rsquo;로 보내주세요. 메일이 편하시면{" "}
              <a
                href="mailto:contact@gukpyeongo.site"
                className="font-bold text-brand hover:underline"
              >
                contact@gukpyeongo.site
              </a>
              로 보내주셔도 됩니다.
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
