"use client";

import TutorialShell from "../play/TutorialShell";

// 이메일 스레드 유형 시작 화면.
export default function EmailTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      label="메일"
      title="이 답장, 원문이랑 같나요?"
      subtitle={
        <>
          회신이 쌓인 스레드에서
          <br />
          누가 뭘 잘못 옮겨 적었는지 찾아내면 됩니다.
        </>
      }
      demo={
        <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <p className="text-xs font-medium text-brand">받은 답장</p>
          <p className="mt-1 text-[15px] font-bold">
            “팀장님 승인해주셨다고 하니 확정하겠습니다”
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            원문엔{" "}
            <b className="font-medium text-foreground">‘아직 검토 중’</b>이라고
            적혀 있었다면? 인용을 펼쳐서 대조해보세요.
          </p>
        </div>
      }
      steps={[
        <>메일 스레드가 통째로 열립니다. 보낸사람·참조·시각까지 훑어보세요.</>,
        <>
          <b className="font-medium text-foreground">··· 버튼</b>을 누르면 접힌
          인용문이 펼쳐집니다. 원문과 대조하는 게 핵심이에요.
        </>,
        <>문제가 뜨면 제한시간이 시작돼요. 틀려도 계속 진행됩니다.</>,
      ]}
      startLabel="메일 읽기"
      onStart={onStart}
    />
  );
}
