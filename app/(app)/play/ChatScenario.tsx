"use client";

import { useEffect, useRef, useState } from "react";

import { type ChatScenario, showsTime } from "@/app/lib/chat-scenario";
import { readMs, scheduleTyping } from "@/app/lib/scenario-pacing";
import { playMessagePop, playSendPop } from "@/app/lib/sfx";
import { type AnswerResult, useScenario } from "@/app/lib/useScenario";

import { AnswerPanel, ScenarioTopBar } from "./ScenarioUI";

// 화면에 쌓이는 말풍선. 한 시나리오 동안 계속 누적된다.
type Bubble = {
  side: "them" | "me";
  speaker: string;
  text: string;
  at?: string; // 보낸 시각. 묶음의 마지막 줄에만 보인다(showsTime).
  // 반응 대사의 정답/오답 톤. 대화가 누적되므로 색은 말풍선에 고정해
  // 다음 문제로 넘어가도 과거 말풍선 색이 바뀌지 않게 한다.
  tone?: "correct" | "wrong";
};

const OPENING_DELAY_MS = 500; // 화면 진입 후 첫 메시지까지
const REPLY_BEAT_MS = 500; // 내 답장이 눈에 들어온 뒤 상대가 반응하기까지

const TIME = "shrink-0 text-[11px] text-muted";

// 같은 사람이 연달아 보내면 이름과 프로필을 다시 보여주지 않는다 — 실제 메신저와 같게.
// 시각은 반대쪽 끝, 묶음의 마지막 줄에만 붙는다.
function ChatBubble({
  bubble,
  grouped,
  timed,
}: {
  bubble: Bubble;
  grouped: boolean;
  timed: boolean;
}) {
  if (bubble.side === "me") {
    return (
      <div
        className={`animate-rise flex flex-col items-end gap-1 ${grouped ? "" : "mt-2"}`}
      >
        {!grouped && (
          <span className="text-xs text-muted">{bubble.speaker}</span>
        )}
        <div className="flex items-end gap-1.5">
          {timed && <span className={TIME}>{bubble.at}</span>}
          <p className="max-w-[16rem] rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5 text-[15px] font-medium text-brand-foreground">
            {bubble.text}
          </p>
        </div>
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
    <div
      className={`animate-rise flex items-end gap-2 ${grouped ? "" : "mt-2"}`}
    >
      {grouped ? (
        // 자리는 남겨야 말풍선이 좌우로 흔들리지 않는다.
        <div className="h-8 w-8 shrink-0" />
      ) : (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand">
          {bubble.speaker.slice(0, 1)}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {!grouped && (
          <span className="text-xs text-muted">{bubble.speaker}</span>
        )}
        <div className="flex items-end gap-1.5">
          <p
            className={`max-w-[16rem] rounded-2xl rounded-tl-sm px-4 py-2.5 text-[15px] ${toneClass}`}
          >
            {bubble.text}
          </p>
          {timed && <span className={TIME}>{bubble.at}</span>}
        </div>
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
  slug,
  onAnswered,
}: {
  scenario: ChatScenario;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);

  const addBubble = (b: Bubble) => setBubbles((prev) => [...prev, b]);

  // 맥락 대사를 하나씩 타이핑 연출로 등장시킨 뒤 선택지를 연다.
  const reveal = (
    step: ChatScenario["steps"][number],
    _index: number,
    open: () => void,
  ) => {
    const timers: number[] = [];
    let at = OPENING_DELAY_MS;
    step.context.forEach((msg) => {
      const shownAt = scheduleTyping(timers, at, msg.text, setTyping, () => {
        playMessagePop();
        addBubble({
          side: "them",
          speaker: msg.speaker,
          text: msg.text,
          at: msg.at,
        });
      });
      at = shownAt + readMs(msg.text);
    });
    timers.push(window.setTimeout(open, at));
    return () => timers.forEach(clearTimeout);
  };

  // 내 답장을 말풍선으로 보내고, 상대 반응을 같은 리듬으로 등장시킨 뒤 다음으로.
  const respond = (
    step: ChatScenario["steps"][number],
    { choiceIndex, isCorrect }: AnswerResult,
    next: () => void,
  ) => {
    const timers: number[] = [];
    if (choiceIndex !== null) {
      playSendPop();
      addBubble({
        side: "me",
        speaker: "나",
        text: step.choices[choiceIndex],
        at: step.at,
      });
    }
    // 무응답(시간 초과)은 오답과 상황이 달라 전용 대사를 쓴다.
    const reactText =
      choiceIndex === null
        ? step.reactTimeout
        : isCorrect
          ? step.reactCorrect
          : step.reactWrong;
    const shownAt = scheduleTyping(
      timers,
      REPLY_BEAT_MS,
      reactText,
      setTyping,
      () => {
        playMessagePop();
        addBubble({
          side: "them",
          speaker: scenario.speaker,
          text: reactText,
          at: step.at,
          tone: isCorrect ? "correct" : "wrong",
        });
      },
    );
    timers.push(window.setTimeout(next, shownAt + readMs(reactText)));
    return () => timers.forEach(clearTimeout);
  };

  const s = useScenario({
    steps: scenario.steps,
    onFinish,
    slug,
    onAnswered,
    reveal,
    respond,
  });

  // 새 말풍선이 붙거나 하단 영역이 나타나고 사라질 때마다 맨 아래로 붙인다.
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, typing, s.stage, s.picked]);

  const { step } = s;

  return (
    <div className="flex h-full min-h-0 w-full flex-col lg:mx-auto lg:max-w-xl">
      <ScenarioTopBar
        label={scenario.roomTitle}
        stepIndex={s.stepIndex}
        total={s.total}
        stage={s.stage}
        remaining={s.remaining}
      />

      {/* 대화 영역 — 시나리오 내내 누적. 여기만 스크롤(스크롤바 감춤). */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {bubbles.map((b, i) => {
          const prev = bubbles[i - 1];
          return (
            <ChatBubble
              key={i}
              bubble={b}
              grouped={prev?.side === b.side && prev?.speaker === b.speaker}
              timed={showsTime(bubbles, i)}
            />
          );
        })}
        {typing && <TypingIndicator />}
        <div ref={endRef} />
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
