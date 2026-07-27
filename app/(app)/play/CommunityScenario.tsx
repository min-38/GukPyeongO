"use client";

import { useState } from "react";

import { type CommunityScenario } from "@/app/lib/community-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario from "./ReadingScenario";
import { CommentRow, PostCard } from "./SurfaceCards";

// 피드에 쌓이는 항목 — 원글 카드 또는 댓글.
// 댓글은 이미 달려 있는 글이며, 정답/오답에 따라 새로 달리지 않는다.
type FeedItem =
  | { kind: "post"; author: string; title: string; body: string[] }
  | { kind: "comment"; nick: string; text: string; reply?: boolean };

const OPENING_DELAY_MS = 400;

export default function CommunityScenarioView({
  scenario,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: CommunityScenario;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
}) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const addItem = (item: FeedItem) => setFeed((prev) => [...prev, item]);

  // 게시물(원글 + 전체 댓글)을 처음에 "한 번에" 보여준다.
  // 문제마다 댓글이 추가되면 그게 정답이라는 힌트가 되어버리므로 이후엔 콘텐츠를 건드리지 않는다.
  const revealOnce = (open: () => void) => {
    const timers: number[] = [];
    const { post, comments } = scenario;
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        addItem({ kind: "post", ...post });
      }, OPENING_DELAY_MS),
    );
    const commentsAt = OPENING_DELAY_MS + readMs(post.body.join(" "));
    timers.push(
      window.setTimeout(() => {
        playMessagePop();
        comments.forEach((c) =>
          addItem({
            kind: "comment",
            nick: c.nick,
            text: c.text,
            reply: c.reply,
          }),
        );
      }, commentsAt),
    );
    // 전체 댓글을 훑을 시간을 준 뒤 첫 문제를 연다.
    const openAt = commentsAt + readMs(comments.map((c) => c.text).join(" "));
    timers.push(window.setTimeout(open, openAt));
    return () => timers.forEach(clearTimeout);
  };

  return (
    <ReadingScenario
      label={scenario.boardName}
      steps={scenario.steps}
      onFinish={onFinish}
      slug={slug}
      onAnswered={onAnswered}
      revealOnce={revealOnce}
    >
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
        ),
      )}
    </ReadingScenario>
  );
}
