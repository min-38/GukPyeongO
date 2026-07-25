"use client";

import TutorialShell from "../play/TutorialShell";

// 서사 읽기 유형 시작 화면.
export default function StoryTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      label="이야기"
      title="이 사람 말, 믿어도 되나요?"
      subtitle={
        <>
          말하는 사람이 하는 말과
          <br />
          장면이 보여주는 사실이 어긋납니다.
        </>
      }
      demo={
        <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <p className="text-xs font-medium text-brand">화자의 말</p>
          <p className="mt-1 text-[15px] font-bold">
            “아버지는 내가 오는 걸 반가워하지 않는다”
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            그런데 방은{" "}
            <b className="font-medium text-foreground">아침부터 데워져</b>{" "}
            있습니다. 화자 말고 장면을 믿으세요.
          </p>
        </div>
      }
      steps={[
        <>
          먼저 <b className="font-medium text-foreground">읽는 시간</b>이
          주어집니다. 이때는 시간이 깎이지 않아요. 다 읽었으면 버튼을 눌러 바로
          넘어가세요.
        </>,
        <>
          정답은 전부{" "}
          <b className="font-medium text-foreground">본문에 적힌 사실</b>로
          정해집니다. 심정이나 분위기를 짐작할 필요는 없어요.
        </>,
        <>
          문제가 시작돼도 이야기는 위에 그대로 남아요. 헷갈리면 다시 올려다보면
          됩니다.
        </>,
      ]}
      startLabel="이야기 읽기"
      onStart={onStart}
    />
  );
}
