"use client";

import TutorialShell from "./TutorialShell";

// 어휘 유형 시작 화면 (#101).
export default function WordTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      label="이 말, 무슨 뜻일까?"
      pages={[
        {
          title: "어휘",
          desc: [
            "한자어, 고유어, 외래어 등 다양한 낱말이 출제됩니다.",
            "지문 없이 낱말의 뜻만 묻습니다.",
            "낱말을 정확히 아는지 평가합니다.",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
