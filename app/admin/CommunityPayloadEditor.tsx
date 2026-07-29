"use client";

import { EditorHints } from "./ListRow";
import { INPUT } from "./ui";

// 커뮤니티 지문 편집기 (#79, #99).
// 정본 타입은 app/lib/community-scenario.ts.
// 지문은 HTML 조각 두 덩어리로 쓴다 — 게시판 이름·작성자·글 제목·댓글까지 조각 안에 함께 넣는다.
// 예전 방식(boardName·post·comments[])으로 저장된 문제도 화면에는 그대로 나온다. 여기서 고칠 수만 없다.

interface CommunityPayload {
  postHtml?: string;
  commentsHtml?: string;
  [key: string]: unknown;
}

const POST_PLACEHOLDER = `<div class="flex items-center justify-between gap-2 border-b border-border pb-2">
  <h2 class="min-w-0 flex-1 font-bold leading-snug">이거 내가 예민한거임???</h2>
  <p class="shrink-0 text-xs text-muted tabular-nums">2026.07.29 01:32</p>
</div>

<div class="flex items-center justify-between gap-2 border-b border-border py-2">
  <div class="flex items-center gap-2">
    <div class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">익</div>
    <p class="text-xs text-muted">익명</p>
  </div>
  <div class="flex shrink-0 items-center gap-3 text-xs text-muted tabular-nums">
    <span>조회 1204</span><span>추천 37</span><span>댓글 6</span>
  </div>
</div>

<div class="flex flex-col gap-1 pt-3">
  <p>아 진짜 어의없어서 글쓴다</p>
</div>`;

const COMMENTS_PLACEHOLDER = `<div class="flex flex-col gap-3">
  <div class="flex gap-2">
    <div class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">ㅇ</div>
    <div class="min-w-0">
      <p class="text-xs text-muted">ㅇㅇ</p>
      <p class="text-[15px] leading-snug">금일이면 오늘인데 왜 사흘째 얘기가 나옴?</p>
    </div>
  </div>

  <!-- 대댓글: 왼쪽 세로선으로 잇는다 -->
  <div class="ml-4 border-l border-border pl-4">
    <div class="flex gap-2">
      <div class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">지</div>
      <div class="min-w-0">
        <p class="text-xs text-muted">지나가던행인</p>
        <p class="text-[15px] leading-snug">부장이 3일째 안 올렸단 거잖아ㅋㅋ</p>
      </div>
    </div>
  </div>
</div>`;

export default function CommunityPayloadEditor({
  payload,
  onChange,
}: {
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as CommunityPayload;

  const hints: string[] = [];
  if (!p.postHtml?.trim()) hints.push("원글 영역을 입력해주세요.");
  if (!p.commentsHtml?.trim())
    hints.push("댓글 영역이 비어 있습니다. 원글만 내보낼 건지 확인하세요.");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        지문 상자 안에 들어갈 HTML 조각만 씁니다(DOCTYPE·html·body 불필요).
        꾸밈은 앱 클래스로 — 쓸 수 있는 목록은 globals.css의 지문용 @source에
        있습니다. 목록에 없는 클래스는 스타일이 먹지 않습니다. &lt;style&gt;
        태그는 앱 전체에 새므로 쓰지 마세요.
      </p>

      <label className="text-xs font-medium text-muted">
        원글 영역 — 카드 표면을 두릅니다. 게시판·작성자·제목도 여기에 씁니다
        <textarea
          value={p.postHtml ?? ""}
          onChange={(e) => onChange({ ...payload, postHtml: e.target.value })}
          rows={14}
          placeholder={POST_PLACEHOLDER}
          className={`mt-1 w-full font-mono text-[13px] leading-relaxed ${INPUT}`}
        />
      </label>

      <label className="text-xs font-medium text-muted">
        댓글 영역 — 배경 없이 이어 붙습니다. 대댓글은 왼쪽 세로선으로 잇습니다
        <textarea
          value={p.commentsHtml ?? ""}
          onChange={(e) =>
            onChange({ ...payload, commentsHtml: e.target.value })
          }
          rows={14}
          placeholder={COMMENTS_PLACEHOLDER}
          className={`mt-1 w-full font-mono text-[13px] leading-relaxed ${INPUT}`}
        />
      </label>

      <EditorHints hints={hints} />
    </div>
  );
}
