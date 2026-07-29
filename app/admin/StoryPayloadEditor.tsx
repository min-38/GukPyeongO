"use client";

import { type AdminScenarioStep } from "@/app/lib/scenario-admin";
import {
  checkScenarioRules,
  MAX_CHARS_PER_MINUTE,
} from "@/app/lib/scenario-rules";

import { HTML_GUIDE, HtmlField } from "./HtmlField";
import { EditorHints } from "./ListRow";

// 서사 지문 편집기 (#82, #99).
// 정본 타입은 app/lib/story-scenario.ts.
// 지문은 HTML 조각 하나로 쓴다 — 출처·제목까지 조각 안에 함께 넣는다.
// 읽기 시간은 공통 폼에서 받는다(#99). 글자 수 대비 적정한지는 여기서 미리 보여준다.

interface StoryPayload {
  source?: string;
  title?: string;
  body?: string[];
  html?: string;
  readSec?: number;
  [key: string]: unknown;
}

const PLACEHOLDER = `<p class="text-xs font-medium text-brand">겨울 아침</p>
<h2 class="mb-3 text-lg font-bold leading-snug">미리 데운 방</h2>

<div class="flex flex-col gap-2">
  <p>아버지는 새벽에 먼저 일어나 보일러를 켰다.</p>
  <p>내가 일어났을 때 방은 이미 따뜻했다.</p>
</div>`;

// 태그를 걷어낸 글자 수 — 읽기 시간이 넉넉한지 보는 기준이다.
function textLength(html: string): number {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().length;
}

export default function StoryPayloadEditor({
  payload,
  steps,
  onChange,
}: {
  payload: Record<string, unknown>;
  steps: AdminScenarioStep[];
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as StoryPayload;
  const readSec = p.readSec ?? 0;

  const chars = p.html?.trim()
    ? textLength(p.html)
    : (p.body ?? []).join("").length;
  const perMinute = readSec > 0 ? Math.round(chars / (readSec / 60)) : null;
  const recommended = Math.ceil((chars / MAX_CHARS_PER_MINUTE) * 60);

  // 저장하면 서버가 볼 규칙을 미리 보여준다.
  const { errors, warnings } = checkScenarioRules("story", payload, steps);

  const hints: string[] = [...errors, ...warnings];
  if (!p.html?.trim()) hints.push("지문을 입력해주세요.");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{HTML_GUIDE}</p>

      <HtmlField
        label="지문 — 카드 표면을 두릅니다. 상황 라벨·제목도 여기에 씁니다"
        value={p.html ?? ""}
        placeholder={PLACEHOLDER}
        rows={16}
        onChange={(html) => onChange({ ...payload, html })}
      />

      {/* 읽기 속도는 저장 전에 눈으로 보여준다. 모자라면 서버가 거부한다(#76). */}
      <p className="text-xs text-muted">
        본문 {chars}자
        {perMinute !== null && (
          <>
            {" · "}
            <span
              className={
                perMinute > MAX_CHARS_PER_MINUTE
                  ? "font-bold text-amber-600 dark:text-amber-400"
                  : ""
              }
            >
              분당 {perMinute}자
            </span>
            {perMinute > MAX_CHARS_PER_MINUTE && ` · ${recommended}초 이상 권장`}
          </>
        )}
        {readSec === 0 && " · 읽기 시간은 위 폼에서 정합니다"}
      </p>

      <EditorHints hints={hints} />
    </div>
  );
}
