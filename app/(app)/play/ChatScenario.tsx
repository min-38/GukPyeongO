"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { type ChatScenario, dateMark, showsTime } from "@/app/lib/chat-scenario";
import { readMs, scheduleTyping } from "@/app/lib/scenario-pacing";
import { playMessagePop, playSendPop } from "@/app/lib/sfx";
import { type AnswerResult, type OnAnswered, useScenario } from "@/app/lib/useScenario";

import { AnswerPanel, ScenarioTopBar, SkipReadButton } from "./ScenarioUI";
import { type Bubble, ChatBubble, DateDivider } from "./SurfaceCards";

const OPENING_DELAY_MS = 500; // 화면 진입 후 첫 메시지까지
const REPLY_BEAT_MS = 500; // 내 답장이 눈에 들어온 뒤 상대가 반응하기까지

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
  label,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: ChatScenario;
  // 상단바 이름 — 유형에서 온다(#99).
  label: string;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: OnAnswered;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);

  // 날짜 구분선은 문항이 시작하는 순간 바로 찍는다 — 첫 말풍선을 기다렸다 같이 나오면
  // 날이 바뀐 걸 대사와 함께 읽게 된다. 몇 번째 말풍선 앞자리인지로 위치를 기억한다.
  const [dividers, setDividers] = useState<Record<number, string>>({});
  const count = useRef(0);
  const addBubble = (b: Bubble) => {
    count.current += 1;
    setBubbles((prev) => [...prev, b]);
  };

  // 맥락 대사를 하나씩 타이핑 연출로 등장시킨 뒤 선택지를 연다.
  const reveal = (
    step: ChatScenario["steps"][number],
    index: number,
    open: () => void,
  ) => {
    const timers: number[] = [];
    const mark = dateMark(scenario.steps, index);
    if (mark) setDividers((d) => ({ ...d, [count.current]: mark }));
    let at = OPENING_DELAY_MS;
    step.context.forEach((msg) => {
      // 내가 이미 한 말은 타이핑 연출 없이 바로 나간다 — 내 손이 친 것이므로.
      if (msg.mine) {
        const shownAt = at + REPLY_BEAT_MS;
        timers.push(
          window.setTimeout(() => {
            playSendPop();
            addBubble({
              side: "me",
              speaker: "나",
              text: msg.text,
              at: msg.at,
            });
          }, shownAt),
        );
        at = shownAt + readMs(msg.text);
        return;
      }
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
    // 반응 화자를 따로 적었으면 그 사람이 답한다. 안 적었으면 지문의 상대 화자.
    const reactSpeaker =
      (choiceIndex === null
        ? step.reactTimeoutSpeaker
        : isCorrect
          ? step.reactCorrectSpeaker
          : step.reactWrongSpeaker) || scenario.speaker;
    const shownAt = scheduleTyping(
      timers,
      REPLY_BEAT_MS,
      reactText,
      setTyping,
      () => {
        playMessagePop();
        addBubble({
          side: "them",
          speaker: reactSpeaker,
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
  }, [bubbles, dividers, typing, s.stage, s.picked]);

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

      {/* 대화 영역 — 시나리오 내내 누적. 여기만 스크롤(스크롤바 감춤). */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {bubbles.map((b, i) => {
          const prev = bubbles[i - 1];
          return (
            <Fragment key={i}>
              {dividers[i] && <DateDivider date={dividers[i]} />}
              <ChatBubble
                bubble={b}
                // 날이 바뀌었으면 이름·프로필을 다시 보여준다.
                grouped={
                  !dividers[i] &&
                  prev?.side === b.side &&
                  prev?.speaker === b.speaker
                }
                timed={showsTime(bubbles, i)}
              />
            </Fragment>
          );
        })}
        {/* 아직 그 날의 첫 말풍선이 오기 전 — 날짜만 먼저 서 있다. */}
        {dividers[bubbles.length] && (
          <DateDivider date={dividers[bubbles.length]} />
        )}
        {typing && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <SkipReadButton readLeft={s.readLeft} onSkip={s.skipRead} />

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
