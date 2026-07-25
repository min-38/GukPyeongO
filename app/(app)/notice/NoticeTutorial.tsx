"use client";

import TutorialShell from "../play/TutorialShell";

// 공지 읽기 유형 시작 화면.
export default function NoticeTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      label="공지사항"
      title="이 공고, 함정 보이세요?"
      subtitle={
        <>
          안내문에 슬쩍 숨은 조건과 함정을
          <br />
          놓치지 않고 읽어내면 됩니다.
        </>
      }
      demo={
        <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <p className="text-xs font-medium text-brand">○○기관</p>
          <p className="mt-1 text-[15px] font-bold">참가비: 무료 (단, 교재비 별도)</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            “무료”만 읽으면 낚입니다. <b className="font-medium text-foreground">‘단, …’</b> 뒤가 진짜예요.
          </p>
        </div>
      }
      steps={[
        <>
          공고를 <b className="font-medium text-foreground">한 번</b> 보여주고, 그 위에서 문제가 이어져요.
        </>,
        <>
          <b className="font-medium text-foreground">낚시 조항·조건·기한</b>을 정확히 읽었는지 묻습니다.
        </>,
        <>
          문제가 뜨면 <b className="font-medium text-foreground">제한시간</b>이 시작돼요. 틀려도 계속 진행됩니다.
        </>,
      ]}
      startLabel="공고 읽기"
      onStart={onStart}
    />
  );
}
