"use client";

import { HTML_GUIDE, HtmlField } from "./HtmlField";
import { EditorHints } from "./ListRow";

// 문서형(공지·신문) 지문 편집기 (#78, #99).
// 정본 타입은 app/lib/doc-scenario.ts.
// 지문은 HTML 조각 하나로 쓴다 — 출처·제목까지 조각 안에 함께 넣는다.
// 예전 방식(doc.source·title·body[])으로 저장된 문제도 화면에는 그대로 나온다.

interface DocPayload {
  doc?: { source?: string; title?: string; body?: string[]; html?: string };
  [key: string]: unknown;
}

const PLACEHOLDER = `<p class="text-xs font-medium text-brand">국평오시청 청년정책과</p>
<h2 class="mb-3 text-lg font-bold leading-snug">「청년 문해력 향상 지원사업」 참가자 모집 공고</h2>

<div class="flex flex-col gap-2">
  <p>1. 신청기간: 공고일 ~ 금일 18:00까지 (기간 엄수)</p>
  <p>2. 모집인원: 0명 (예산 소진으로 이번 회차 신규 선발 없음)</p>
  <p>3. 참가비: 무료 (단, 교재비 50,000원은 본인 부담)</p>
</div>`;

export default function DocPayloadEditor({
  payload,
  onChange,
}: {
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as DocPayload;
  const doc = p.doc ?? {};

  const hints: string[] = [];
  if (!doc.html?.trim()) hints.push("지문을 입력해주세요.");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{HTML_GUIDE}</p>

      <HtmlField
        label="지문 — 카드 표면을 두릅니다. 출처·제목도 여기에 씁니다"
        value={doc.html ?? ""}
        placeholder={PLACEHOLDER}
        onChange={(html) => onChange({ ...payload, doc: { ...doc, html } })}
      />

      <EditorHints hints={hints} />
    </div>
  );
}
