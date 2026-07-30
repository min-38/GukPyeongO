"use client";

import { useState } from "react";

import { type CommunityScenario } from "@/app/lib/community-scenario";
import { readMs } from "@/app/lib/scenario-pacing";
import { type OnAnswered, type PlanRead } from "@/app/lib/useScenario";
import { playMessagePop } from "@/app/lib/sfx";

import ReadingScenario from "./ReadingScenario";
import { CommentRow, HtmlBlock, PostCard } from "./SurfaceCards";

// 피드에 쌓이는 항목 — 원글 카드 또는 댓글.
// 댓글은 이미 달려 있는 글이며, 정답/오답에 따라 새로 달리지 않는다.
type FeedItem =
  | { kind: "post"; author: string; title: string; body: string[] }
  | { kind: "comment"; nick: string; text: string; reply?: boolean }
  // HTML 조각으로 쓴 원글·댓글 영역(#99).
  | { kind: "html"; html: string; card: boolean };

const OPENING_DELAY_MS = 400;

export default function CommunityScenarioView({
  scenario,
  label,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: CommunityScenario;
  // 상단바 이름 — 유형에서 온다(#99).
  label: string;
  onFinish: (score: number) => void;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onAnswered?: OnAnswered;
}) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const addItem = (item: FeedItem) => setFeed((prev) => [...prev, item]);

  // 게시물(원글 + 전체 댓글)을 처음에 "한 번에" 보여준다.
  // 문제마다 댓글이 추가되면 그게 정답이라는 힌트가 되어버리므로 이후엔 콘텐츠를 건드리지 않는다.
  const revealOnce = (open: () => void, plan: PlanRead) => {
    const timers: number[] = [];
    const { post, comments, postHtml, commentsHtml } = scenario;

    // HTML로 쓴 지문은 원글 영역과 댓글 영역 두 덩어리로 나눠 같은 리듬에 올린다.
    if (postHtml?.trim() || commentsHtml?.trim()) {
      timers.push(
        window.setTimeout(() => {
          playMessagePop();
          if (postHtml?.trim())
            addItem({ kind: "html", html: postHtml, card: true });
        }, OPENING_DELAY_MS),
      );
      const at = OPENING_DELAY_MS + readMs(postHtml ?? "");
      timers.push(
        window.setTimeout(() => {
          playMessagePop();
          if (commentsHtml?.trim())
            addItem({ kind: "html", html: commentsHtml, card: false });
        }, at),
      );
      const htmlOpenAt = scenario.readSec
        ? OPENING_DELAY_MS + scenario.readSec * 1000
        : at + readMs(commentsHtml ?? "");
      plan(htmlOpenAt);
      timers.push(window.setTimeout(open, htmlOpenAt));
      return () => timers.forEach(clearTimeout);
    }

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
    // 지문에 읽기 시간이 적혀 있으면 그 시각에 연다(#99).
    const openAt = scenario.readSec
      ? OPENING_DELAY_MS + scenario.readSec * 1000
      : commentsAt + readMs(comments.map((c) => c.text).join(" "));
    plan(openAt);
    timers.push(window.setTimeout(open, openAt));
    return () => timers.forEach(clearTimeout);
  };

  return (
    <ReadingScenario
      label={label}
      steps={scenario.steps}
      onFinish={onFinish}
      slug={slug}
      onAnswered={onAnswered}
      revealOnce={revealOnce}
    >
      {feed.map((item, i) =>
        item.kind === "html" ? (
          <HtmlBlock key={i} html={item.html} card={item.card} />
        ) : item.kind === "post" ? (
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
