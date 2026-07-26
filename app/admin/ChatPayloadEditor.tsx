"use client";

import { EditorHints } from "./ListRow";
import { INPUT } from "./ui";

// 메신저 지문 편집기 (#80).
// 정본 타입은 app/lib/chat-scenario.ts — 시나리오가 갖는 건 roomTitle·speaker 뿐이다.
// 대화(context)와 답변 후 반응은 문항마다 다르므로 문항 편집기(ChatStepFields)에서 다룬다.

interface ChatPayload {
  roomTitle?: string;
  speaker?: string;
  [key: string]: unknown;
}

export default function ChatPayloadEditor({
  payload,
  onChange,
}: {
  payload: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const p = payload as ChatPayload;

  const hints: string[] = [];
  if (!p.roomTitle?.trim()) hints.push("대화방 제목을 입력해주세요.");
  if (!p.speaker?.trim())
    hints.push("상대 화자를 입력해주세요. 반응 대사가 이 이름으로 나갑니다.");

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-muted">
          대화방 제목 (상단바)
          <input
            value={p.roomTitle ?? ""}
            onChange={(e) =>
              onChange({ ...payload, roomTitle: e.target.value })
            }
            placeholder="회사 메신저"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          상대 화자
          <input
            value={p.speaker ?? ""}
            onChange={(e) => onChange({ ...payload, speaker: e.target.value })}
            placeholder="김부장"
            className={`mt-1 w-full ${INPUT}`}
          />
        </label>
      </div>

      <p className="text-xs text-muted">
        대화 내용과 답변 후 반응은 아래 문항마다 입력합니다. 타이핑 연출 속도는
        대사 길이로 자동 계산됩니다.
      </p>

      <EditorHints hints={hints} />
    </div>
  );
}
