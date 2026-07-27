"use client";

import { useRef, useState } from "react";

import { playMessagePop } from "@/app/lib/sfx";
import { type StoryScenario } from "@/app/lib/story-scenario";

import ReadingScenario from "./ReadingScenario";

const OPENING_DELAY_MS = 400;

export default function StoryScenarioView({
  scenario,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: StoryScenario;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
}) {
  const [shown, setShown] = useState(false);
  // 읽는 단계. 남은 시간이 0이 되거나 다 읽었다고 누르면 문제로 넘어간다.
  const [reading, setReading] = useState(false);
  const [left, setLeft] = useState(scenario.readSec);
  // 조기 시작 버튼이 호출할 첫 문제 열기 함수.
  const startRef = useRef<(() => void) | null>(null);

  // 긴 지문이라 공용 readMs(상한 2.6초)를 쓰지 않고 읽기 시간을 따로 준다.
  const revealOnce = (open: () => void) => {
    const timers: number[] = [];
    let ticker = 0;

    const toQuestions = () => {
      timers.forEach(clearTimeout);
      window.clearInterval(ticker);
      startRef.current = null;
      setReading(false);
      open();
    };
    startRef.current = toQuestions;

    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        setShown(true);
        setReading(true);
        ticker = window.setInterval(
          () => setLeft((n) => Math.max(0, n - 1)),
          1000,
        );
      }, OPENING_DELAY_MS),
    );
    timers.push(
      window.setTimeout(
        toQuestions,
        OPENING_DELAY_MS + scenario.readSec * 1000,
      ),
    );

    return () => {
      timers.forEach(clearTimeout);
      window.clearInterval(ticker);
      startRef.current = null;
    };
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
      {shown && (
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
      )}

      {/* 문제가 시작되면 사라진다. 지문은 그대로 남아 계속 대조할 수 있다. */}
      {reading && (
        <div className="flex shrink-0 items-center gap-3 pb-1">
          <p className="text-[13px] tabular-nums text-muted">
            읽는 시간 {left}초
          </p>
          <button
            type="button"
            onClick={() => startRef.current?.()}
            className="ml-auto rounded-2xl border-2 border-border px-4 py-2 text-sm font-bold transition-all hover:bg-surface-muted active:scale-[0.99]"
          >
            다 읽었어요
          </button>
        </div>
      )}
    </ReadingScenario>
  );
}
