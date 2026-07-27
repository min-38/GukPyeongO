"use client";

import { useState } from "react";

import { type DocScenario } from "@/app/lib/doc-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario from "./ReadingScenario";
import { DocCard } from "./SurfaceCards";

const OPENING_DELAY_MS = 400;

export default function DocScenarioView({
  scenario,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: DocScenario;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
}) {
  const [docShown, setDocShown] = useState(false);

  // 문서는 처음에 한 번 등장. 훑을 시간을 준 뒤 첫 문제를 연다.
  const revealOnce = (open: () => void) => {
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        setDocShown(true);
      }, OPENING_DELAY_MS),
    );
    const openAt = OPENING_DELAY_MS + readMs(scenario.doc.body.join(" "));
    timers.push(window.setTimeout(open, openAt));
    return () => timers.forEach(clearTimeout);
  };

  return (
    <ReadingScenario
      label={scenario.sourceLabel}
      steps={scenario.steps}
      onFinish={onFinish}
      slug={slug}
      onAnswered={onAnswered}
      revealOnce={revealOnce}
    >
      {docShown && (
        <DocCard
          source={scenario.doc.source}
          title={scenario.doc.title}
          body={scenario.doc.body}
        />
      )}
    </ReadingScenario>
  );
}
