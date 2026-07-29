"use client";

import Link from "next/link";
import { useState } from "react";

import { type ContextMessage, showsTime } from "@/app/lib/chat-scenario";
import { type EmailMessage } from "@/app/lib/email-scenario";
import {
  SCENARIO_KIND_TITLES,
  type ScenarioKind,
} from "@/app/lib/scenario-admin";

import { AnswerPanel } from "../../play/ScenarioUI";
import {
  type Bubble,
  ChatBubble,
  CommentRow,
  DocCard,
  EmailThread,
  HtmlBlock,
  PostCard,
} from "../../play/SurfaceCards";
import useStoredResult from "../useStoredResult";

import FeedbackSheet, { type Mode } from "./FeedbackSheet";

// 문제 다시 보기 (#96).
// 튜토리얼 없이 1번 문항부터 지문과 함께 보여주고 이전/다음으로 넘긴다.
// 보기의 초록·빨강 줄은 풀 때 쓰는 AnswerPanel을 그대로 쓴다 — 방금 본 화면과 같아야 알아본다.

// 서버가 넘겨주는 오늘 회차. 정답은 여기 없고(#83) 결과(sessionStorage)에서 온다.
export interface ReviewScenario {
  slug: string;
  kind: ScenarioKind;
  content: Record<string, unknown>;
}

interface Item {
  slug: string;
  stepKey: string;
  kind: ScenarioKind;
  label: string; // 상단바에 다는 이름. 풀 때 쓰던 라벨 그대로.
  content: Record<string, unknown>;
  bubbles: Bubble[]; // 메신저 전용 — 이 문항 시점까지 쌓인 대화
  showUpTo: number | null; // 이메일 전용 — 이 문항 시점에 열려 있던 메일 수
  prompt: string;
  choices: string[];
  answerIndex: number;
  picked: number | null;
}

// 맞음 / 틀림 / 못 품. 시간 초과나 이탈로 답을 못 낸 문항은 오답과 사정이 다르다.
function verdict(item: Item) {
  if (item.picked === null)
    return { label: "못 푼 문제", className: "bg-surface-muted text-muted" };
  if (item.picked === item.answerIndex)
    return {
      label: "맞은 문제",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    };
  return {
    label: "틀린 문제",
    className: "bg-red-500/15 text-red-700 dark:text-red-300",
  };
}

// 유형별 지문. 풀 때 쓰는 카드를 그대로 불러 쓴다.
function ScenarioBody({ item }: { item: Item }) {
  const c = item.content as {
    doc?: { source: string; title: string; body: string[] };
    post?: { author: string; title: string; body: string[] };
    comments?: { nick: string; text: string; reply?: boolean }[];
    postHtml?: string;
    commentsHtml?: string;
    messages?: EmailMessage[];
    subject?: string;
    source?: string;
    title?: string;
    body?: string[];
    html?: string;
  };

  switch (item.kind) {
    case "notice":
    case "news":
    case "contract":
    case "manual":
      return c.doc ? <DocCard {...c.doc} /> : null;
    case "story":
      return (
        <DocCard
          source={c.source ?? ""}
          title={c.title ?? ""}
          body={c.body ?? []}
          html={c.html}
        />
      );
    case "community":
      // HTML로 쓴 지문은 원글·댓글 두 덩어리로 그린다(#99). 옛 데이터는 예전 카드로.
      if (c.postHtml?.trim() || c.commentsHtml?.trim())
        return (
          <>
            {c.postHtml?.trim() && <HtmlBlock html={c.postHtml} card />}
            {c.commentsHtml?.trim() && <HtmlBlock html={c.commentsHtml} />}
          </>
        );
      return (
        <>
          {c.post && <PostCard {...c.post} />}
          {(c.comments ?? []).map((m, i) => (
            <CommentRow key={i} {...m} />
          ))}
        </>
      );
    case "email":
      return <EmailBody item={item} />;
    case "chat":
      // 대화는 문항마다 이어진다 — 다음으로 넘기면 아래에 계속 붙는다.
      return (
        <div className="flex flex-col gap-1.5">
          {item.bubbles.map((b, i) => {
            const prev = item.bubbles[i - 1];
            return (
              <ChatBubble
                key={i}
                bubble={b}
                grouped={prev?.side === b.side && prev?.speaker === b.speaker}
                timed={showsTime(item.bubbles, i)}
              />
            );
          })}
        </div>
      );
    default:
      return null;
  }
}


// 이메일은 문항이 진행되며 답장이 열린다(showUpTo). 다시 볼 때도 그 문항 시점까지만 펼친다.
// 탭 레이아웃은 마지막으로 열린 메일부터 보여준다 — 풀 때와 같다.
function EmailBody({ item }: { item: Item }) {
  const c = item.content as {
    subject?: string;
    messages?: EmailMessage[];
  };
  const messages = c.messages ?? [];
  const visible = item.showUpTo ?? messages.length;
  const [tab, setTab] = useState(Math.max(0, visible - 1));

  return (
    <EmailThread
      messages={messages}
      visible={visible}
      tab={Math.min(tab, visible - 1)}
      onTab={setTab}
    />
  );
}

// 메신저 대화 쌓기(#80). 문항마다 대사가 흩어져 있어 앞 문항의 대사와
// 내가 보낸 답장·상대 반응까지 이어 붙여야 풀 때 보던 화면이 된다.
function makeChatStacker() {
  const sofar = new Map<string, Bubble[]>();
  // 시나리오마다 화면에 마지막으로 찍은 날. 이것과 다른 날이면 구분선을 넣는다.
  const lastDate = new Map<string, string>();

  return (
    scenario: ReviewScenario,
    step: Record<string, unknown>,
    r: { slug: string; choiceIndex: number | null; answerIndex: number },
  ): Bubble[] => {
    // 이 문항에서 오간 대사 — 맥락 대사, 내 답장, 상대 반응. 다시 보는 사람은 이미 다 본 대화다.
    const added: Bubble[] = ((step.context ?? []) as ContextMessage[]).map(
      (m) => ({
        side: m.mine ? ("me" as const) : ("them" as const),
        speaker: m.mine ? "나" : m.speaker,
        text: m.text,
        at: m.at,
      }),
    );
    const at = step.at as string | undefined;
    const correct = r.choiceIndex === r.answerIndex;
    if (r.choiceIndex !== null) {
      added.push({
        side: "me",
        speaker: "나",
        text: (step.choices as string[])[r.choiceIndex],
        at,
      });
    }
    // 무응답은 오답과 상황이 달라 전용 대사를 쓴다(풀 때와 같은 규칙).
    const reactText = (r.choiceIndex === null
      ? step.reactTimeout
      : correct
        ? step.reactCorrect
        : step.reactWrong) as string | undefined;
    // 반응 화자를 따로 적은 문항이면 그 사람 이름으로 (풀 때와 같은 규칙).
    const reactSpeaker = ((r.choiceIndex === null
      ? step.reactTimeoutSpeaker
      : correct
        ? step.reactCorrectSpeaker
        : step.reactWrongSpeaker) ||
      scenario.content.speaker ||
      "") as string;
    if (reactText) {
      added.push({
        side: "them",
        speaker: reactSpeaker,
        text: reactText,
        at,
        tone: correct ? "correct" : "wrong",
      });
    }

    // 날이 바뀌었으면 이 문항의 첫 말풍선에 날짜를 달아 구분선을 세운다.
    const date = step.date as string | undefined;
    if (date && added[0] && date !== lastDate.get(r.slug)) {
      added[0] = { ...added[0], date };
    }
    if (date) lastDate.set(r.slug, date);

    const next = [...(sofar.get(r.slug) ?? []), ...added];
    sofar.set(r.slug, next);
    return next;
  };
}

export default function Review({
  scenarios,
}: {
  scenarios: ReviewScenario[];
}) {
  const result = useStoredResult();
  const [index, setIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  // 문항마다 이미 남긴 항의·평가. 시트를 접었다 펴도 다시 쓰지 않게 화면 쪽에서 기억한다
  // (새로고침하면 잊지만, 저장 쪽에서도 한 사람 한 줄로 묶어둔다).
  const [sent, setSent] = useState<Record<string, Record<Mode, boolean>>>({});

  // 서버가 준 지문·보기와 결과에 담긴 내 답을 문항 단위로 맞춘다.
  // 편성이 바뀌어 짝을 못 찾는 문항은 화면에서 뺀다 — 남의 지문에 내 답을 붙일 수는 없다.
  const chatBubbles = makeChatStacker();
  const items: Item[] = (result?.review ?? []).flatMap((r) => {
    const scenario = scenarios.find((s) => s.slug === r.slug);
    const steps = (scenario?.content.steps ?? []) as Record<string, unknown>[];
    const step = steps.find((s) => s.id === r.stepKey);
    if (!scenario || !step) return [];
    return [
      {
        slug: r.slug,
        stepKey: r.stepKey,
        kind: scenario.kind,
        label: SCENARIO_KIND_TITLES[scenario.kind],
        content: scenario.content,
        bubbles: chatBubbles(scenario, step, r),
        showUpTo: (step.showUpTo as number | undefined) ?? null,
        prompt: step.prompt as string,
        choices: step.choices as string[],
        answerIndex: r.answerIndex,
        picked: r.choiceIndex,
      },
    ];
  });

  // 저장소를 아직 못 읽었다 — 결과 없음 안내를 먼저 띄우지 않는다.
  if (result === undefined) {
    return <main className="flex flex-1" aria-busy />;
  }

  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-base font-medium text-muted">
          {result
            ? "이번 회차는 문항을 다시 볼 수 없어요."
            : "아직 응시한 결과가 없어요."}
        </p>
        <Link
          href={result ? "/result" : "/test"}
          className="flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-base font-bold text-brand-foreground"
        >
          {result ? "결과로 돌아가기" : "테스트 하러 가기"}
        </Link>
      </main>
    );
  }

  const item = items[Math.min(index, items.length - 1)];
  const mark = verdict(item);
  const last = index + 1 >= items.length;
  const itemKey = `${item.slug}:${item.stepKey}`;

  function go(to: number) {
    setSheetOpen(false);
    setIndex(Math.min(items.length - 1, Math.max(0, to)));
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-6 lg:mx-auto lg:w-full lg:max-w-xl lg:py-10">
      {/* 풀 때 보던 상단바와 같은 모양 — 왼쪽에 유형, 오른쪽에 진행도.
          타이머 자리에는 이 문항을 어떻게 풀었는지가 들어간다. */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="truncate rounded-full bg-surface-muted px-3 py-1 text-sm font-bold">
          {item.label}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold tabular-nums">
            {index + 1}
            <span className="text-muted"> / {items.length}</span>
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${mark.className}`}
          >
            {mark.label}
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            aria-label="이 문제에 항의하거나 평가하기"
            aria-expanded={sheetOpen}
            className="rounded-full px-2 py-1 text-lg leading-none text-muted hover:bg-surface-muted"
          >
            ⋯
          </button>
        </div>
      </div>

      {sheetOpen && (
        <FeedbackSheet
          // 문항이 바뀌면 쓰던 내용이 남지 않게 새로 마운트한다.
          key={itemKey}
          slug={item.slug}
          stepKey={item.stepKey}
          sent={sent[itemKey] ?? { report: false, rating: false }}
          onSent={(mode) =>
            setSent((prev) => ({
              ...prev,
              [itemKey]: {
                ...(prev[itemKey] ?? { report: false, rating: false }),
                [mode]: true,
              },
            }))
          }
          onClose={() => setSheetOpen(false)}
        />
      )}

      {/* 지문. 풀 때와 같은 카드로 그린다 — 이메일은 이메일처럼, 메신저는 말풍선으로.
          다른 건 등장 연출과 타이머가 없다는 것뿐이다. */}
      <div className="no-rise mt-6 flex flex-col gap-3">
        <ScenarioBody key={index} item={item} />
      </div>

      <AnswerPanel
        prompt={item.prompt}
        choices={item.choices}
        answerIndex={item.answerIndex}
        stage="answered"
        picked={item.picked}
        correct={item.picked === item.answerIndex}
        scorePop={null}
        onAnswer={() => {}}
        collapsible={false}
      />

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-border text-base font-bold disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          disabled={last}
          onClick={() => go(index + 1)}
          className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-brand text-base font-bold text-brand-foreground disabled:opacity-40"
        >
          다음
        </button>
      </div>

      {/* 어느 문항에서든 나갈 수 있어야 한다. 이전·다음 아래에 두어 넘기다 잘못 누르지 않게. */}
      <Link
        href="/result"
        className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-brand text-base font-bold text-brand"
      >
        결과로 돌아가기
      </Link>
    </main>
  );
}
