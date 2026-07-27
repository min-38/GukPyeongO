"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { type ScheduledScenario } from "@/app/lib/schedule.server";
import { SCENARIO_KIND_LABELS } from "@/app/lib/scenario-admin";
import {
  GRADE_TITLES,
  RESULT_STORAGE_KEY,
  type StoredResult,
} from "@/app/lib/quiz";
import { saveTodayResult, useTodayScore } from "@/app/lib/today-result";

// 회차 채점 응답 (#89). 정답·배점·만점은 서버가 DB에서 읽어 계산한다.
interface GradeResponse {
  grade: number;
  score: number;
  maxScore: number;
  correctCount: number;
  totalCount: number;
  gradeToken: string;
  typeStats: { type: string; correct: number; total: number }[];
}

import PlayShell from "../play/PlayShell";
import SurfaceByKind from "../play/SurfaceByKind";
import TutorialByKind from "../play/TutorialByKind";
import TutorialShell from "../play/TutorialShell";

// 공통 튜토리얼은 한 번 익히면 끝이라 끌 수 있다(#93).
const TODAY_TUTORIAL_KEY = "gukpyeongo:today-tutorial-seen";

// 오늘 편성된 문제를 이어서 푸는 한 회차 (#87).
// 유형이 섞여 나온다 — 하나가 끝나면 다음 시나리오로 넘어가고, 점수는 회차 전체로 합산한다.
export default function TodayPlay({
  scenarios,
  date,
}: {
  scenarios: ScheduledScenario[];
  // 서버가 계산한 오늘(KST). 클라이언트가 따로 계산하면 자정 언저리에 어긋난다.
  date: string;
}) {
  // 지금 푸는 시나리오와 여기까지 쌓인 점수. 마지막이 끝나면 합계를 셸에 넘긴다.
  const router = useRouter();
  const [index, setIndex] = useState(0);
  // 문제마다 그 유형의 읽는 법을 먼저 보여준다(#93). 유형이 섞여 나오기 때문(#87).
  const [kindReady, setKindReady] = useState(false);
  const [scoreSoFar, setScoreSoFar] = useState(0);
  // 고른 답을 모아 둔다. 점수는 서버가 다시 계산하므로 여기서 만든 값은 보내지 않는다.
  const answersRef = useRef<
    { slug: string; stepKey: string; choiceIndex: number | null }[]
  >([]);
  // 오늘 이미 푼 기록. 있으면 문제 대신 그날 결과부터 보여준다(#90).
  const seenScore = useTodayScore(date);
  // 채점 중 화면. 결과 페이지로 넘어갈 때까지 이 화면을 붙잡는다.
  const [grading, setGrading] = useState(false);

  const total = scenarios.length;
  const current = scenarios[Math.min(index, total - 1)];
  const kinds = [...new Set(scenarios.map((s) => s.kind))]
    .map((k) => SCENARIO_KIND_LABELS[k])
    .join(" · ");

  // 회차가 끝나면 서버에 답을 보내 등급을 받고 결과 화면으로 넘긴다.
  // 채점이 순식간에 끝나도 최소 시간은 보여준다 — 결과가 툭 튀어나오면 뭘 한 건지 모른다.
  const GRADING_MIN_MS = 3000;
  async function gradeAndGo() {
    setGrading(true);
    const shown = new Promise((r) => setTimeout(r, GRADING_MIN_MS));
    try {
      const res = await fetch("/api/today-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      if (!res.ok) return;
      const g = (await res.json()) as GradeResponse;

      // 결과 화면은 v1 채점 응답 모양을 그대로 읽는다. 없는 값(반응 속도 등)은 비워 둔다.
      const stored: StoredResult = {
        mode: "quick",
        modeLabel: "오늘의 문제",
        score: g.score,
        maxScore: g.maxScore,
        grade: g.grade,
        title: GRADE_TITLES[g.grade] ?? "",
        correctCount: g.correctCount,
        totalCount: g.totalCount,
        avgReactionMs: 0,
        weakTypes: g.typeStats
          .filter((t) => t.correct < t.total)
          .map((t) => t.type),
        typeStats: g.typeStats as StoredResult["typeStats"],
        gradeToken: g.gradeToken,
        perQuestion: [],
        typeLabels: Object.fromEntries(
          g.typeStats.map((t) => [t.type, t.type]),
        ),
      };
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(stored));
      // 채점이 더 오래 걸렸으면 기다린 만큼만, 빨리 끝났으면 최소 시간까지.
      await shown;
      router.push("/result");
    } catch {
      // 채점을 못 받아도 완료 화면의 점수는 남는다.
      await shown;
      setGrading(false);
    }
  }

  if (grading) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <span className="animate-float text-5xl">🧮</span>
        <p className="font-display text-2xl">채점 중이에요</p>
        <p className="text-sm text-muted">잠시만 기다려주세요.</p>
      </main>
    );
  }

  return (
    <PlayShell
      initialScore={seenScore}
      doneTitle="오늘 문제 끝!"
      tutorial={(start) => (
        <TutorialShell
          framed
          countdown
          label="국평오 테스트"
          dismissKey={TODAY_TUTORIAL_KEY}
          pages={[
            {
              emoji: "📝",
              title: "테스트 방식",
              desc: (
                <>
                  다양한 유형의 문항이 연속으로 출제됩니다.
                  <br />
                  지문을 잘 읽고 문제에 알맞은 답을 선택해 보세요.
                </>
              ),
            },
            {
              emoji: (
                <div className="flex justify-center">
                  <span className="rounded-full px-5 py-2 text-lg font-bold tabular-nums bg-surface-muted text-foreground mr-2">
                    ⏱ 90s
                  </span>
                  <span className="animate-pulse rounded-full bg-red-500 px-5 py-2 text-lg font-bold tabular-nums text-white">
                    ⏱ 5s
                  </span>
                </div>
              ),
              title: "시간 제한",
              desc: (
                <>
                  문제가 나오고 제한시간이 시작됩니다.
                  <br />
                  제한시간이 각각 다르며, 시간 초과 시 오답 처리됩니다.
                </>
              ),
            },
            {
              emoji: "💯",
              title: "점수 배점",
              desc: (
                <>
                  문제의 난이도마다 배점을 달리 정했습니다.
                  <br />각 문제마다 배점을 보여줍니다.
                </>
              ),
            },
            {
              emoji: "🥇🥈🥉",
              title: `등급 산정`,
              desc: (
                <>
                  정답을 맞춘 점수를 합산해 등급을 매겨요.
                  <br />
                  2026 수능 국어 영역 등급 기준을 참고했습니다.
                </>
              ),
            },
          ]}
          startLabel="시작하기"
          onStart={() => {
            // 시작만 하고 이탈한 사람도 세야 이탈 지점이 보인다(#91).
            void fetch("/api/today-session", { method: "POST" });
            // 다시 하기로 들어와도 처음부터 — 셸이 이 트리를 새로 마운트한다.
            setIndex(0);
            setKindReady(false);
            setScoreSoFar(0);
            start();
          }}
        />
      )}
      renderScenario={(onFinish) =>
        !kindReady ? (
          <TutorialByKind
            key={`tutorial-${index}`}
            kind={current.kind}
            scenario={current.content}
            onStart={() => setKindReady(true)}
          />
        ) : (
          <SurfaceByKind
            // 시나리오가 바뀌면 표면을 새로 마운트해 재생을 처음부터 돌린다.
            key={index}
            kind={current.kind}
            scenario={current.content}
            slug={current.slug}
            onAnswered={(stepId, choiceIndex) =>
              answersRef.current.push({
                slug: current.slug,
                stepKey: stepId,
                choiceIndex,
              })
            }
            onFinish={(score) => {
              const sum = scoreSoFar + score;
              if (index + 1 >= total) {
                saveTodayResult({ date, score: sum });
                void gradeAndGo();
                return onFinish(sum);
              }
              setScoreSoFar(sum);
              setIndex(index + 1);
              setKindReady(false);
            }}
          />
        )
      }
    />
  );
}
