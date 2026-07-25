"use client";

import TutorialShell from "./TutorialShell";

// 회사 메신저 모드 시작 화면.
// 규칙을 글로만 나열하지 않고 실제 풀이 화면과 같은 말풍선·선택지로 보여준다.
export default function Tutorial({
  roomTitle,
  onStart,
}: {
  roomTitle: string;
  onStart: () => void;
}) {
  return (
    <TutorialShell
      label="오전 9시 17분 · 출근 3분 전"
      title={roomTitle}
      subtitle={
        <>
          당신은 입사 3개월 차 <b className="font-bold text-foreground">김대리</b>.
          <br />
          부장님에게 메시지가 왔습니다.
        </>
      }
      demo={
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
      }
      steps={[
        <>
          고른 답장에 따라{" "}
          <b className="font-medium text-foreground">대화가 이어집니다.</b> 틀려도 계속 진행돼요.
        </>,
        <>
          문항마다 <b className="font-medium text-foreground">제한시간</b>이 있어요. 답이 없으면 오답 처리됩니다.
        </>,
        <>
          어려운 문항일수록{" "}
          <b className="font-medium text-foreground">배점이 큽니다.</b> 쉬운 것만 맞혀선 좋은 등급이 안 나와요.
        </>,
      ]}
      startLabel="진행하기"
      onStart={onStart}
    />
  );
}
