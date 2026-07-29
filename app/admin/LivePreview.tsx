"use client";

import { useState } from "react";

import { type EmailMessage } from "@/app/lib/email-scenario";
import { type AdminScenarioStep } from "@/app/lib/scenario-admin";
import {
  SCENARIO_KIND_TITLES,
  type ScenarioKind,
} from "@/app/lib/scenario-admin";
import { stepPoints } from "@/app/lib/scenario-points";

import { dateMark } from "@/app/lib/chat-scenario";

import {
  type Bubble,
  ChatBubble,
  CommentRow,
  DocCard,
  EmailThread,
  HtmlBlock,
  PostCard,
} from "@/app/(app)/play/SurfaceCards";

import { CARD, LABEL } from "./ui";

// 살아 있는 미리보기 (#99).
// 저장하지 않아도, 새로고침하지 않아도, 지금 쓰고 있는 그대로가 오른쪽에 그려진다.
// 타이머·등장 연출은 넣지 않는다 — 글자를 고칠 때마다 대화가 다시 재생되면 볼 수가 없다.
// "이렇게 나온다"만 보여준다.

function Body({
  kind,
  payload,
}: {
  kind: ScenarioKind;
  payload: Record<string, unknown>;
}) {
  const c = payload as {
    doc?: { source?: string; title?: string; body?: string[]; html?: string };
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
    speaker?: string;
  };
  const [tab, setTab] = useState(0);

  switch (kind) {
    case "notice":
    case "news":
    case "contract":
    case "manual":
      return (
        <DocCard
          source={c.doc?.source ?? ""}
          title={c.doc?.title ?? ""}
          body={c.doc?.body ?? []}
          html={c.doc?.html}
        />
      );
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
    case "email": {
      const messages = c.messages ?? [];
      return (
        <EmailThread
          messages={messages}
          visible={messages.length}
          tab={Math.min(tab, Math.max(0, messages.length - 1))}
          onTab={setTab}
        />
      );
    }
    case "chat":
      // 메신저는 대사가 문항마다 흩어져 있다 — 순서대로 이어 붙여 한 번에 보여준다.
      return null;
    default:
      return null;
  }
}

// 메신저는 문항의 대사를 모아야 대화가 된다.
function ChatBody({
  steps,
  speaker,
}: {
  steps: AdminScenarioStep[];
  speaker: string;
}) {
  const dates = steps.map((s) => ({
    date: (s.extra as { date?: string })?.date,
  }));
  const bubbles = steps.flatMap((step, i) => {
    const extra = step.extra as {
      context?: {
        speaker: string;
        text: string;
        at?: string;
        mine?: boolean;
      }[];
      reactCorrect?: string;
      reactCorrectSpeaker?: string;
      at?: string;
    };
    const lines: Bubble[] = (extra?.context ?? []).map((m) => ({
      side: m.mine ? ("me" as const) : ("them" as const),
      speaker: m.mine ? "나" : m.speaker,
      text: m.text,
      at: m.at,
    }));
    const mine = step.choices[step.answerIndex];
    const rest: Bubble[] = [
      ...lines,
      ...(mine
        ? [
            {
              side: "me" as const,
              speaker: "나",
              text: mine,
              at: extra?.at,
            },
          ]
        : []),
      ...(extra?.reactCorrect
        ? [
            {
              side: "them" as const,
              speaker: extra.reactCorrectSpeaker || speaker,
              text: extra.reactCorrect,
              at: extra?.at,
              tone: "correct" as const,
            },
          ]
        : []),
    ];
    // 날이 바뀌는 문항이면 그 문항의 첫 말풍선에 날짜를 달아 구분선을 세운다.
    const mark = dateMark(dates, i);
    if (mark && rest[0]) rest[0] = { ...rest[0], date: mark };
    return rest;
  });

  return (
    <div className="flex flex-col gap-1.5">
      {bubbles.map((b, i) => (
        <ChatBubble
          key={i}
          bubble={b}
          grouped={
            bubbles[i - 1]?.side === b.side &&
            bubbles[i - 1]?.speaker === b.speaker
          }
          timed={!!b.at}
        />
      ))}
    </div>
  );
}

export default function LivePreview({
  kind,
  payload,
  steps,
}: {
  kind: ScenarioKind;
  payload: Record<string, unknown> | null;
  steps: AdminScenarioStep[];
}) {
  const total = steps.reduce((sum, s) => sum + stepPoints(s), 0);

  return (
    <div className={`${CARD} overflow-hidden`}>
      {/* 푸는 화면의 상단바와 같은 모양 — 유저가 보는 이름이 여기서도 같아야 한다. */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold">
          {SCENARIO_KIND_TITLES[kind]}
        </span>
        <span className="text-xs tabular-nums text-muted">
          문항 {steps.length} · {total}점
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {payload === null ? (
          <p className="py-6 text-center text-sm text-muted">
            지문 JSON을 해석할 수 없습니다. 지문 탭에서 확인하세요.
          </p>
        ) : kind === "chat" ? (
          <ChatBody
            steps={steps}
            speaker={(payload as { speaker?: string }).speaker ?? ""}
          />
        ) : (
          <Body kind={kind} payload={payload} />
        )}
      </div>

      {/* 문항 — 정답이 어느 것인지 표시해 둔다. 푸는 화면에서는 정답 공개 뒤 이 색이 된다. */}
      <div className="flex flex-col gap-3 border-t border-border p-4">
        {steps.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            문항을 추가하면 여기에 보입니다.
          </p>
        )}
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-2">
              <p className={LABEL}>
                {i + 1}. {step.type || "분류 없음"}
              </p>
              <p className="text-[11px] tabular-nums text-muted">
                {stepPoints(step)}점 · {step.timeLimitSec}초
              </p>
            </div>
            <p className="mt-1 text-sm font-medium">
              {step.prompt || "(질문 없음)"}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {step.choices.map((c, j) => (
                <li
                  key={j}
                  className={`rounded-xl border-2 px-3 py-2 text-[13px] ${
                    j === step.answerIndex
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border text-muted"
                  }`}
                >
                  {c || "(빈 보기)"}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
