"use client";

import TutorialExample from "../play/TutorialExample";
import TutorialShell from "../play/TutorialShell";

// 서사 읽기 유형 시작 화면.
export default function StoryTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      label="국평오 단편선"
      pages={[
        {
          title: "문학",
          desc: [
            "문학 작품을 읽고 이해하는 능력도 핵심 문해력 중 하나입니다.",
            "시대적 배경이나 주인공의 심정을 묻는 감상형 문제는 없으니 안심하세요.",
            "작품 속에 명시된 문장과 등장인물의 말과 행동을 바탕으로 정확한 답을 찾아보세요.",

          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
