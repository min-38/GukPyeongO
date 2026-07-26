"use client";

import { type ContextMessage } from "@/app/lib/chat-scenario";

import { INPUT } from "./ui";

// 메신저 문항의 전용 칸 (#80).
// 이 문제 앞에 이어붙는 대화(context)와, 답변 후 상대 반응 세 가지를 문항이 각자 갖는다.
// 저장은 scenario_steps.extra 로 들어간다.

interface ChatExtra {
  context?: ContextMessage[];
  reactCorrect?: string;
  reactWrong?: string;
  reactTimeout?: string;
}

const REACTIONS: {
  key: "reactCorrect" | "reactWrong" | "reactTimeout";
  label: string;
}[] = [
  { key: "reactCorrect", label: "정답일 때" },
  { key: "reactWrong", label: "오답일 때" },
  { key: "reactTimeout", label: "무응답(시간 초과)일 때" },
];

export default function ChatStepFields({
  extra,
  defaultSpeaker,
  onChange,
}: {
  extra: Record<string, unknown>;
  defaultSpeaker: string;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const e = extra as ChatExtra;
  const context = e.context ?? [];

  const setContext = (next: ContextMessage[]) =>
    onChange({ ...extra, context: next });

  function move(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= context.length) return;
    const next = [...context];
    [next[index], next[to]] = [next[to], next[index]];
    setContext(next);
  }

  return (
    <div className="mt-3 rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">
          이 문제 앞에 오는 대화 ({context.length})
        </span>
        <button
          type="button"
          onClick={() =>
            setContext([...context, { speaker: defaultSpeaker, text: "" }])
          }
          className="text-xs font-medium text-brand"
        >
          + 대사 추가
        </button>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {context.map((msg, i) => (
          <li key={i} className="flex items-start gap-2">
            <input
              value={msg.speaker}
              onChange={(ev) =>
                setContext(
                  context.map((m, j) =>
                    j === i ? { ...m, speaker: ev.target.value } : m,
                  ),
                )
              }
              placeholder="화자"
              className={`w-24 ${INPUT}`}
            />
            <textarea
              value={msg.text}
              onChange={(ev) =>
                setContext(
                  context.map((m, j) =>
                    j === i ? { ...m, text: ev.target.value } : m,
                  ),
                )
              }
              rows={2}
              placeholder="대사"
              className={`flex-1 ${INPUT}`}
            />
            <span className="mt-1 flex shrink-0 flex-col gap-1 text-xs text-muted">
              <button type="button" onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)}>
                ↓
              </button>
              <button
                type="button"
                onClick={() => setContext(context.filter((_, j) => j !== i))}
                className="text-red-500"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
        {context.length === 0 && (
          <li className="py-2 text-center text-xs text-muted">
            대사가 없습니다.
          </li>
        )}
      </ul>

      <div className="mt-3 flex flex-col gap-2">
        <span className="text-xs font-medium text-muted">
          답변 후 상대 반응 — 무응답은 오답과 상황이 다르므로 따로 씁니다
        </span>
        {REACTIONS.map(({ key, label }) => (
          <label key={key} className="text-xs text-muted">
            {label}
            <input
              value={(e[key] as string) ?? ""}
              onChange={(ev) => onChange({ ...extra, [key]: ev.target.value })}
              className={`mt-1 w-full ${INPUT}`}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
