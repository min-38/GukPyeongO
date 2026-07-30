"use client";

import TutorialShell from "../play/TutorialShell";

// 공지 읽기 유형 시작 화면.
export default function NoticeTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      label="알려드립니다!"
      pages={[
        {
          title: "공지사항",
          desc: [
            "공지사항에는 꼭 알아야 할 중요한 정보가 담겨 있습니다.",
            "제대로 읽지 않으면 억울하게 틀리거나 손해를 볼 수 있어요.",
            "필요한 정보를 정확히 찾아내는 능력을 평가합니다.",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
