"use client";

import { useState } from "react";

import { type ScenarioStage } from "@/app/lib/useScenario";

// 유형 공용 UI — 상단바(진행도·타이머)와 하단 답변 패널(선택지·정답 공개·점수팝).
// 표면(회사 메신저·커뮤니티)은 콘텐츠 영역만 각자 그리고 이 둘을 감싼다.

export function ScenarioTopBar({
  label,
  stepIndex,
  total,
  stage,
  remaining,
  readLeft,
  onSkipRead,
}: {
  label: string;
  stepIndex: number;
  total: number;
  stage: ScenarioStage;
  // null = 제한시간 없음(튜토리얼 예시) — 타이머를 아예 감춘다.
  remaining: number | null;
  // 지문을 훑는 동안 남은 초(#99). 누르면 남은 연출을 건너뛰고 바로 문제로 간다.
  readLeft?: number | null;
  onSkipRead?: () => void;
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
        {/* 읽는 시간 — 누르면 건너뛴다. */}
        {stage === "replaying" &&
          readLeft !== null &&
          readLeft !== undefined && (
            <button
              type="button"
              onClick={onSkipRead}
              aria-label="다 읽었어요 — 문제로 넘어가기"
              className="group grid place-items-center rounded-full bg-surface-muted px-3 py-1 text-sm font-bold tabular-nums text-foreground transition-colors hover:bg-red-500 hover:text-white active:scale-95"
            >
              {/* 두 글자를 같은 칸에 겹쳐 둔다 — 안 그러면 호버할 때 알약 폭이 줄어든다. */}
              <span className="col-start-1 row-start-1 group-hover:invisible">
                📖 {readLeft}s
              </span>
              <span className="invisible col-start-1 row-start-1 group-hover:visible">
                스킵
              </span>
            </button>
          )}

        {/* 제한시간 — 답을 고르면 멈춘 채로 남는다(#99). 사라지면 몇 초에 풀었는지 알 수 없다. */}
        {(stage === "answering" || stage === "answered") &&
          remaining !== null && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
                stage === "answering" && remaining <= 5
                  ? "animate-pulse bg-red-500 text-white"
                  : "bg-surface-muted text-foreground"
              } ${stage === "answered" ? "opacity-60" : ""}`}
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
  collapsible = true,
}: {
  prompt: string;
  choices: string[];
  answerIndex: number;
  stage: ScenarioStage;
  picked: number | null;
  correct: boolean;
  scorePop: number | null;
  onAnswer: (choiceIndex: number) => void;
  // 문제 다시 보기에서는 접기를 안 쓴다(#99) — 지문과 답을 함께 보는 화면이라 접을 일이 없다.
  collapsible?: boolean;
}) {
  // 모바일에서는 선택지가 화면을 반쯤 먹어 지문을 훑기 어렵다. 접으면 질문만 남는다(#99).
  // 데스크톱은 지문과 선택지가 나란히 들어가므로 항상 펼친 채로 둔다.
  const [collapsed, setCollapsed] = useState(false);
  const hidden = collapsible && collapsed;

  return (
    <div className="relative mt-4 shrink-0 pb-1 pt-2">
      {scorePop !== null && (
        <span className="animate-score-pop pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-lg font-extrabold text-emerald-500">
          +{scorePop}점
        </span>
      )}

      {/* 문제는 답 고른 뒤(정답 공개)에도 그대로 둔다 — 뭘 물었는지 보며 정답을 확인하게. */}
      {(stage === "answering" || stage === "answered") && (
        <div className="relative mb-3">
          {/* 질문은 왼쪽 맞춤 — 두 줄이 되면 가운데 맞춤은 줄머리가 어긋나 읽기 나쁘다.
              오른쪽만 비워 둔다. 질문 길이가 달라져도 접기 자리는 안 움직인다. */}
          <p className="pr-8 text-sm font-medium text-muted">{prompt}</p>
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "선택지 펼치기" : "선택지 접기"}
              className="absolute right-0 top-0 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-surface-muted lg:hidden"
            >
              {/* 같은 그림을 뒤집어 쓴다 — ▴▾ 글자는 폰트마다 크기가 달라 접기/펴기가 짝이 안 맞는다. */}
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
      )}

      {stage === "answering" && (
        <div className={`flex-col gap-2 ${hidden ? "hidden lg:flex" : "flex"}`}>
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
      )}

      {/* 정답 공개: 정답=초록, 내 오답 선택=빨강. 무응답(picked=null)이어도 정답은 알려준다.
          테두리로 소리치지 않고 배경을 옅게 깔아 표시한다. 고르기 전과 칸 크기가 같아야
          정답이 열릴 때 목록이 흔들리지 않는다 — 테두리 두께와 여백을 그대로 맞춘다. */}
      {stage === "answered" && (
        <div className={`flex-col gap-2 ${hidden ? "hidden lg:flex" : "flex"}`}>
          {choices.map((choice, i) => {
            const isAnswer = i === answerIndex;
            const isWrongPick = i === picked && !correct;
            return (
              <div
                key={i}
                className={`w-full rounded-2xl border-2 px-4 py-4 text-[15px] font-medium ${
                  isAnswer
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : isWrongPick
                      ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
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
