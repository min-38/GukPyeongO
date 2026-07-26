"use client";

import { type EmailMessage } from "@/app/lib/email-scenario";

import { moved, RowButtons } from "./ListRow";
import { INPUT } from "./ui";

// 이메일 지문 편집기 (#81).
// 정본 타입은 app/lib/email-scenario.ts — sourceLabel·subject·layout·messages[].
// 문항별 공개 범위(showUpTo)는 문항 편집기에 있다(#75).

interface EmailPayload {
  sourceLabel?: string;
  subject?: string;
  layout?: "thread" | "toggle";
  messages?: EmailMessage[];
  [key: string]: unknown;
}

const LAYOUTS: { value: "thread" | "toggle"; label: string }[] = [
  { value: "thread", label: "thread — 회신을 세로로 쌓아 훑기" },
  { value: "toggle", label: "toggle — 원문·답장을 탭으로 갈아끼워 대조" },
];

const EMPTY_MESSAGE: EmailMessage = {
  from: "",
  address: "",
  to: "",
  at: "",
  body: [""],
};

function MessageEditor({
  message,
  index,
  needsQuote,
  onChange,
  onUp,
  onDown,
  onRemove,
}: {
  message: EmailMessage;
  index: number;
  needsQuote: boolean;
  onChange: (next: EmailMessage) => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof EmailMessage>(key: K, value: EmailMessage[K]) =>
    onChange({ ...message, [key]: value });

  const body = message.body ?? [];
  const quote = message.quote ?? [];

  return (
    <li className="rounded-2xl border border-border bg-surface-muted/30 p-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold text-muted">
          {index + 1}번 메일{index === 0 && " (원문)"}
        </span>
        <RowButtons onUp={onUp} onDown={onDown} onRemove={onRemove} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">
          보낸사람
          <input
            value={message.from}
            onChange={(e) => set("from", e.target.value)}
            placeholder="김하늘"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs text-muted">
          메일 주소
          <input
            value={message.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="ha.kim@nubium.co.kr"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs text-muted">
          받는사람
          <input
            value={message.to}
            onChange={(e) => set("to", e.target.value)}
            placeholder="박도윤"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs text-muted">
          참조 (선택)
          <input
            value={message.cc ?? ""}
            onChange={(e) =>
              onChange({
                ...message,
                // 빈 참조는 필드를 아예 빼서 mock과 같은 모양으로 둔다.
                ...(e.target.value
                  ? { cc: e.target.value }
                  : { cc: undefined }),
              })
            }
            placeholder="정세라"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="col-span-2 text-xs text-muted">
          보낸 시각
          <input
            value={message.at}
            onChange={(e) => set("at", e.target.value)}
            placeholder="3월 10일 (화) 09:12"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">본문 ({body.length})</span>
        <button
          type="button"
          onClick={() => set("body", [...body, ""])}
          className="text-xs font-medium text-brand"
        >
          + 문단
        </button>
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {body.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <textarea
              value={line}
              onChange={(e) =>
                set(
                  "body",
                  body.map((l, j) => (j === i ? e.target.value : l)),
                )
              }
              rows={2}
              className={`flex-1 ${INPUT}`}
            />
            <RowButtons
              onUp={() => set("body", moved(body, i, -1))}
              onDown={() => set("body", moved(body, i, 1))}
              onRemove={() =>
                set(
                  "body",
                  body.filter((_, j) => j !== i),
                )
              }
            />
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          인용문 ({quote.length})
          {needsQuote && quote.length === 0 && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">
              — 대조 문제의 근거입니다
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => set("quote", [...quote, ""])}
          className="text-xs font-medium text-brand"
        >
          + 인용
        </button>
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {quote.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <textarea
              value={line}
              onChange={(e) =>
                set(
                  "quote",
                  quote.map((l, j) => (j === i ? e.target.value : l)),
                )
              }
              rows={2}
              className={`flex-1 ${INPUT}`}
            />
            <RowButtons
              onUp={() => set("quote", moved(quote, i, -1))}
              onDown={() => set("quote", moved(quote, i, 1))}
              onRemove={() => {
                const next = quote.filter((_, j) => j !== i);
                // 인용이 하나도 없으면 필드를 빼서 mock과 같은 모양으로 둔다.
                onChange({
                  ...message,
                  quote: next.length > 0 ? next : undefined,
                });
              }}
            />
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function EmailPayloadEditor({
  payload,
  onChange,
}: {
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as EmailPayload;
  const messages = p.messages ?? [];
  const layout = p.layout ?? "thread";

  const setMessages = (next: EmailMessage[]) =>
    onChange({ ...payload, messages: next });

  const hints: string[] = [];
  if (!p.sourceLabel?.trim()) hints.push("표시 라벨을 입력해주세요.");
  if (!p.subject?.trim()) hints.push("스레드 제목을 입력해주세요.");
  if (messages.length < 2)
    hints.push("메일이 2통 이상이어야 회신을 대조할 수 있습니다.");
  if (messages.some((m) => !m.from?.trim() || !m.at?.trim()))
    hints.push("보낸사람·보낸 시각이 빈 메일이 있습니다.");
  // 인용문은 thread에서만 쓴다. toggle은 원문·답장을 탭으로 갈아끼워 대조하므로 인용이 필요 없다.
  if (
    layout === "thread" &&
    messages.slice(1).some((m) => (m.quote?.length ?? 0) === 0)
  )
    hints.push("인용문이 없는 회신이 있습니다. 대조 문제의 근거가 사라집니다.");

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-muted">
          표시 라벨 (상단바)
          <input
            value={p.sourceLabel ?? ""}
            onChange={(e) =>
              onChange({ ...payload, sourceLabel: e.target.value })
            }
            placeholder="메일"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          레이아웃
          <select
            value={layout}
            onChange={(e) =>
              onChange({
                ...payload,
                layout: e.target.value as "thread" | "toggle",
              })
            }
            className={`mt-1 w-full ${INPUT}`}
          >
            {LAYOUTS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-xs font-medium text-muted">
        스레드 제목
        <input
          value={p.subject ?? ""}
          onChange={(e) => onChange({ ...payload, subject: e.target.value })}
          placeholder="[요청] 상반기 사내 교육 교재 견적 회신"
          className={`mt-1 w-full ${INPUT}`}
        />
      </label>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          메일 ({messages.length}) — 시간 오름차순
        </span>
        <button
          type="button"
          onClick={() => setMessages([...messages, { ...EMPTY_MESSAGE }])}
          className="text-xs font-medium text-brand"
        >
          + 메일 추가
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <MessageEditor
            key={i}
            message={m}
            index={i}
            needsQuote={layout === "thread" && i > 0}
            onChange={(next) =>
              setMessages(messages.map((x, j) => (j === i ? next : x)))
            }
            onUp={() => setMessages(moved(messages, i, -1))}
            onDown={() => setMessages(moved(messages, i, 1))}
            onRemove={() => setMessages(messages.filter((_, j) => j !== i))}
          />
        ))}
        {messages.length === 0 && (
          <li className="py-3 text-center text-xs text-muted">
            메일이 없습니다.
          </li>
        )}
      </ul>

      {hints.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-amber-600 dark:text-amber-400">
          {hints.map((h, i) => (
            <li key={i}>· {h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
