"use client";

import { EditorHints, ParagraphList } from "./ListRow";
import { INPUT } from "./ui";

// 문서형(공지·신문) 지문 편집기 (#78).
// 정본 타입은 app/lib/doc-scenario.ts 의 DocScenario — sourceLabel·doc{source·title·body[]}.
// 본문은 문단 단위로 추가/삭제/순서 변경한다.

// 서버는 이 길이를 넘으면 경고를 준다(#76). 편집 중에 미리 알려준다.
const BODY_SOFT_LIMIT = 650;

interface DocPayload {
  sourceLabel?: string;
  doc?: { source?: string; title?: string; body?: string[] };
  [key: string]: unknown;
}

export default function DocPayloadEditor({
  payload,
  onChange,
}: {
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as DocPayload;
  const doc = p.doc ?? {};
  const body = doc.body ?? [];

  const setDoc = (next: Partial<NonNullable<DocPayload["doc"]>>) =>
    onChange({ ...payload, doc: { ...doc, ...next } });

  const chars = body.join("").length;
  const hints: string[] = [];
  if (!p.sourceLabel?.trim()) hints.push("표시 라벨을 입력해주세요.");
  if (!doc.source?.trim()) hints.push("출처를 입력해주세요.");
  if (!doc.title?.trim()) hints.push("제목을 입력해주세요.");
  if (body.length === 0 || body.every((line) => !line.trim()))
    hints.push("본문 문단을 1개 이상 입력해주세요.");
  if (chars > BODY_SOFT_LIMIT)
    hints.push(
      `본문이 ${chars}자입니다. ${BODY_SOFT_LIMIT}자를 넘으면 모바일에서 읽기 어렵습니다.`,
    );

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted">
        표시 라벨 (상단바 — 공지/신문을 이걸로 구분한다)
        <input
          value={p.sourceLabel ?? ""}
          onChange={(e) =>
            onChange({ ...payload, sourceLabel: e.target.value })
          }
          placeholder="공지사항"
          className={`mt-1 w-full ${INPUT}`}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-muted">
          출처 (기관명·매체명)
          <input
            value={doc.source ?? ""}
            onChange={(e) => setDoc({ source: e.target.value })}
            placeholder="국평오시청 청년정책과"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          제목
          <input
            value={doc.title ?? ""}
            onChange={(e) => setDoc({ title: e.target.value })}
            placeholder="「청년 문해력 향상 지원사업」 참가자 모집 공고"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          본문 문단 ({body.length}) · {chars}자
        </span>
        <button
          type="button"
          onClick={() => setDoc({ body: [...body, ""] })}
          className="text-xs font-medium text-brand"
        >
          + 문단 추가
        </button>
      </div>

      <ParagraphList value={body} onChange={(next) => setDoc({ body: next })} />

      <EditorHints hints={hints} />
    </div>
  );
}
