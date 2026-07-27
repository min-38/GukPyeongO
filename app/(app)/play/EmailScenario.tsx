"use client";

import { useState } from "react";

import {
  type EmailScenario,
  type EmailStep,
} from "@/app/lib/email-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario, { NEXT_STEP_OPEN_MS } from "./ReadingScenario";
import { EmailThread } from "./SurfaceCards";

const OPENING_DELAY_MS = 400;

export default function EmailScenarioView({
  scenario,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: EmailScenario;
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
  const readMsFor = (from: number, to: number) =>
    readMs(
      scenario.messages
        .slice(from, to)
        .map((m) => m.body.join(" "))
        .join(" "),
    );

  const openUpTo = (to: number, from: number, open: () => void) => {
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        setVisible(to);
        setTab(to - 1); // 새로 온 메일을 펴서 보여준다
      }, OPENING_DELAY_MS),
    );
    timers.push(
      window.setTimeout(open, OPENING_DELAY_MS + readMsFor(from, to)),
    );
    return () => timers.forEach(clearTimeout);
  };

  const revealOnce = (open: () => void) =>
    openUpTo(targetOf(scenario.steps[0]), 0, open);

  // 답장이 새로 열리는 스텝에서만 읽을 시간을 준다. 아니면 문제만 바뀐다.
  const revealNext = (step: EmailStep, _index: number, open: () => void) => {
    const to = targetOf(step);
    if (to <= visible) {
      const t = window.setTimeout(open, NEXT_STEP_OPEN_MS);
      return () => clearTimeout(t);
    }
    return openUpTo(to, visible, open);
  };

  return (
    <ReadingScenario
      label={scenario.sourceLabel}
      steps={scenario.steps}
      onFinish={onFinish}
      slug={slug}
      onAnswered={onAnswered}
      revealOnce={revealOnce}
      revealNext={revealNext}
    >
      {visible > 0 && (
        <EmailThread
          subject={scenario.subject}
          messages={scenario.messages}
          layout={scenario.layout}
          visible={visible}
          tab={tab}
          onTab={setTab}
        />
      )}
    </ReadingScenario>
  );
}
