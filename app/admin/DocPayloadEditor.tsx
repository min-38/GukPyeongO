"use client";

import { INPUT } from "./ui";

// 문서형(공지·신문) 지문 편집기 (#78).
// 정본 타입은 app/lib/doc-scenario.ts 의 DocScenario.doc — source·title·body[].
// 지문 JSON을 직접 고치던 자리를 대신한다. 본문은 문단 단위로 추가/삭제/순서 변경한다.

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

  const setBody = (next: string[]) => setDoc({ body: next });

  function moveParagraph(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= body.length) return;
    const next = [...body];
    [next[index], next[to]] = [next[to], next[index]];
    setBody(next);
  }

  const chars = body.join("").length;
  const hints: string[] = [];
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
          onClick={() => setBody([...body, ""])}
          className="text-xs font-medium text-brand"
        >
          + 문단 추가
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {body.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2 w-4 shrink-0 text-xs text-muted">
              {i + 1}
            </span>
            <textarea
              value={line}
              onChange={(e) =>
                setBody(body.map((l, j) => (j === i ? e.target.value : l)))
              }
              rows={2}
              className={`flex-1 ${INPUT}`}
            />
            <span className="mt-1 flex shrink-0 flex-col gap-1 text-xs text-muted">
              <button type="button" onClick={() => moveParagraph(i, -1)}>
                ↑
              </button>
              <button type="button" onClick={() => moveParagraph(i, 1)}>
                ↓
              </button>
              <button
                type="button"
                onClick={() => setBody(body.filter((_, j) => j !== i))}
                className="text-red-500"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
        {body.length === 0 && (
          <li className="py-3 text-center text-xs text-muted">
            문단이 없습니다.
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
