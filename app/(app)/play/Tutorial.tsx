"use client";

import TutorialShell from "./TutorialShell";

// 회사 메신저 모드 시작 화면.
export default function Tutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      label="X톡 왔숑"
      pages={[
        {
          title: "메신저",
          desc: [
            "메신저는 현대인이 가장 많이, 그리고 자주 읽는 텍스트입니다.",
            "오늘 날, 대부분의 사람들은 메신저를 통해 대화를 나누고 있습니다.",
            "대화의 흐름을 이해하고, 상대의 의도를 정확히 읽어내는 능력을 평가합니다.",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
