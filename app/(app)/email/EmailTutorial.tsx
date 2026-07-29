"use client";

import TutorialShell from "../play/TutorialShell";

// 이메일 스레드 유형 시작 화면.
export default function EmailTutorial({ onStart }: { onStart: () => void }) {
  return (
    <TutorialShell
      framed="example"
      label="OO님께서 보낸 메일"
      pages={[
        {
          title: "메일",
          desc: [
            "이메일은 오래 전부터 지금까지 가장 흔하게 사용하는 커뮤니케이션 수단입니다.",
            "정중한 문장 속에 숨겨진 진짜 목적과 세부 요청 사항을 정확히 읽어내야 합니다.",
            "꼼꼼한 독해력으로 이메일 속 중요한 정보들을 빠짐없이 파악해 보세요!",
          ],
        },
      ]}
      startLabel="시작하기"
      onStart={onStart}
    />
  );
}
