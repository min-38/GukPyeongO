"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  POINTS_BY_DIFFICULTY,
  type MockScenario,
} from "@/app/lib/mock-questions";
import { playMessagePop, playSendPop } from "@/app/lib/sfx";

// 화면에 쌓이는 말풍선. 한 시나리오 동안 계속 누적된다.
type Bubble = {
  side: "them" | "me";
  speaker: string;
  text: string;
  // 반응 대사의 정답/오답 톤. 대화가 누적되므로 색은 말풍선에 고정해
  // 다음 문제로 넘어가도 과거 말풍선 색이 바뀌지 않게 한다.
  tone?: "correct" | "wrong";
};

//  replaying  : 맥락 대사 순차 재생 중
//  answering  : 선택지 노출 + 타이머
//  answered   : 답 선택 후 반응 → 잠시 뒤 다음 문제로 자동 진행
type Stage = "replaying" | "answering" | "answered";

const clamp = (min: number, v: number, max: number) =>
  Math.min(max, Math.max(min, v));

// 대사 길이에 비례해 재생 속도를 조절한다. 긴 메시지일수록
//  · 상대가 타이핑하는 시간이 길고
//  · 읽을 시간을 더 준다 (다음 말풍선까지의 간격)
const typingMs = (text: string) => clamp(700, text.length * 45, 1500);
const readMs = (text: string) => clamp(900, text.length * 60, 2600);

const OPENING_DELAY_MS = 500; // 화면 진입 후 첫 메시지까지
const REPLY_BEAT_MS = 500; // 내 답장이 눈에 들어온 뒤 상대가 반응하기까지
const SCORE_POP_MS = 1000; // 점수 애니메이션 길이 (globals.css의 score-pop과 동일)

// 상대 메시지 한 개의 등장 연출을 예약한다: 타이핑 인디케이터 → 도착음 → 말풍선.
// 말풍선이 실제로 뜨는 시각(ms)을 돌려줘 다음 예약의 기준으로 쓴다.
function scheduleIncoming(
  timers: number[],
  startAt: number,
  bubble: Bubble,
  setTyping: (v: boolean) => void,
  addBubble: (b: Bubble) => void
): number {
  timers.push(window.setTimeout(() => setTyping(true), startAt));
  const shownAt = startAt + typingMs(bubble.text);
  timers.push(
    window.setTimeout(() => {
      setTyping(false);
      playMessagePop();
      addBubble(bubble);
    }, shownAt)
  );
  return shownAt;
}

function ChatBubble({ bubble }: { bubble: Bubble }) {
  if (bubble.side === "me") {
    return (
      <div className="animate-rise flex flex-col items-end gap-1">
        <span className="text-xs text-muted">{bubble.speaker}</span>
        <p className="max-w-[16rem] rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5 text-[15px] font-medium text-brand-foreground">
          {bubble.text}
        </p>
      </div>
    );
  }

  const toneClass =
    bubble.tone === "correct"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : bubble.tone === "wrong"
        ? "bg-red-500/15 text-red-700 dark:text-red-300"
        : "bg-surface-muted text-foreground";

  return (
    <div className="animate-rise flex items-end gap-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand">
        {bubble.speaker.slice(0, 1)}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">{bubble.speaker}</span>
        <p
          className={`max-w-[16rem] rounded-2xl rounded-tl-sm px-4 py-2.5 text-[15px] ${toneClass}`}
        >
          {bubble.text}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-8 w-8 shrink-0 rounded-full bg-brand/20" />
      <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
      </div>
    </div>
  );
}

export default function ChatScenario({
  scenario,
  onFinish,
}: {
  scenario: MockScenario;
  onFinish: (score: number) => void;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("replaying");
  const [remaining, setRemaining] = useState(scenario.steps[0].timeLimitSec);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(false);
  const [scorePop, setScorePop] = useState<number | null>(null);

  const lockRef = useRef(false);
  const scoreRef = useRef(0);
  // 답변 후 예약된 타이머(타이핑·반응·다음 진행) — 언마운트 시 정리
  const timersRef = useRef<number[]>([]);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const addBubble = useCallback(
    (b: Bubble) => setBubbles((prev) => [...prev, b]),
    []
  );

  const step = scenario.steps[stepIndex];
  const total = scenario.steps.length;

  const handleAnswer = useCallback(
    (choiceIndex: number | null) => {
      if (lockRef.current) return;
      lockRef.current = true;

      const isCorrect = choiceIndex === step.answerIndex;
      const gained = isCorrect ? POINTS_BY_DIFFICULTY[step.difficulty] : 0;
      scoreRef.current += gained;

      if (choiceIndex !== null) {
        playSendPop();
        addBubble({ side: "me", speaker: "나", text: step.choices[choiceIndex] });
      }
      setPicked(choiceIndex);
      setCorrect(isCorrect);
      setStage("answered");

      if (!isCorrect && typeof navigator !== "undefined") {
        navigator.vibrate?.(80); // 햅틱: 오답 시 1회
      }

      const timers: number[] = [];
      if (isCorrect) {
        setScorePop(gained);
        // 떠올랐다 사라진 뒤 제거
        timers.push(window.setTimeout(() => setScorePop(null), SCORE_POP_MS));
      }

      // 무응답(시간 초과)은 오답과 상황이 달라 전용 대사를 쓴다.
      const reactText =
        choiceIndex === null
          ? step.reactTimeout
          : isCorrect
            ? step.reactCorrect
            : step.reactWrong;

      // 상대 반응도 맥락 대사와 같은 리듬으로 등장시킨다.
      const shownAt = scheduleIncoming(
        timers,
        REPLY_BEAT_MS,
        {
          side: "them",
          speaker: scenario.speaker,
          text: reactText,
          tone: isCorrect ? "correct" : "wrong",
        },
        setTyping,
        addBubble
      );

      // 반응을 읽을 시간을 준 뒤, 끊김 없이 다음 문제로 이어진다.
      const isLast = stepIndex + 1 >= total;
      timers.push(
        window.setTimeout(() => {
          if (isLast) {
            onFinish(scoreRef.current);
            return;
          }
          lockRef.current = false;
          setStage("replaying"); // 정답 공개는 다음 선택지가 뜰 때까지 유지
          setStepIndex((i) => i + 1);
        }, shownAt + readMs(reactText))
      );

      timersRef.current = timers; // 이전 문제의 타이머는 이미 끝났으므로 교체
    },
    [step, stepIndex, total, scenario.speaker, onFinish, addBubble]
  );

  // 현재 문제의 맥락 대사를 이어붙인 뒤 선택지를 연다. (기존 말풍선은 유지)
  useEffect(() => {
    const timers: number[] = [];
    let at = OPENING_DELAY_MS;
    step.context.forEach((msg) => {
      const shownAt = scheduleIncoming(
        timers,
        at,
        { side: "them", speaker: msg.speaker, text: msg.text },
        setTyping,
        addBubble
      );
      at = shownAt + readMs(msg.text);
    });
    timers.push(
      window.setTimeout(() => {
        // 선택지가 뜨는 시점에 이전 문제의 정답 공개를 걷어낸다
        setPicked(null);
        setCorrect(false);
        setRemaining(step.timeLimitSec);
        setStage("answering");
      }, at)
    );
    return () => timers.forEach(clearTimeout);
  }, [step, addBubble]);

  // 제한시간 타이머 — 카운트다운 + 시간초과 시 오답 처리.
  useEffect(() => {
    if (stage !== "answering") return;
    let left = step.timeLimitSec;
    const tick = setInterval(() => {
      left -= 1;
      setRemaining(left > 0 ? left : 0);
    }, 1000);
    const deadline = window.setTimeout(
      () => handleAnswer(null),
      step.timeLimitSec * 1000
    );
    return () => {
      clearInterval(tick);
      clearTimeout(deadline);
    };
  }, [stage, step.timeLimitSec, handleAnswer]);

  // 새 말풍선이 붙거나 하단 영역(선택지·정답 공개)이 나타나고 사라질 때마다
  // 맨 아래로 붙인다. 하단이 커지면 대화 영역이 줄어드는데, 이때 다시 스크롤하지
  // 않으면 마지막 메시지가 위로 밀려 유저가 직접 내려야 한다.
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, typing, stage, picked]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col lg:mx-auto lg:max-w-xl">
      {/* 상단바: 방 제목 · 진행도 · 타이머 */}
      <div className="flex shrink-0 items-center justify-between">
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold">
          {scenario.roomTitle}
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

      {/* 대화 영역 — 시나리오 내내 누적. 페이지 대신 여기만 스크롤되고,
          스크롤바는 감춘다. */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {bubbles.map((b, i) => (
          <ChatBubble key={i} bubble={b} />
        ))}
        {typing && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* 하단: 선택지 / 정답 공개. 대화 영역과 겹치지 않게 흐름에 고정된 별도 칸.
          메시지 재생 중에는 비워 둔다(다음 문제 선택지가 뜰 때까지). */}
      <div className="relative mt-4 shrink-0 pb-1 pt-2">
        {scorePop !== null && (
          <span className="animate-score-pop pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-lg font-extrabold text-emerald-500">
            +{scorePop}점
          </span>
        )}

        {stage === "answering" && (
          <>
            <p className="mb-3 text-center text-sm font-medium text-muted">
              {step.prompt}
            </p>
            <div className="flex flex-col gap-2">
              {step.choices.map((choice, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAnswer(i)}
                  className="w-full rounded-2xl border-2 border-border px-4 py-4 text-left text-[15px] font-medium transition-all hover:bg-surface-muted active:scale-[0.99]"
                >
                  {choice}
                </button>
              ))}
            </div>
          </>
        )}

        {/* 정답 공개: 정답=초록, 내 오답 선택=빨강.
            무응답(picked=null)이어도 정답은 알려준다. */}
        {stage === "answered" && (
          <div className="flex flex-col gap-2">
            {step.choices.map((choice, i) => {
              const isAnswer = i === step.answerIndex;
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
    </div>
  );
}
