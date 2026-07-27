"use client";

import { useState } from "react";

import { type ScheduledScenario } from "@/app/lib/schedule.server";
import { SCENARIO_KIND_LABELS } from "@/app/lib/scenario-admin";
import { saveTodayResult, useTodayScore } from "@/app/lib/today-result";

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
  const [index, setIndex] = useState(0);
  const [scoreSoFar, setScoreSoFar] = useState(0);
  // 오늘 이미 푼 기록. 있으면 문제 대신 그날 결과부터 보여준다(#90).
  const seenScore = useTodayScore(date);

  const total = scenarios.length;
  const current = scenarios[Math.min(index, total - 1)];
  const kinds = [...new Set(scenarios.map((s) => s.kind))]
    .map((k) => SCENARIO_KIND_LABELS[k])
    .join(" · ");

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
          onFinish={(score) => {
            const sum = scoreSoFar + score;
            if (index + 1 >= total) {
              saveTodayResult({ date, score: sum });
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
