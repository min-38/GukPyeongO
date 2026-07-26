"use client";

import {
  type CommunityComment,
  type CommunityPost,
} from "@/app/lib/community-scenario";

import { INPUT } from "./ui";

// 커뮤니티 지문 편집기 (#79).
// 정본 타입은 app/lib/community-scenario.ts — boardName·post·comments[].
// 댓글은 전부 한 번에 등장한다(#69). 문제마다 붙는 개념이 아니므로 여기서 통째로 관리한다.

interface CommunityPayload {
  boardName?: string;
  post?: Partial<CommunityPost>;
  comments?: CommunityComment[];
  [key: string]: unknown;
}

// 위/아래로 한 칸 옮긴 배열을 돌려준다. 범위를 벗어나면 원본 그대로.
function moved<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

function RowButtons({
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

export default function CommunityPayloadEditor({
  payload,
  onChange,
}: {
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as CommunityPayload;
  const post = p.post ?? {};
  const body = post.body ?? [];
  const comments = p.comments ?? [];

  const setPost = (next: Partial<CommunityPost>) =>
    onChange({ ...payload, post: { ...post, ...next } });
  const setBody = (next: string[]) => setPost({ body: next });
  const setComments = (next: CommunityComment[]) =>
    onChange({ ...payload, comments: next });

  const hints: string[] = [];
  if (!p.boardName?.trim()) hints.push("게시판 이름을 입력해주세요.");
  if (!post.author?.trim()) hints.push("작성자를 입력해주세요.");
  if (!post.title?.trim()) hints.push("글 제목을 입력해주세요.");
  if (body.length === 0 || body.every((l) => !l.trim()))
    hints.push("원글 본문을 1개 이상 입력해주세요.");
  if (comments.some((c) => !c.nick.trim() || !c.text.trim()))
    hints.push("닉네임·내용이 빈 댓글이 있습니다.");
  if (comments[0]?.reply)
    hints.push("첫 댓글이 대댓글입니다. 달릴 원댓글이 없습니다.");

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted">
        게시판 이름 (상단바)
        <input
          value={p.boardName ?? ""}
          onChange={(e) => onChange({ ...payload, boardName: e.target.value })}
          placeholder="국평오 갤러리"
          className={`mt-1 w-full ${INPUT}`}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-muted">
          작성자
          <input
            value={post.author ?? ""}
            onChange={(e) => setPost({ author: e.target.value })}
            placeholder="익명"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          글 제목
          <input
            value={post.title ?? ""}
            onChange={(e) => setPost({ title: e.target.value })}
            placeholder="이거 내가 예민한거임???"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          원글 본문 ({body.length}) · {body.join("").length}자
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
            <RowButtons
              onUp={() => setBody(moved(body, i, -1))}
              onDown={() => setBody(moved(body, i, 1))}
              onRemove={() => setBody(body.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          댓글 ({comments.length}) — 전부 한 번에 등장한다
        </span>
        <button
          type="button"
          onClick={() => setComments([...comments, { nick: "", text: "" }])}
          className="text-xs font-medium text-brand"
        >
          + 댓글 추가
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {comments.map((c, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 ${c.reply ? "pl-6" : ""}`}
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  value={c.nick}
                  onChange={(e) =>
                    setComments(
                      comments.map((x, j) =>
                        j === i ? { ...x, nick: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="닉네임"
                  className={`w-36 ${INPUT}`}
                />
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={!!c.reply}
                    onChange={(e) =>
                      setComments(
                        comments.map((x, j) =>
                          j === i ? { ...x, reply: e.target.checked } : x,
                        ),
                      )
                    }
                  />
                  대댓글
                </label>
              </div>
              <textarea
                value={c.text}
                onChange={(e) =>
                  setComments(
                    comments.map((x, j) =>
                      j === i ? { ...x, text: e.target.value } : x,
                    ),
                  )
                }
                rows={2}
                placeholder="댓글 내용"
                className={`w-full ${INPUT}`}
              />
            </div>
            <RowButtons
              onUp={() => setComments(moved(comments, i, -1))}
              onDown={() => setComments(moved(comments, i, 1))}
              onRemove={() => setComments(comments.filter((_, j) => j !== i))}
            />
          </li>
        ))}
        {comments.length === 0 && (
          <li className="py-3 text-center text-xs text-muted">
            댓글이 없습니다.
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
