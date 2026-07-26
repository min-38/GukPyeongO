"use client";

import { type AdminScenarioStep } from "@/app/lib/scenario-admin";
import {
  checkScenarioRules,
  MAX_CHARS_PER_MINUTE,
} from "@/app/lib/scenario-rules";

import { EditorHints, ParagraphList } from "./ListRow";
import { INPUT } from "./ui";

// 서사 지문 편집기 (#82).
// 정본 타입은 app/lib/story-scenario.ts — sourceLabel·source·title·body[]·readSec.
// 읽기 시간·감상 어휘 규칙은 서버(#76)와 같은 함수를 그대로 불러 쓴다.
// 규칙을 두 벌 적어두면 어느 한쪽만 고쳐져 어긋나기 때문.

interface StoryPayload {
  sourceLabel?: string;
  source?: string;
  title?: string;
  body?: string[];
  readSec?: number;
  [key: string]: unknown;
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
  const body = p.body ?? [];
  const readSec = p.readSec ?? 0;

  const setBody = (next: string[]) => onChange({ ...payload, body: next });

  const chars = body.join("").length;
  const perMinute = readSec > 0 ? Math.round(chars / (readSec / 60)) : null;
  const recommended = Math.ceil((chars / MAX_CHARS_PER_MINUTE) * 60);

  // 저장하면 서버가 볼 규칙을 미리 보여준다.
  const { errors, warnings } = checkScenarioRules("story", payload, steps);

  const hints: string[] = [...errors, ...warnings];
  if (!p.sourceLabel?.trim()) hints.push("표시 라벨을 입력해주세요.");
  if (!p.source?.trim()) hints.push("상황 라벨을 입력해주세요.");
  if (!p.title?.trim()) hints.push("제목을 입력해주세요.");

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
            placeholder="이야기"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          상황 라벨
          <input
            value={p.source ?? ""}
            onChange={(e) => onChange({ ...payload, source: e.target.value })}
            placeholder="명절 전날"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          제목
          <input
            value={p.title ?? ""}
            onChange={(e) => onChange({ ...payload, title: e.target.value })}
            placeholder="미리 데운 방"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          읽기 시간(초)
          <input
            type="number"
            min={1}
            value={readSec}
            onChange={(e) =>
              onChange({ ...payload, readSec: Number(e.target.value) })
            }
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
      </div>

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
            {perMinute > MAX_CHARS_PER_MINUTE &&
              ` · 권장 ${recommended}초 이상`}
          </>
        )}
      </p>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          본문 문단 ({body.length})
        </span>
        <button
          type="button"
          onClick={() => setBody([...body, ""])}
          className="text-xs font-medium text-brand"
        >
          + 문단 추가
        </button>
      </div>

      <ParagraphList value={body} onChange={setBody} rows={3} />

      <EditorHints hints={hints} />
    </div>
  );
}
