"use client";

import TutorialShell from "../play/TutorialShell";

// 계약서 유형 시작 화면 (#99).
export default function ContractTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      pages={[
        {
          title: "계약서",
          desc: [
            "계약서는 읽지 않아도 서명하면 그대로 묶입니다.",
            "위약금·기간·책임은 대개 조문 뒤쪽 단서에 숨어 있어요.",
            "무엇에 묶이고 얼마를 물게 되는지 짚어내는 능력을 평가합니다.",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
