"use client";

import { useState } from "react";

import { type EmailMessage } from "@/app/lib/email-scenario";

// 유형별 표면이 그리는 카드들 (#96에서 모았다).
// 원래는 각 표면 파일 안에 있었는데, 문제 다시 보기가 같은 모양으로 지문을 보여줘야 해서
// 그림만 그리는 부분을 여기로 뺐다. 재생·타이머·정답 판정은 표면 쪽에 그대로 남아 있다.

// 공지·신문·서사가 함께 쓰는 문서 카드. 셋 다 출처·제목·본문 한 덩어리다.
export function DocCard({
  source,
  title,
  body,
  html,
}: {
  source: string;
  title: string;
  body: string[];
  // 어드민이 쓴 HTML 조각(#99). 어드민만 쓸 수 있는 자리라 그대로 그린다.
  // 조각 안 <style>은 앱 전체로 새므로 인라인 style 속성을 쓰기로 한다.
  html?: string;
}) {
  return (
    <div className="animate-rise rounded-2xl border border-border bg-surface-muted/40 p-4">
      {/* HTML 조각으로 쓴 지문은 출처·제목까지 조각 안에 있다(#99). */}
      {!html?.trim() && (
        <>
          {source.trim() && (
            <p className="text-xs font-medium text-brand">{source}</p>
          )}
          <h2 className="text-lg font-bold leading-snug">{title}</h2>
        </>
      )}
      {/* HTML 조각으로 쓴 지문은 그대로 그린다. 아니면 문단 배열을 쓴다 —
          문단 안의 줄바꿈(번호 목록 등)은 살리고 빈 문단은 건너뛴다(#99). */}
      {html?.trim() ? (
        <div
          className="scenario-html text-[15px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="mt-3 flex flex-col gap-2 whitespace-pre-line text-[15px] leading-relaxed">
          {body
            .filter((line) => line.trim().length > 0)
            .map((line, i) => (
              <p key={i}>{line}</p>
            ))}
        </div>
      )}
    </div>
  );
}

// 커뮤니티 원글.
export function PostCard({
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

// 커뮤니티 댓글 한 줄. 대댓글은 들여쓴다.
export function CommentRow({
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

// 회신 한 통. 인용은 접어두고, 펼쳐서 원문과 대조하는 것 자체가 풀이 행위다.
export function MessageCard({ msg }: { msg: EmailMessage }) {
  const [quoteOpen, setQuoteOpen] = useState(false);

  // 메일 한 통을 HTML로 쓴 경우(#99) — 보낸사람 줄까지 조각이 갖는다.
  if (msg.html?.trim()) {
    return (
      <div
        className="scenario-html animate-rise border-b border-border pb-3 text-[15px] leading-relaxed last:border-b-0"
        dangerouslySetInnerHTML={{ __html: msg.html }}
      />
    );
  }

  return (
    <div className="animate-rise flex gap-2 border-b border-border pb-3 last:border-b-0">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">
        {(msg.from ?? "").slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <p className="shrink-0 text-[13px] font-bold">{msg.from}</p>
          <p className="truncate text-[11px] text-muted">{msg.address}</p>
          <p className="ml-auto shrink-0 text-[11px] text-muted">{msg.at}</p>
        </div>
        <p className="text-[11px] text-muted">
          받는사람 {msg.to}
          {msg.cc ? ` · 참조 ${msg.cc}` : ""}
        </p>
        <div className="mt-2 flex flex-col gap-1 text-[15px] leading-relaxed">
          {(msg.body ?? []).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        {msg.quote && (
          <>
            <button
              type="button"
              onClick={() => setQuoteOpen((v) => !v)}
              className="mt-2 rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-bold leading-5 text-muted"
              aria-expanded={quoteOpen}
              aria-label="인용된 원문 펼치기"
            >
              ···
            </button>
            {quoteOpen && (
              <div className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-3 text-[13px] leading-relaxed text-muted">
                {msg.quote.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 화면에 쌓이는 말풍선. 한 시나리오 동안 계속 누적된다.
export type Bubble = {
  side: "them" | "me";
  speaker: string;
  text: string;
  at?: string; // 보낸 시각. 묶음의 마지막 줄에만 보인다(showsTime).
  // 반응 대사의 정답/오답 톤. 대화가 누적되므로 색은 말풍선에 고정해
  // 다음 문제로 넘어가도 과거 말풍선 색이 바뀌지 않게 한다.
  tone?: "correct" | "wrong";
  // 이 말풍선 앞에 찍을 날짜 구분선. 대화가 며칠에 걸칠 때 날이 바뀌는 자리에만 붙는다.
  date?: string;
};

const TIME = "shrink-0 text-[11px] text-muted";

// 날이 바뀌면 대화 가운데에 날짜를 끼워 넣는다 — 실제 메신저와 같게.
export function DateDivider({ date }: { date: string }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-medium text-muted">
        {date}
      </span>
    </div>
  );
}

export function ChatBubble(props: {
  bubble: Bubble;
  grouped: boolean;
  timed: boolean;
}) {
  if (!props.bubble.date) return <BubbleBody {...props} />;
  return (
    <>
      <DateDivider date={props.bubble.date} />
      {/* 날이 바뀌었으면 이름·프로필을 다시 보여준다. */}
      <BubbleBody {...props} grouped={false} />
    </>
  );
}

// 같은 사람이 연달아 보내면 이름과 프로필을 다시 보여주지 않는다 — 실제 메신저와 같게.
// 시각은 반대쪽 끝, 묶음의 마지막 줄에만 붙는다.
function BubbleBody({
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

// 메일 스레드 한 덩어리. 몇 통까지 보일지(visible)와 지금 보는 탭은 바깥이 정한다 —
// 풀 때는 문항이 진행되며 열리고, 다시 볼 때는 그 문항 시점까지 펼쳐 둔다.
export function EmailThread({
  messages,
  visible,
  tab,
  onTab,
}: {
  messages: EmailMessage[];
  visible: number;
  tab: number;
  onTab: (i: number) => void;
}) {
  // 아직 메일이 한 통도 없을 때(어드민 새 문제 작성 중) — 보여줄 스레드가 없다.
  if (!messages[tab]) return null;

  return (
    <>
      {/* 메일 탭은 상자 밖 위에 둔다(#99) — 편지를 갈아끼우는 손잡이라
          내용과 같은 상자 안에 있으면 지문의 일부처럼 읽힌다.
          이름은 번호로 붙인다. 두 번째 메일이 늘 답장인 것은 아니다(공지·후속 안내일 수도). */}
      <div className="flex shrink-0 gap-2">
        {messages.slice(0, visible).map((msg, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onTab(i)}
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              i === tab
                ? "bg-brand text-brand-foreground"
                : "bg-surface-muted text-muted"
            }`}
          >
            {i + 1}번
          </button>
        ))}
      </div>

      {/* 다른 유형(공지·신문·커뮤니티)의 첫 카드와 같은 표면 — 광고 아래 여백이 같아 보이도록. */}
      {/* 제목은 메일마다 조각 안에 있다(#99) — 회신 스레드는 같은 제목을 잇지만
          따로 보낸 메일은 제목이 다르다. 스레드에 하나만 두면 그 차이를 못 보여준다. */}
      <div className="animate-rise flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted/40 p-4">
        <MessageCard key={tab} msg={messages[tab]} />
      </div>
    </>
  );
}

// 어휘 유형이 묻는 낱말 (#101).
// 지문이 없는 대신 낱말 하나가 지문 자리를 차지한다 — 크게, 가운데.
//
// 유형 안내 화면의 제목(font-display text-3xl)과 헷갈리지 않게 두 가지를 달리한다:
// 글자를 더 키우고, 지문 카드 안에 앉혀 "읽을 것"으로 보이게 한다.
export function WordFace({ word }: { word: string }) {
  // 속담처럼 긴 말은 그대로 키우면 넘친다 — 길이에 따라 한 단계씩 줄인다.
  const size =
    word.length <= 8
      ? "text-6xl sm:text-7xl"
      : word.length <= 16
        ? "text-5xl sm:text-6xl"
        : "text-4xl sm:text-5xl";

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-rise w-full rounded-3xl bg-surface-muted px-6 py-10 text-center">
        <p className={`font-display leading-tight tracking-tight ${size}`}>
          {word}
        </p>
      </div>
    </div>
  );
}

// 어드민이 쓴 HTML 조각 한 덩어리(#99).
// card=true면 다른 유형의 첫 카드와 같은 표면을 두르고, false면 배경 없이 그대로 흐른다.
// 조각 안에서 쓸 수 있는 클래스는 globals.css의 지문용 @source 목록에 있다.
export function HtmlBlock({ html, card }: { html: string; card?: boolean }) {
  return (
    <div
      className={`scenario-html animate-rise text-[15px] leading-relaxed ${
        card ? "rounded-2xl border border-border bg-surface-muted/40 p-4" : ""
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
