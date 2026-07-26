"use client";

import { useState } from "react";

import {
  type EmailMessage,
  type EmailScenario,
  type EmailStep,
} from "@/app/lib/email-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario, { NEXT_STEP_OPEN_MS } from "./ReadingScenario";

const OPENING_DELAY_MS = 400;

// 회신 한 통. 인용은 접어두고, 펼쳐서 원문과 대조하는 것 자체가 풀이 행위다.
function MessageCard({ msg }: { msg: EmailMessage }) {
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <div className="animate-rise flex gap-2 border-b border-border pb-3 last:border-b-0">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">
        {msg.from.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <p className="shrink-0 text-[13px] font-bold">{msg.from}</p>
          <p className="truncate text-[11px] text-muted">{msg.address}</p>
          <p className="ml-auto shrink-0 text-[11px] text-muted">{msg.at}</p>
        </div>
        <p className="text-[11px] text-muted">
          받는사람 {msg.to}
          {msg.cc ? ` · 참조 ${msg.cc}` : ""}
        </p>
        <div className="mt-2 flex flex-col gap-1 text-[15px] leading-relaxed">
          {msg.body.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        {msg.quote && (
          <>
            <button
              type="button"
              onClick={() => setQuoteOpen((v) => !v)}
              className="mt-2 rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-bold leading-5 text-muted"
              aria-expanded={quoteOpen}
              aria-label="인용된 원문 펼치기"
            >
              ···
            </button>
            {quoteOpen && (
              <div className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-3 text-[13px] leading-relaxed text-muted">
                {msg.quote.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function EmailScenarioView({
  scenario,
  onFinish,
  slug,
}: {
  scenario: EmailScenario;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
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
      revealOnce={revealOnce}
      revealNext={revealNext}
    >
      {visible > 0 && (
        // 다른 유형(공지·신문·커뮤니티)의 첫 카드와 같은 표면 — 광고 아래 여백이 같아 보이도록.
        <div className="animate-rise flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted/40 p-4">
          <h2 className="text-lg font-bold leading-snug">{scenario.subject}</h2>
          {scenario.layout === "toggle" ? (
            <>
              <div className="flex gap-2">
                {scenario.messages.slice(0, visible).map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTab(i)}
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      i === tab
                        ? "bg-brand text-white"
                        : "bg-surface-muted text-muted"
                    }`}
                  >
                    {i === 0 ? "원문" : "답장"}
                  </button>
                ))}
              </div>
              <MessageCard key={tab} msg={scenario.messages[tab]} />
            </>
          ) : (
            scenario.messages
              .slice(0, visible)
              .map((msg, i) => <MessageCard key={i} msg={msg} />)
          )}
        </div>
      )}
    </ReadingScenario>
  );
}
