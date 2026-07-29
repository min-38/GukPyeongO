"use client";

import { useState } from "react";

import { playMessagePop } from "@/app/lib/sfx";
import { type StoryScenario } from "@/app/lib/story-scenario";
import { type PlanRead } from "@/app/lib/useScenario";

import ReadingScenario from "./ReadingScenario";
import { HtmlBlock } from "./SurfaceCards";

const OPENING_DELAY_MS = 400;

export default function StoryScenarioView({
  scenario,
  label,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: StoryScenario;
  // 상단바 이름 — 유형에서 온다(#99).
  label: string;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
}) {
  const [shown, setShown] = useState(false);

  // 긴 지문이라 공용 readMs(상한 2.6초)를 쓰지 않고 읽기 시간을 따로 준다.
  const revealOnce = (open: () => void, plan: PlanRead) => {
    // 시계는 화면에 들어온 순간부터 돈다(#99).
    plan(OPENING_DELAY_MS + scenario.readSec * 1000);
    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        setShown(true);
      }, OPENING_DELAY_MS),
    );
    timers.push(
      window.setTimeout(open, OPENING_DELAY_MS + scenario.readSec * 1000),
    );

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
      {shown &&
        (scenario.html?.trim() ? (
          <HtmlBlock html={scenario.html} card />
        ) : (
          // 다른 유형의 첫 카드와 같은 표면.
          <div className="animate-rise flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted/40 p-4">
            <div>
              <p className="text-xs font-medium text-brand">{scenario.source}</p>
              <h2 className="mt-1 text-lg font-bold leading-snug">
                {scenario.title}
              </h2>
            </div>
            <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
              {scenario.body.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
    </ReadingScenario>
  );
}
