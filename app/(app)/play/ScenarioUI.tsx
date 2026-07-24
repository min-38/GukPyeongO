"use client";

import { type ScenarioStage } from "@/app/lib/useScenario";

// 유형 공용 UI — 상단바(진행도·타이머)와 하단 답변 패널(선택지·정답 공개·점수팝).
// 표면(회사 메신저·커뮤니티)은 콘텐츠 영역만 각자 그리고 이 둘을 감싼다.

export function ScenarioTopBar({
  label,
  stepIndex,
  total,
  stage,
  remaining,
}: {
  label: string;
  stepIndex: number;
  total: number;
  stage: ScenarioStage;
  remaining: number;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between">
      <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold tabular-nums">
          {stepIndex + 1}
          <span className="text-muted"> / {total}</span>
        </span>
        {stage === "answering" && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
              remaining <= 5
                ? "animate-pulse bg-red-500 text-white"
                : "bg-surface-muted text-foreground"
            }`}
          >
            ⏱ {remaining}s
          </span>
        )}
      </div>
    </div>
  );
}

export function AnswerPanel({
  prompt,
  choices,
  answerIndex,
  stage,
  picked,
  correct,
  scorePop,
  onAnswer,
}: {
  prompt: string;
  choices: string[];
  answerIndex: number;
  stage: ScenarioStage;
  picked: number | null;
  correct: boolean;
  scorePop: number | null;
  onAnswer: (choiceIndex: number) => void;
}) {
  return (
    <div className="relative mt-4 shrink-0 pb-1 pt-2">
      {scorePop !== null && (
        <span className="animate-score-pop pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-lg font-extrabold text-emerald-500">
          +{scorePop}점
        </span>
      )}

      {stage === "answering" && (
        <>
          <p className="mb-3 text-center text-sm font-medium text-muted">
            {prompt}
          </p>
          <div className="flex flex-col gap-2">
            {choices.map((choice, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onAnswer(i)}
                className="w-full rounded-2xl border-2 border-border px-4 py-4 text-left text-[15px] font-medium transition-all hover:bg-surface-muted active:scale-[0.99]"
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 정답 공개: 정답=초록, 내 오답 선택=빨강. 무응답(picked=null)이어도 정답은 알려준다. */}
      {stage === "answered" && (
        <div className="flex flex-col gap-2">
          {choices.map((choice, i) => {
            const isAnswer = i === answerIndex;
            const isWrongPick = i === picked && !correct;
            return (
              <div
                key={i}
                className={`w-full rounded-2xl border-2 px-4 py-3 text-[15px] ${
                  isAnswer
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                    : isWrongPick
                      ? "border-red-500 text-red-700 dark:text-red-300"
                      : "border-border text-muted opacity-60"
                }`}
              >
                {choice}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
