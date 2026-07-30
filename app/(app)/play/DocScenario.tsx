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
    // 지문에 읽기 시간이 적혀 있으면 그걸 쓴다(#99). 없으면 글 길이로 계산한다.
    const openAt = OPENING_DELAY_MS + readWindow;
    // 시계는 화면에 들어온 순간부터 돈다 — 지문이 뜨길 기다렸다 걸면 잠깐 없다가 생긴다(#99).
    plan(openAt);
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
