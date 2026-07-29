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
  reactCorrectSpeaker?: string;
  reactWrongSpeaker?: string;
  reactTimeoutSpeaker?: string;
  at?: string;
  date?: string;
}

const REACTIONS: {
  key: "reactCorrect" | "reactWrong" | "reactTimeout";
  speakerKey:
    | "reactCorrectSpeaker"
    | "reactWrongSpeaker"
    | "reactTimeoutSpeaker";
  label: string;
}[] = [
  {
    key: "reactCorrect",
    speakerKey: "reactCorrectSpeaker",
    label: "정답일 때",
  },
  { key: "reactWrong", speakerKey: "reactWrongSpeaker", label: "오답일 때" },
  {
    key: "reactTimeout",
    speakerKey: "reactTimeoutSpeaker",
    label: "무응답(시간 초과)일 때",
  },
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
      {/* 대화가 며칠에 걸칠 수 있다. 앞 문항과 날이 다르면 대화 가운데 구분선이 뜬다. */}
      <label className="mb-3 block text-xs text-muted">
        날짜 — 앞 문항과 다를 때만 대화에 표시됩니다. 같은 날이면 비워 두세요
        <input
          value={e.date ?? ""}
          onChange={(ev) => onChange({ ...extra, date: ev.target.value })}
          placeholder="2월 3일 월요일"
          className={`mt-1 w-full ${INPUT}`}
        />
      </label>

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
            <span className="flex w-24 shrink-0 flex-col gap-1">
              {/* 내가 이미 한 말이면 오른쪽 말풍선으로 나간다 — 대화가 오가다 문제가 나오게. */}
              <button
                type="button"
                onClick={() =>
                  setContext(
                    context.map((m, j) =>
                      j === i
                        ? m.mine
                          ? { ...m, mine: false, speaker: defaultSpeaker }
                          : { ...m, mine: true, speaker: "나" }
                        : m,
                    ),
                  )
                }
                className={`w-full rounded-lg px-2 py-1 text-[11px] font-bold ${
                  msg.mine
                    ? "bg-brand text-brand-foreground"
                    : "bg-surface-muted text-muted"
                }`}
              >
                {msg.mine ? "나" : "상대"}
              </button>
              {!msg.mine && (
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
                  className={`w-full ${INPUT}`}
                />
              )}
              <input
                value={msg.at ?? ""}
                onChange={(ev) =>
                  setContext(
                    context.map((m, j) =>
                      j === i ? { ...m, at: ev.target.value } : m,
                    ),
                  )
                }
                placeholder="오전 9:17"
                className={`w-full ${INPUT}`}
              />
            </span>
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
        <label className="text-xs text-muted">
          내 답장·상대 반응이 오간 시각 — 맥락 대사보다 뒤, 다음 문항보다 앞
          <input
            value={e.at ?? ""}
            onChange={(ev) => onChange({ ...extra, at: ev.target.value })}
            placeholder="오전 9:18"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <span className="text-xs font-medium text-muted">
          답변 후 상대 반응 — 무응답은 오답과 상황이 다르므로 따로 씁니다
        </span>
        {REACTIONS.map(({ key, speakerKey, label }) => (
          <label key={key} className="text-xs text-muted">
            {label}
            {/* 답하는 사람이 매번 같지는 않다. 비우면 지문의 상대 화자가 말한다. */}
            <span className="mt-1 flex gap-2">
              <input
                value={e[speakerKey] ?? ""}
                onChange={(ev) =>
                  onChange({ ...extra, [speakerKey]: ev.target.value })
                }
                placeholder={defaultSpeaker || "화자"}
                className={`w-24 shrink-0 ${INPUT}`}
              />
              <input
                value={(e[key] as string) ?? ""}
                onChange={(ev) => onChange({ ...extra, [key]: ev.target.value })}
                className={`flex-1 ${INPUT}`}
              />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
