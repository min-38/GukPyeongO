"use client";

import { useState } from "react";

import { type DocScenario } from "@/app/lib/doc-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario from "./ReadingScenario";

const OPENING_DELAY_MS = 400;

function DocCard({
  source,
  title,
  body,
}: {
  source: string;
  title: string;
  body: string[];
}) {
  return (
    <div className="animate-rise rounded-2xl border border-border bg-surface-muted/40 p-4">
      <p className="text-xs font-medium text-brand">{source}</p>
      <h2 className="mt-1 text-lg font-bold leading-snug">{title}</h2>
      <div className="mt-3 flex flex-col gap-2 text-[15px] leading-relaxed">
        {body.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export default function DocScenarioView({
  scenario,
  onFinish,
}: {
  scenario: DocScenario;
  onFinish: (score: number) => void;
}) {
  const [docShown, setDocShown] = useState(false);

  // 문서는 처음에 한 번 등장. 훑을 시간을 준 뒤 첫 문제를 연다.
  const revealOnce = (open: () => void) => {
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        setDocShown(true);
      }, OPENING_DELAY_MS)
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
