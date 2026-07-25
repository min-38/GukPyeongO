"use client";

import TutorialShell from "../../play/TutorialShell";

// 답장 대조형 시작 화면.
export default function ReplyTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      label="메일"
      title="이 답장, 원문이랑 같나요?"
      subtitle={
        <>
          긴 공지를 먼저 읽고,
          <br />
          나중에 온 답장이 뭘 잘못 옮겼는지 찾아내면 됩니다.
        </>
      }
      demo={
        <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <p className="text-xs font-medium text-brand">받은 답장</p>
          <p className="mt-1 text-[15px] font-bold">
            “당일은 정상 출근하시면 됩니다”
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            원문엔 <b className="font-medium text-foreground">‘전 직원 재택근무’</b>
            라고 적혀 있었다면? 한 줄만 틀려도 팀 전체가 헛걸음합니다.
          </p>
        </div>
      }
      steps={[
        <>먼저 긴 공지 메일이 열립니다. 날짜·수량·조건을 꼼꼼히 읽어두세요.</>,
        <>
          몇 문제 뒤 답장이 도착합니다.{" "}
          <b className="font-medium text-foreground">원문 / 답장 탭</b>을 눌러
          왔다갔다 대조하면 됩니다.
        </>,
        <>문제가 뜨면 제한시간이 시작돼요. 틀려도 계속 진행됩니다.</>,
      ]}
      startLabel="공지 읽기"
      onStart={onStart}
    />
  );
}
