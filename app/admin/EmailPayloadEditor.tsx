"use client";

import { type EmailMessage } from "@/app/lib/email-scenario";

import { HTML_GUIDE, HtmlField } from "./HtmlField";
import { EditorHints, moved, RowButtons } from "./ListRow";

// 이메일 지문 편집기 (#81, #99).
// 정본 타입은 app/lib/email-scenario.ts.
// 메일 한 통이 HTML 조각 하나다 — 제목·보낸사람·시각·본문까지 조각 안에 함께 넣는다.
// 제목을 스레드에 하나만 두지 않는 이유: 회신은 제목을 잇지만 따로 보낸 메일은 제목이 다르다(#99).
// 통을 나눠두는 이유: 문항별 공개 범위(showUpTo)와 번호 탭이 "몇 번째 통"으로 동작한다.

interface EmailPayload {
  messages?: EmailMessage[];
  [key: string]: unknown;
}

const PLACEHOLDER = `<h2 class="mb-2 text-lg font-bold leading-snug">[안내] 본사 사옥 이전 관련 협조 요청</h2>

<div class="flex items-center justify-between gap-2">
  <div class="flex items-center gap-2">
    <div class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">이</div>
    <div>
      <p class="text-[13px] font-bold">이지호</p>
      <p class="text-[11px] text-muted">받는사람 전직원</p>
    </div>
  </div>
  <p class="shrink-0 text-[11px] text-muted tabular-nums">3월 3일 (화) 10:05</p>
</div>

<div class="mt-2 flex flex-col gap-1">
  <p>총무팀입니다. 본사 사옥 이전 일정 안내드립니다.</p>
</div>`;

export default function EmailPayloadEditor({
  payload,
  onChange,
}: {
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as EmailPayload;
  const messages = p.messages ?? [];

  const setMessages = (next: EmailMessage[]) =>
    onChange({ ...payload, messages: next });

  const hints: string[] = [];
  if (messages.length === 0) hints.push("메일을 1통 이상 추가해주세요.");
  if (messages.some((m) => !m.html?.trim()))
    hints.push("내용이 빈 메일이 있습니다.");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{HTML_GUIDE}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          메일 ({messages.length}) — 시간 오름차순. 문항의 공개 범위가 이 순서를
          가리킨다
        </span>
        <button
          type="button"
          onClick={() => setMessages([...messages, { html: "" }])}
          className="text-xs font-medium text-brand"
        >
          + 메일 추가
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <li key={i} className="rounded-2xl border border-border p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-muted">
                {i + 1}번째 메일
              </span>
              <RowButtons
                onUp={() => setMessages(moved(messages, i, -1))}
                onDown={() => setMessages(moved(messages, i, 1))}
                onRemove={() => setMessages(messages.filter((_, j) => j !== i))}
              />
            </div>
            <HtmlField
              label=""
              value={m.html ?? ""}
              placeholder={PLACEHOLDER}
              rows={12}
              onChange={(html) =>
                setMessages(messages.map((x, j) => (j === i ? { html } : x)))
              }
            />
          </li>
        ))}
        {messages.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border py-6 text-center text-xs text-muted">
            메일이 없습니다.
          </li>
        )}
      </ul>

      <EditorHints hints={hints} />
    </div>
  );
}
