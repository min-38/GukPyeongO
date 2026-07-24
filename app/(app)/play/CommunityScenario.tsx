"use client";

import { useState } from "react";

import { type CommunityScenario } from "@/app/lib/mock-community";
import { readMs } from "@/app/lib/scenario-pacing";
import { playMessagePop } from "@/app/lib/sfx";
import { type AnswerResult, useScenario } from "@/app/lib/useScenario";

import { AnswerPanel, ScenarioTopBar } from "./ScenarioUI";

// 피드에 쌓이는 항목 — 원글 카드 또는 댓글. 게시물 내내 누적된다.
// 댓글은 이미 달려 있는 글이며, 정답/오답에 따라 새로 달리지 않는다.
type FeedItem =
  | { kind: "post"; author: string; title: string; body: string[] }
  | { kind: "comment"; nick: string; text: string; reply?: boolean };

const OPENING_DELAY_MS = 400;
const REVEAL_HOLD_MS = 1800; // 정답 공개를 읽을 시간(반응 대댓글 없이 잠깐 보여준 뒤 진행)

function PostCard({
  author,
  title,
  body,
}: {
  author: string;
  title: string;
  body: string[];
}) {
  return (
    <div className="animate-rise rounded-2xl border border-border bg-surface-muted/40 p-4">
      <p className="text-xs text-muted">{author}</p>
      <h2 className="mt-1 text-base font-bold leading-snug">{title}</h2>
      <div className="mt-2 flex flex-col gap-1 text-[15px] leading-relaxed">
        {body.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function CommentRow({
  nick,
  text,
  reply,
}: {
  nick: string;
  text: string;
  reply?: boolean;
}) {
  return (
    <div className={`animate-rise flex gap-2 ${reply ? "pl-8" : ""}`}>
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">
        {nick.slice(0, 1)}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{nick}</p>
        <p className="text-[15px] leading-snug">{text}</p>
      </div>
    </div>
  );
}

export default function CommunityScenarioView({
  scenario,
  onFinish,
}: {
  scenario: CommunityScenario;
  onFinish: (score: number) => void;
}) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const addItem = (item: FeedItem) => setFeed((prev) => [...prev, item]);

  // 게시물(원글 + 전체 댓글)은 처음에 "한 번에" 보여준다.
  // 문제마다 댓글이 추가되면 그게 정답이라는 힌트가 되어버리므로, 이후 스텝은
  // 콘텐츠를 건드리지 않고 문제만 바꾼다.
  const reveal = (
    _step: CommunityScenario["steps"][number],
    index: number,
    open: () => void
  ) => {
    if (index > 0) {
      // 콘텐츠는 이미 다 떠 있다 — 문제만 바뀐다.
      const t = window.setTimeout(open, 400);
      return () => clearTimeout(t);
    }

    const timers: number[] = [];
    const { post, comments } = scenario;
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        addItem({ kind: "post", ...post });
      }, OPENING_DELAY_MS)
    );
    const commentsAt = OPENING_DELAY_MS + readMs(post.body.join(" "));
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        comments.forEach((c) =>
          addItem({ kind: "comment", nick: c.nick, text: c.text, reply: c.reply })
        );
      }, commentsAt)
    );
    // 전체 댓글을 훑을 시간을 준 뒤 첫 문제를 연다.
    const openAt = commentsAt + readMs(comments.map((c) => c.text).join(" "));
    timers.push(window.setTimeout(open, openAt));
    return () => timers.forEach(clearTimeout);
  };

  // 답 후엔 새 댓글을 달지 않는다. 정답 공개(선택지 색)를 잠깐 보여준 뒤 다음 문제로.
  const respond = (
    _step: CommunityScenario["steps"][number],
    _result: AnswerResult,
    next: () => void
  ) => {
    const t = window.setTimeout(next, REVEAL_HOLD_MS);
    return () => clearTimeout(t);
  };

  const s = useScenario({ steps: scenario.steps, onFinish, reveal, respond });
  const { step } = s;

  return (
    <div className="flex h-full min-h-0 w-full flex-col lg:mx-auto lg:max-w-xl">
      <ScenarioTopBar
        label={scenario.boardName}
        stepIndex={s.stepIndex}
        total={s.total}
        stage={s.stage}
        remaining={s.remaining}
      />

      {/* 피드 — 원글 + 전체 댓글. 여기만 스크롤(스크롤바 감춤).
          채팅과 달리 자동으로 맨 아래로 내리지 않는다 — 원글부터 위에서 읽어야 하므로. */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {feed.map((item, i) =>
          item.kind === "post" ? (
            <PostCard
              key={i}
              author={item.author}
              title={item.title}
              body={item.body}
            />
          ) : (
            <CommentRow
              key={i}
              nick={item.nick}
              text={item.text}
              reply={item.reply}
            />
          )
        )}
      </div>

      <AnswerPanel
        prompt={step.prompt}
        choices={step.choices}
        answerIndex={step.answerIndex}
        stage={s.stage}
        picked={s.picked}
        correct={s.correct}
        scorePop={s.scorePop}
        onAnswer={s.answer}
      />
    </div>
  );
}
