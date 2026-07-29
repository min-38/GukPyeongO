"use client";

import TutorialShell from "../play/TutorialShell";

// 사용설명서 유형 시작 화면 (#99).
export default function ManualTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      pages={[
        {
          title: "사용설명서",
          desc: [
            "설명서는 순서를 지키지 않으면 그대로 고장으로 이어집니다.",
            "경고와 주의는 다르고, 조건이 붙은 문장은 늘 따로 있어요.",
            "절차의 순서와 경고가 미치는 범위를 가려내는 능력을 평가합니다.",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
