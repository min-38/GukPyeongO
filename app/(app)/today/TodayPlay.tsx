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
import TutorialShell from "../play/TutorialShell";

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
  const [scoreSoFar, setScoreSoFar] = useState(0);
  // 고른 답을 모아 둔다. 점수는 서버가 다시 계산하므로 여기서 만든 값은 보내지 않는다.
  const answersRef = useRef<
    { slug: string; stepKey: string; choiceIndex: number | null }[]
  >([]);
  // 오늘 이미 푼 기록. 있으면 문제 대신 그날 결과부터 보여준다(#90).
  const seenScore = useTodayScore(date);

  const total = scenarios.length;
  const current = scenarios[Math.min(index, total - 1)];
  const kinds = [...new Set(scenarios.map((s) => s.kind))]
    .map((k) => SCENARIO_KIND_LABELS[k])
    .join(" · ");

  // 회차가 끝나면 서버에 답을 보내 등급을 받고 결과 화면으로 넘긴다.
  async function gradeAndGo() {
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
      router.push("/result");
    } catch {
      // 채점을 못 받아도 완료 화면의 점수는 남는다.
    }
  }

  return (
    <PlayShell
      initialScore={seenScore}
      doneTitle="오늘 문제 끝!"
      tutorial={(start) => (
        <TutorialShell
          label="오늘의 문제"
          title={`${total}개를 이어서 풉니다`}
          subtitle={
            <>
              오늘 편성된 문제입니다.
              <br />
              {kinds}
            </>
          }
          demo={
            <div className="rounded-2xl border border-border bg-surface-muted/40 p-4 text-center">
              <p className="text-[15px] font-bold">
                문제{" "}
                {scenarios.reduce(
                  (n, s) => n + (s.content.steps as unknown[]).length,
                  0,
                )}
                개
              </p>
              <p className="mt-1 text-[13px] text-muted">
                지문을 읽고 답을 고르면 다음으로 넘어갑니다.
              </p>
            </div>
          }
          steps={[
            <>
              유형이 <b className="font-medium text-foreground">섞여서</b>{" "}
              나옵니다. 한 편이 끝나면 다음 편으로 이어져요.
            </>,
            <>
              문제가 뜨면{" "}
              <b className="font-medium text-foreground">제한시간</b>이
              시작돼요. 틀려도 계속 진행됩니다.
            </>,
            <>
              어려운 문항일수록{" "}
              <b className="font-medium text-foreground">배점이 큽니다.</b>
            </>,
          ]}
          startLabel="시작하기"
          onStart={() => {
            // 다시 하기로 들어와도 처음부터 — 셸이 이 트리를 새로 마운트한다.
            setIndex(0);
            setScoreSoFar(0);
            start();
          }}
        />
      )}
      renderScenario={(onFinish) => (
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
          }}
        />
      )}
    />
  );
}
