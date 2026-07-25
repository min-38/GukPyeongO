"use client";

import TutorialShell from "../play/TutorialShell";

// 신문 읽기 유형 시작 화면.
export default function NewsTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      label="국평오일보"
      title="제목만 믿으면, 낚입니다"
      subtitle={
        <>
          자극적인 제목과 실제 내용은 다릅니다.
          <br />
          기사에서 사실과 추측을 갈라내세요.
        </>
      }
      demo={
        <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <p className="text-xs font-medium text-brand">○○일보</p>
          <p className="mt-1 text-[15px] font-bold">“청년 절반이 떠난다”</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            제목은 “절반”. 본문은{" "}
            <b className="font-medium text-foreground">이직 ‘의향’ 절반, 실제 계획 8%</b>. 숫자를 직접 읽으세요.
          </p>
        </div>
      }
      steps={[
        <>
          기사를 <b className="font-medium text-foreground">한 번</b> 보여주고, 그 위에서 문제가 이어져요.
        </>,
        <>
          <b className="font-medium text-foreground">제목낚시·사실/추측·추론</b>을 갈라내는 문제입니다.
        </>,
        <>
          문제가 뜨면 <b className="font-medium text-foreground">제한시간</b>이 시작돼요. 틀려도 계속 진행됩니다.
        </>,
      ]}
      startLabel="기사 읽기"
      onStart={onStart}
    />
  );
}
