"use client";

// 커뮤니티 유형 시작 화면. 회사 메신저 튜토리얼과 같은 결이되 소재만 다르다.
export default function CommunityTutorial({
  boardName,
  onStart,
}: {
  boardName: string;
  onStart: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-5 lg:mx-auto lg:max-w-md">
      <header className="text-center">
        <p className="text-xs font-bold tracking-wide text-brand">
          {boardName} · 실시간 인기글
        </p>
        <h1 className="mt-1 text-2xl font-black">이 글, 읽을 수 있어?</h1>
        <p className="mt-2 text-sm text-muted">
          두서없는 게시물과 댓글 사이에서
          <br />
          진짜 요지를 짚어내면 됩니다.
        </p>
      </header>

      {/* 미니 데모 — 실제 피드와 같은 모양 */}
      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <p className="text-xs text-muted">익명</p>
        <p className="mt-1 text-[15px] font-bold">회사 단톡 레전드ㅋㅋ …</p>
        <div className="mt-3 flex gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">
            ㅇ
          </div>
          <div>
            <p className="text-xs text-muted">배고픈너구리</p>
            <p className="text-[15px]">근데 그 회사 어디임? 나도 이직하려는데</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-medium text-muted">
          ↑ 이런 “딴소리 댓글”도 골라내야 해요
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">01</span>
          <span>
            원글과 댓글을 <b className="font-medium text-foreground">읽고</b> 문제에 답해요. 스크롤해서 다 봐도 됩니다.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">02</span>
          <span>
            요지·반어·<b className="font-medium text-foreground">논점 이탈</b>·맞춤법을 가려내는 문제가 나와요.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">03</span>
          <span>
            문제가 뜨면 <b className="font-medium text-foreground">제한시간</b>이 시작돼요. 틀려도 계속 진행됩니다.
          </span>
        </li>
      </ul>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onStart}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-brand-foreground active:scale-[0.99]"
        >
          글 보러가기
        </button>
        <p className="text-center text-xs text-muted">
          🔊 효과음이 재생됩니다 · 검색은 양심에 맡길게요
        </p>
      </div>
    </div>
  );
}
