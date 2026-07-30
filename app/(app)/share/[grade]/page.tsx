import type { Metadata } from "next";
import Link from "next/link";

import GradeCharacter from "../../GradeCharacter";
import { GRADE_TITLES } from "@/app/lib/quiz";

// 결과 공유 링크가 열리는 자리 (#106 후속).
//
// 결과 화면(/result)은 브라우저 저장소를 읽어 그리므로 남에게 주소를 줘도 아무것도 안 보인다.
// 그래서 공유 전용 주소를 따로 둔다 — 등급만 주소에 실어, 받은 사람은 친구 등급을 보고
// 곧장 자기도 풀어볼 수 있다.
//
// 등급을 주소로 받으니 아무 값이나 넣어 만들 수 있다. 자랑용 카드일 뿐이고
// 실제 기록은 서버(scenario_sessions)에 있으므로 위조해도 얻는 게 없다.

function safeGrade(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 9 ? n : null;
}

export async function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => ({ grade: String(g) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string }>;
}): Promise<Metadata> {
  const grade = safeGrade((await params).grade);
  if (!grade) return { title: "결과 공유" };

  const title = `문해력 ${grade}등급 — ${GRADE_TITLES[grade]}`;
  const description = "일주일마다 새 문제. 당신의 문해력은 몇 등급?";
  return {
    title,
    description,
    // 등급마다 거의 같은 페이지가 아홉 개 생긴다 — 색인에서는 빼고 공유에만 쓴다.
    robots: { index: false, follow: true },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const grade = safeGrade((await params).grade) ?? 5;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <p className="text-sm font-medium text-muted">친구의 문해력 등급은</p>

      <GradeCharacter grade={grade} className="h-32 w-32" />

      <h1 className="font-display text-5xl leading-tight tracking-tight">
        <span className="text-brand">{grade}등급</span>
      </h1>
      <p className="text-lg font-bold">{GRADE_TITLES[grade]}</p>

      <p className="max-w-xs text-sm text-muted">
        국평오는 일주일마다 새 문제가 올라오는 문해력 테스트예요. 회원가입 없이
        바로 풀 수 있어요.
      </p>

      <Link
        href="/today"
        className="mt-2 flex h-14 w-full max-w-xs items-center justify-center rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 active:scale-[0.98]"
      >
        나도 해보기
      </Link>
    </main>
  );
}
