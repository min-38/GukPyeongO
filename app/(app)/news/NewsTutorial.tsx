"use client";

import TutorialExample from "../play/TutorialExample";
import TutorialShell from "../play/TutorialShell";

// 신문 읽기 유형 시작 화면.
export default function NewsTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      label="국평오일보"
      pages={[
        {
          title: "신문기사 유형",
          desc: [
            "신문을 제대로 읽지 못하면 세상을 이해하기 힘들죠.",
            "제목으로만 내용을 짐작할 수도 있지만, 본문을 읽어야 정확히 알 수 있습니다.",
            "신문 기사의 핵심 내용을 파악하고, 세부 사항을 정확히 읽어내는 능력을 평가합니다.",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
