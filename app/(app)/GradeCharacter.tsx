import type { ReactNode } from "react";

import { GRADE_TITLES } from "@/app/lib/quiz";

// 등급별 RPG 플랫 벡터 마스코트. 결과 화면·메인 등급 미리보기의 캐릭터로 사용.
// viewBox는 96×104 고정, 하단 정렬. 색은 등급 테마색과 맞춘다.
const SKIN = "#ffd9b0";
const INK = "#2a2440";
const BEARD = "#f4f2ff";

// 공용 몸통(로브) 패스와 얼굴.
const ROBE =
  "M48 58 C31 58 26 76 24 95 C23 101 28 102 34 102 L62 102 C68 102 73 101 72 95 C70 76 65 58 48 58 Z";

function Eyes() {
  return (
    <>
      <circle cx="43" cy="49" r="2.6" fill={INK} />
      <circle cx="53" cy="49" r="2.6" fill={INK} />
    </>
  );
}

function Face({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="48" cy="50" r="15" fill={SKIN} />
      {children}
    </>
  );
}

// 1등급 대현자 — 마법사
const sage = (
  <>
    <path d={ROBE} fill="#f59e0b" />
    <Face>
      <Eyes />
    </Face>
    <path d="M36 54 C39 80 57 80 60 54 C55 69 41 69 36 54 Z" fill={BEARD} />
    <ellipse cx="48" cy="38" rx="26" ry="6" fill="#d4920f" />
    <polygon points="48,4 33,38 63,38" fill="#f5b342" />
    <circle cx="48" cy="5" r="4" fill={BEARD} />
  </>
);

// 2등급 왕립 학자 — 학사모 + 책 + 안경
const scholar = (
  <>
    <path d={ROBE} fill="#10b981" />
    <Face>
      <circle cx="43" cy="49" r="4" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <circle cx="53" cy="49" r="4" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <line x1="47" y1="49" x2="49" y2="49" stroke={INK} strokeWidth="1.5" />
      <circle cx="43" cy="49" r="1.5" fill={INK} />
      <circle cx="53" cy="49" r="1.5" fill={INK} />
    </Face>
    <path d="M34 40 Q48 50 62 40 L62 45 Q48 55 34 45 Z" fill="#0e7a57" />
    <polygon points="48,26 20,37 48,46 76,37" fill="#0c5f44" />
    <circle cx="48" cy="36" r="2.2" fill="#facc15" />
    <path d="M48 36 L70 40 L70 52" stroke="#facc15" strokeWidth="1.5" fill="none" />
    <circle cx="70" cy="53" r="2.5" fill="#facc15" />
    <rect
      x="36"
      y="74"
      width="24"
      height="14"
      rx="1.5"
      fill="#f4f2ff"
      stroke={INK}
      strokeWidth="1.2"
    />
    <line x1="48" y1="74" x2="48" y2="88" stroke={INK} strokeWidth="1.2" />
  </>
);

// 3등급 숙련된 모험가 — 탐험가 모자 + 스카프
const adventurer = (
  <>
    <path d={ROBE} fill="#14b8a6" />
    <Face>
      <Eyes />
      <path
        d="M44 56 Q48 60 52 56"
        stroke={INK}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </Face>
    <path d="M33 60 Q48 70 63 60 L63 66 Q48 76 33 66 Z" fill="#0e7d72" />
    <ellipse cx="48" cy="36" rx="25" ry="5" fill="#0e7d72" />
    <path d="M35 36 Q35 20 48 20 Q61 20 61 36 Z" fill="#14b8a6" />
    <rect x="35" y="32" width="26" height="4" fill="#0b5f57" />
  </>
);

// 4등급 견습 기사 — 투구 + 갑옷 (얼굴은 바이저)
const knight = (
  <>
    <path d={ROBE} fill="#6366f1" />
    <ellipse cx="28" cy="64" rx="9" ry="7" fill="#4f46e5" />
    <ellipse cx="68" cy="64" rx="9" ry="7" fill="#4f46e5" />
    <path d="M30 46 Q30 22 48 22 Q66 22 66 46 Z" fill="#6366f1" />
    <line x1="48" y1="22" x2="48" y2="40" stroke="#4f46e5" strokeWidth="2" />
    <rect x="30" y="40" width="36" height="7" rx="1" fill={INK} />
    <circle cx="42" cy="43.5" r="1.8" fill="#a5b4fc" />
    <circle cx="54" cy="43.5" r="1.8" fill="#a5b4fc" />
    <path d="M48 22 Q48 10 56 8 Q52 16 52 22 Z" fill="#a5b4fc" />
  </>
);

// 5등급 떠돌이 여행자 — 챙 넓은 모자 + 배낭 끈
const traveler = (
  <>
    <path d={ROBE} fill="#7c3aed" />
    <rect x="36" y="58" width="5" height="42" rx="2" fill="#5b21b6" />
    <rect x="55" y="58" width="5" height="42" rx="2" fill="#5b21b6" />
    <Face>
      <Eyes />
      <path
        d="M44 56 Q48 59 52 56"
        stroke={INK}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </Face>
    <ellipse cx="48" cy="36" rx="28" ry="6" fill="#5b21b6" />
    <ellipse cx="48" cy="30" rx="13" ry="9" fill="#7c3aed" />
    <ellipse cx="48" cy="34" rx="13" ry="3" fill="#4c1d95" />
  </>
);

// 6등급 수련생 — 머리띠 + 결연한 표정
const trainee = (
  <>
    <path d={ROBE} fill="#f97316" />
    <path d="M40 58 L48 66 L56 58 Z" fill="#c2410c" />
    <Face>
      <Eyes />
      <line
        x1="45"
        y1="56"
        x2="51"
        y2="56"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Face>
    <path d="M40 36 Q44 28 48 36 Q52 28 56 36 Z" fill="#3b2a1a" />
    <rect x="32" y="40" width="32" height="5" rx="1" fill="#ea580c" />
    <path d="M64 42 L72 38 L72 46 Z" fill="#ea580c" />
  </>
);

// 7등급 마을 주민 — 단순한 두건
const villager = (
  <>
    <path d={ROBE} fill="#fb7185" />
    <Face>
      <Eyes />
      <path
        d="M44 56 Q48 59 52 56"
        stroke={INK}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </Face>
    <path d="M33 42 Q33 27 48 27 Q63 27 63 42 Z" fill="#e11d48" />
    <rect x="33" y="41" width="30" height="3" rx="1" fill="#be123c" />
    <circle cx="48" cy="27" r="2.5" fill="#be123c" />
  </>
);

// 8등급 길 잃은 초심자 — 물음표 + 땀방울, 당황한 표정
const beginner = (
  <>
    <path d={ROBE} fill="#ef4444" />
    <Face>
      <circle cx="43" cy="49" r="2.6" fill={INK} />
      <circle cx="53" cy="49" r="2.6" fill={INK} />
      <line x1="39" y1="44" x2="46" y2="43" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="50" y1="43" x2="57" y2="44" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="48" cy="57" rx="2.5" ry="2" fill={INK} />
    </Face>
    <path
      d="M34 41 Q40 31 48 35 Q56 31 62 41 Q56 37 48 39 Q40 37 34 41 Z"
      fill="#5b3a1a"
    />
    <path
      d="M44 12 Q44 6 49 6 Q54 6 54 11 Q54 15 49 16 L49 19"
      stroke="#ef4444"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="49" cy="23" r="1.6" fill="#ef4444" />
    <path d="M62 44 Q64 48 62 50 Q60 48 62 44 Z" fill="#60a5fa" />
  </>
);

// 9등급 갓 깨어난 슬라임 — 멍한 블롭
const slime = (
  <>
    <path
      d="M48 38 C28 38 16 64 16 82 C16 94 26 98 48 98 C70 98 80 94 80 82 C80 64 68 38 48 38 Z"
      fill="#dc2626"
    />
    <ellipse cx="38" cy="54" rx="6" ry="3.5" fill="#fff" opacity="0.45" />
    <circle cx="38" cy="72" r="7" fill="#fff" />
    <circle cx="58" cy="72" r="7" fill="#fff" />
    <circle cx="39" cy="74" r="3" fill={INK} />
    <circle cx="57" cy="74" r="3" fill={INK} />
    <path
      d="M41 84 Q48 89 55 84"
      stroke="#7a1414"
      strokeWidth="2.6"
      fill="none"
      strokeLinecap="round"
    />
  </>
);

const CHARACTERS: Record<number, ReactNode> = {
  1: sage,
  2: scholar,
  3: adventurer,
  4: knight,
  5: traveler,
  6: trainee,
  7: villager,
  8: beginner,
  9: slime,
};

export default function GradeCharacter({
  grade,
  className = "",
}: {
  grade: number;
  className?: string;
}) {
  const body = CHARACTERS[grade] ?? CHARACTERS[5];
  return (
    <svg
      viewBox="0 0 96 104"
      className={className}
      role="img"
      aria-label={`${GRADE_TITLES[grade] ?? "문해력 캐릭터"} 캐릭터`}
    >
      {body}
    </svg>
  );
}
