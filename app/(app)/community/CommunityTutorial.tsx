"use client";

import TutorialExample from "../play/TutorialExample";
import TutorialShell from "../play/TutorialShell";

// 커뮤니티 유형 시작 화면.
export default function CommunityTutorial({
  boardName,
  onStart,
}: {
  boardName: string;
  onStart: () => void;
}) {
  return (
    <TutorialShell
      framed="example"
      label={`${boardName}`}
      pages={[
        {
          title: "커뮤니티",
          desc: [
            "커뮤니티 상황에서의 읽기 능력을 평가합니다.",
            "맥락 없는 글, 뜬금없는 댓글. 커뮤니티에선 흔하죠.",
            "요지를 짚고 딴소리를 골라낼 수 있는지 봅니다.",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
