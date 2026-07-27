"use client";

import { type ReactNode } from "react";

import { type ScenarioStep, useScenario } from "@/app/lib/useScenario";

import { AnswerPanel, ScenarioTopBar } from "./ScenarioUI";

// 읽기형 유형(커뮤니티·문서) 공용 골격.
// 콘텐츠(게시물·문서)를 처음에 한 번 보여주고, 이후 스텝은 문제만 바꾼다.
// 진행·타이머·점수·정답공개(useScenario/ScenarioUI)와 레이아웃·respond를 여기 모으고,
// 표면은 "콘텐츠를 어떻게 등장시키고(revealOnce) 어떻게 그리는지(children)"만 담당한다.

export const NEXT_STEP_OPEN_MS = 400; // 문제만 바뀔 때 선택지 여는 딜레이
const REVEAL_HOLD_MS = 1800; // 답 후 정답 공개를 읽을 시간

type ReadingStep = ScenarioStep & { prompt: string; choices: string[] };

export default function ReadingScenario<S extends ReadingStep>({
  label,
  steps,
  onFinish,
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug,
  onAnswered,
  // 첫 스텝에서 콘텐츠를 1회 등장시킨다. 다 보여준 뒤 open()을 호출. 정리 함수 반환.
  revealOnce,
  revealNext,
  children,
}: {
  label: string;
  steps: S[];
  onFinish: (score: number) => void;
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
  revealOnce: (open: () => void) => () => void;
  // 2번째 스텝부터 콘텐츠를 더 여는 유형(이메일)만 넘긴다. 없으면 문제만 바뀐다.
  revealNext?: (step: S, index: number, open: () => void) => () => void;
  children: ReactNode;
}) {
  const reveal = (step: S, index: number, open: () => void) => {
    if (index === 0) return revealOnce(open);
    if (revealNext) return revealNext(step, index, open);
    // 콘텐츠는 이미 다 떠 있다 — 문제만 바뀐다.
    const t = window.setTimeout(open, NEXT_STEP_OPEN_MS);
    return () => clearTimeout(t);
  };

  // 답 후엔 콘텐츠를 건드리지 않고 정답 공개(선택지 색)만 잠깐 보여준 뒤 다음 문제로.
  const respond = (_step: S, _result: unknown, next: () => void) => {
    const t = window.setTimeout(next, REVEAL_HOLD_MS);
    return () => clearTimeout(t);
  };

  const s = useScenario({
    steps,
    onFinish,
    slug,
    onAnswered,
    reveal,
    respond,
  });
  const { step } = s;

  return (
    <div className="flex h-full min-h-0 w-full flex-col lg:mx-auto lg:max-w-xl">
      <ScenarioTopBar
        label={label}
        stepIndex={s.stepIndex}
        total={s.total}
        stage={s.stage}
        remaining={s.remaining}
      />

      {/* 콘텐츠 영역 — 여기만 스크롤(스크롤바 감춤). 위에서부터 읽으므로 자동스크롤 없음. */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>

      <AnswerPanel
        prompt={step.prompt}
        choices={step.choices}
        answerIndex={s.answerIndex}
        stage={s.stage}
        picked={s.picked}
        correct={s.correct}
        scorePop={s.scorePop}
        onAnswer={s.answer}
      />
    </div>
  );
}
