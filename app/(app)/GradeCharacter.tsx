import Image from "next/image";

import { GRADE_TITLES } from "@/app/lib/quiz";

// 등급별 캐릭터 (#106).
// 손으로 그린 인라인 SVG 9종을 동물 그림으로 갈아끼웠다 —
// 원본은 design/animals.png 한 장이고, 등급별로 잘라 public/animals/1.png ~ 9.png 로 둔다.
// 원본은 public 밖에 둔다 — 1.6MB짜리가 배포에 실려 나갈 이유가 없다.
// 등급이 낮아질수록 인지능력이 낮은 동물이 온다: 범고래·코끼리·돼지·고양이·양·토끼·거북·개구리·모기.

const ANIMALS: Record<number, string> = {
  1: "범고래",
  2: "코끼리",
  3: "돼지",
  4: "고양이",
  5: "양",
  6: "토끼",
  7: "거북",
  8: "개구리",
  9: "모기",
};

// 화면에서 쓰는 가장 큰 크기(결과·홈의 h-32 = 128px)의 2배.
// 실제 표시 크기는 className이 정한다 — next/image가 이 값으로 받아 줄여 내보낸다.
const RENDER_PX = 256;

export default function GradeCharacter({
  grade,
  className = "",
  // 첫 화면의 주인공일 때만 켠다. 9종을 한 줄로 늘어놓는 자리에서 다 켜면
  // 작은 그림들이 LCP를 밀어낸다.
  priority = true,
}: {
  grade: number;
  className?: string;
  priority?: boolean;
}) {
  // 모르는 등급이 오면 가운데(5등급)를 세운다.
  const g = ANIMALS[grade] ? grade : 5;
  return (
    <Image
      src={`/animals/${g}.png`}
      alt={`${GRADE_TITLES[g] ?? ANIMALS[g]} 캐릭터`}
      width={RENDER_PX}
      height={RENDER_PX}
      className={className}
      priority={priority}
    />
  );
}
