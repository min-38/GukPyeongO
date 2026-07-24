"use client";

// 공지 읽기 유형 시작 화면.
export default function NoticeTutorial({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex w-full flex-col gap-5 lg:mx-auto lg:max-w-md">
      <header className="text-center">
        <p className="text-xs font-bold tracking-wide text-brand">공지사항</p>
        <h1 className="mt-1 text-2xl font-black">이 공고, 함정 보이세요?</h1>
        <p className="mt-2 text-sm text-muted">
          안내문에 슬쩍 숨은 조건과 함정을
          <br />
          놓치지 않고 읽어내면 됩니다.
        </p>
      </header>

      {/* 미니 데모 — 실제 문서 카드와 같은 모양 */}
      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <p className="text-xs font-medium text-brand">○○기관</p>
        <p className="mt-1 text-[15px] font-bold">참가비: 무료 (단, 교재비 별도)</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          “무료”만 읽으면 낚입니다. <b className="font-medium text-foreground">‘단, …’</b> 뒤가 진짜예요.
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">01</span>
          <span>
            공고를 <b className="font-medium text-foreground">한 번</b> 보여주고, 그 위에서 문제가 이어져요.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">02</span>
          <span>
            <b className="font-medium text-foreground">낚시 조항·조건·기한</b>을 정확히 읽었는지 묻습니다.
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
          공고 읽기
        </button>
        <p className="text-center text-xs text-muted">
          🔊 효과음이 재생됩니다 · 검색은 양심에 맡길게요
        </p>
      </div>
    </div>
  );
}
