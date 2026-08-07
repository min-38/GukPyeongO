"use client";

import { gradeTheme } from "@/app/lib/quiz";
import { type PublicHistory } from "@/app/lib/history.server";

// 홈에 여는 지난 회차 기록 (#113).
// 처음 들어온 사람에게 "이 서비스 굴러가고 있구나"를 보여준다.
// 매주 돌아간다는 것은 문장이 아니라 이력으로 말해야 믿는다.
//
// 여기 없는 것들에 이유가 있다 — 완주율·재방문율·회차별 응시자 수는
// 지금 숫자로 보여주면 오히려 한산해 보인다(app/lib/history.server.ts).

export default function PastRounds({ history }: { history: PublicHistory }) {
  if (history.rounds.length === 0) return null;

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold tracking-[0.2em] text-brand">
          지난 회차
        </p>
        <h2 className="mt-3 font-display text-3xl lg:text-4xl">
          지금까지{" "}
          <span className="text-brand">{history.totalVisitors}명</span>이
          풀었어요
        </h2>
        <p className="mt-3 text-sm text-muted">
          문제는 일주일마다 바뀌고, 지난 회차는 이렇게 쌓였습니다.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {history.rounds.map((round) => {
            const solved = round.gradeDist.reduce((n, c) => n + c, 0);
            const most = Math.max(1, ...round.gradeDist);
            return (
              <li
                key={round.roundId}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold">{round.label} 회차</p>
                  <p className="text-xs text-muted">
                    지문 {round.scenarios}편 · 문항 {round.steps}개
                  </p>
                </div>

                {/* 등급 분포. 인원 숫자는 적지 않는다 — 모양만 보여도 "나만 못한 게 아니다"는 전해진다. */}
                {solved > 0 && (
                  <div
                    className="mt-4 flex h-16 items-end gap-1"
                    role="img"
                    aria-label={`등급 분포. ${round.gradeDist
                      .map((c, i) => `${i + 1}등급 ${c}명`)
                      .join(", ")}`}
                  >
                    {round.gradeDist.map((count, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${Math.max(2, (count / most) * 100)}%`,
                            background:
                              round.myGrade === i + 1
                                ? gradeTheme(i + 1).color
                                : "var(--surface-muted)",
                          }}
                        />
                        <span
                          className={`text-[10px] tabular-nums ${
                            round.myGrade === i + 1
                              ? "font-bold text-brand"
                              : "text-muted"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 다시 온 사람에게만 뜬다. 서버가 쿠키로 그 회차의 내 기록을 찾아 준다. */}
                {round.myGrade !== null && (
                  <p className="mt-3 text-sm">
                    이 회차에서 나는{" "}
                    <span className="font-bold text-brand">
                      {round.myGrade}등급
                    </span>
                    이었어요
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
