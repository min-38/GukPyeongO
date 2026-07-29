"use client";

// 지문 편집기가 공유하는 목록 조작 (#81).
// 문단·댓글·대사·메일 모두 "위/아래로 옮기고 지우는" 같은 손놀림이라 한 곳에 모았다.

// 위/아래로 한 칸 옮긴 배열을 돌려준다. 범위를 벗어나면 원본 그대로.
export function moved<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

export function RowButtons({
  onUp,
  onDown,
  onRemove,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <span className="mt-1 flex shrink-0 flex-col gap-1 text-xs text-muted">
      <button type="button" onClick={onUp}>
        ↑
      </button>
      <button type="button" onClick={onDown}>
        ↓
      </button>
      <button type="button" onClick={onRemove} className="text-red-500">
        ✕
      </button>
    </span>
  );
}

// 저장 전 확인할 것들. 다섯 편집기가 같은 모양으로 그리던 것을 모았다.
export function EditorHints({ hints }: { hints: string[] }) {
  if (hints.length === 0) return null;
  return (
    <ul className="flex flex-col gap-0.5 text-xs text-amber-600 dark:text-amber-400">
      {hints.map((h, i) => (
        <li key={i}>· {h}</li>
      ))}
    </ul>
  );
}

// 문단 배열 편집(번호 + textarea + 이동/삭제). 문서·커뮤니티·서사 본문이 같은 손놀림이다.
export function ParagraphList({
  value,
  onChange,
  rows = 2,
  emptyText = "문단이 없습니다.",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  rows?: number;
  emptyText?: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {value.map((line, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-2 w-4 shrink-0 text-xs text-muted">{i + 1}</span>
          <textarea
            value={line}
            onChange={(e) =>
              onChange(value.map((l, j) => (j === i ? e.target.value : l)))
            }
            rows={rows}
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
          <RowButtons
            onUp={() => onChange(moved(value, i, -1))}
            onDown={() => onChange(moved(value, i, 1))}
            onRemove={() => onChange(value.filter((_, j) => j !== i))}
          />
        </li>
      ))}
      {value.length === 0 && (
        <li className="py-3 text-center text-xs text-muted">{emptyText}</li>
      )}
    </ul>
  );
}

// 본문 한 덩어리 ↔ 문단 배열 (#99).
// 저장 형태는 문단 배열 그대로 두고, 편집만 텍스트 한 칸으로 한다 —
// 빈 줄이 문단을 가른다. 문단 안의 줄바꿈(번호 목록 등)은 그대로 살린다.
// 빈 문단을 버리지 않는다 — 타이핑 중에 빈 줄을 지워버리면 문단을 새로 시작할 수가 없다.
// 화면과 시드는 빈 문단을 건너뛴다.
export function toParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.replace(/[ \t]+$/gm, ""));
}

export function fromParagraphs(body: string[]): string {
  return body.join("\n\n");
}
