"use client";

import { useState } from "react";

import { type DocScenario } from "@/app/lib/doc-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { type OnAnswered, type PlanRead } from "@/app/lib/useScenario";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario from "./ReadingScenario";
import { DocCard } from "./SurfaceCards";

const OPENING_DELAY_MS = 400;

export default function DocScenarioView({
  scenario,
  label,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: DocScenario;
  // 상단바 이름 — 유형에서 온다(#99).
  label: string;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: OnAnswered;
}) {
  const [docShown, setDocShown] = useState(false);

  // 문서는 처음에 한 번 등장. 훑을 시간을 준 뒤 첫 문제를 연다.
  const revealOnce = (open: () => void, plan: PlanRead) => {
    // 지문에 읽기 시간이 적혀 있으면 그걸 쓴다(#99). 없으면 글 길이로 계산한다.
    const readWindow = scenario.readSec
      ? scenario.readSec * 1000
      : readMs(scenario.doc.body.join(" "));
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        setDocShown(true);
      }, OPENING_DELAY_MS),
    );
    const openAt = OPENING_DELAY_MS + readWindow;
    // 남은 초는 문서가 뜨는 순간부터 보인다 — 그 전에 띄우면 지문도 없는데
    // '다 읽었어요' 버튼만 먼저 서 있게 된다.
    plan(openAt, OPENING_DELAY_MS);
    timers.push(window.setTimeout(open, openAt));
    return () => timers.forEach(clearTimeout);
  };

  return (
    <ReadingScenario
      label={label}
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
          html={scenario.doc.html}
        />
      )}
    </ReadingScenario>
  );
}
