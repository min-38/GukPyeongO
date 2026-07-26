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
