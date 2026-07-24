"use client";

// 회사 메신저 모드 시작 화면.
// 규칙을 글로만 나열하지 않고 실제 풀이 화면과 같은 말풍선·선택지로 보여준다.
// 이 화면의 시작 버튼 클릭이 오디오 잠금 해제 지점이기도 하다(자동재생 정책).
export default function Tutorial({
  roomTitle,
  onStart,
}: {
  roomTitle: string;
  onStart: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-5 lg:mx-auto lg:max-w-md">
      <header className="text-center">
        <p className="text-xs font-bold tracking-wide text-brand">
          오전 9시 17분 · 출근 3분 전
        </p>
        <h1 className="mt-1 text-2xl font-black">{roomTitle}</h1>
        <p className="mt-2 text-sm text-muted">
          당신은 입사 3개월 차 <b className="font-bold text-foreground">김대리</b>.
          <br />
          부장님에게 메시지가 왔습니다.
        </p>
      </header>

      {/* 실제 풀이 화면과 같은 모양의 미니 데모 */}
      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <div className="flex items-end gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand">
            김
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">김부장</span>
            <p className="max-w-[15rem] rounded-2xl rounded-tl-sm bg-surface px-4 py-2.5 text-[15px]">
              금일 보고는 언제 진행할 건가?
            </p>
          </div>
        </div>

        <p className="mt-4 mb-2 text-center text-xs font-medium text-muted">
          ↓ 내가 보낼 답장을 고르면 됩니다
        </p>

        <div className="flex flex-col gap-2">
          <div className="rounded-2xl border-2 border-border px-4 py-3 text-[15px] text-muted opacity-60">
            네! 금요일까지 준비하겠습니다!
          </div>
          <div className="rounded-2xl border-2 border-brand px-4 py-3 text-[15px] font-medium text-brand">
            네, 오늘 5시에 보고드리겠습니다.
          </div>
        </div>
      </div>

      {/* 규칙 — 아이콘 없이 타이포로 */}
      <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">01</span>
          <span>
            고른 답장에 따라{" "}
            <b className="font-medium text-foreground">대화가 이어집니다.</b>{" "}
            틀려도 계속 진행돼요.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">02</span>
          <span>
            문항마다 <b className="font-medium text-foreground">제한시간</b>이
            있어요. 답이 없으면 오답 처리됩니다.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-brand">03</span>
          <span>
            어려운 문항일수록{" "}
            <b className="font-medium text-foreground">배점이 큽니다.</b> 쉬운
            것만 맞혀선 좋은 등급이 안 나와요.
          </span>
        </li>
      </ul>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onStart}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-brand-foreground active:scale-[0.99]"
        >
          진행하기
        </button>
        <p className="text-center text-xs text-muted">
          🔊 효과음이 재생됩니다 · 검색은 양심에 맡길게요
        </p>
      </div>
    </div>
  );
}
