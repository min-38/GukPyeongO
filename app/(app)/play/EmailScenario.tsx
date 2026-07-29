"use client";

import { useState } from "react";

import {
  type EmailScenario,
  type EmailStep,
} from "@/app/lib/email-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { type PlanRead } from "@/app/lib/useScenario";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario, { NEXT_STEP_OPEN_MS } from "./ReadingScenario";
import { EmailThread } from "./SurfaceCards";

const OPENING_DELAY_MS = 400;

export default function EmailScenarioView({
  scenario,
  label,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: EmailScenario;
  // 상단바 이름 — 유형에서 온다(#99).
  label: string;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
}) {
  // 지금까지 열린 메일 수. 이미 열린 메일은 다시 닫히지 않으므로 원문을 계속 대조할 수 있다.
  const [visible, setVisible] = useState(0);
  // toggle 레이아웃에서 지금 보고 있는 메일.
  const [tab, setTab] = useState(0);

  const targetOf = (step: EmailStep) =>
    step.showUpTo ?? scenario.messages.length;

  // 새로 열리는 메일만큼만 읽을 시간을 준다.
  // 지정한 읽기 시간은 메일이 열릴 때마다 그대로 준다(#99).
  // 7초라고 적었으면 1번에도 7초, 2번이 열릴 때도 7초다 — 새로 온 메일도 읽을 시간이 필요하다.
  const readMsFor = (from: number, to: number) =>
    scenario.readSec
      ? scenario.readSec * 1000
      : readMs(
          scenario.messages
            .slice(from, to)
            .map((m) => (m.html ?? (m.body ?? []).join(" ")))
            .join(" "),
        );

  const openUpTo = (
    to: number,
    from: number,
    open: () => void,
    plan: PlanRead,
  ) => {
    const timers: number[] = [];
    // 시계는 화면에 들어온 순간부터 돈다(#99).
    plan(OPENING_DELAY_MS + readMsFor(from, to));
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        setVisible(to);
        // 새로 열린 것 중 첫 통을 편다 — 한 번에 여러 통이 열려도 스레드는 위에서부터 읽는다.
        setTab(from);
      }, OPENING_DELAY_MS),
    );
    timers.push(
      window.setTimeout(open, OPENING_DELAY_MS + readMsFor(from, to)),
    );
    return () => timers.forEach(clearTimeout);
  };

  const revealOnce = (open: () => void, plan: PlanRead) =>
    openUpTo(targetOf(scenario.steps[0]), 0, open, plan);

  // 답장이 새로 열리는 스텝에서만 읽을 시간을 준다. 아니면 문제만 바뀐다.
  const revealNext = (
    step: EmailStep,
    _index: number,
    open: () => void,
    plan: PlanRead,
  ) => {
    const to = targetOf(step);
    if (to <= visible) {
      const t = window.setTimeout(open, NEXT_STEP_OPEN_MS);
      return () => clearTimeout(t);
    }
    return openUpTo(to, visible, open, plan);
  };

  return (
    <ReadingScenario
      label={label}
      steps={scenario.steps}
      onFinish={onFinish}
      slug={slug}
      onAnswered={onAnswered}
      revealOnce={revealOnce}
      revealNext={revealNext}
    >
      {visible > 0 && (
        <EmailThread
          messages={scenario.messages}
          visible={visible}
          tab={tab}
          onTab={setTab}
        />
      )}
    </ReadingScenario>
  );
}
