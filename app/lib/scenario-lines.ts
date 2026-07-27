import { type ContextMessage } from "./chat-scenario";
import { type ScenarioKind } from "./scenario-admin";

// 지문을 유형별로 문단 배열로 펴는 자리 (#96).
// 어드민 미리보기(#77)가 쓰던 것을 옮겨왔다 — 문제 다시 보기도 같은 글을 정적으로 보여준다.
// 유형별 표면 컴포넌트는 타이머·등장 연출이 붙어 있어 다시 보기에는 맞지 않는다.

// 지문을 유형별로 훑어 읽을 수 있게 문단 배열로 편다.
export function payloadLines(
  kind: ScenarioKind,
  payload: Record<string, unknown>,
): string[] {
  const p = payload as {
    body?: string[];
    title?: string;
    doc?: { source?: string; title?: string; body?: string[] };
    post?: { author?: string; title?: string; body?: string[] };
    comments?: { nick?: string; text?: string }[];
    subject?: string;
    messages?: { from?: string; body?: string[] }[];
    roomTitle?: string;
    speaker?: string;
  };
  switch (kind) {
    case "notice":
    case "news":
      return [
        `[${p.doc?.source ?? ""}] ${p.doc?.title ?? ""}`,
        ...(p.doc?.body ?? []),
      ];
    case "story":
      return [p.title ?? "", ...(p.body ?? [])];
    case "community":
      return [
        `${p.post?.author ?? ""} — ${p.post?.title ?? ""}`,
        ...(p.post?.body ?? []),
        ...(p.comments ?? []).map((c) => `└ ${c.nick}: ${c.text}`),
      ];
    case "email":
      return [
        `제목: ${p.subject ?? ""}`,
        ...(p.messages ?? []).flatMap((m, i) => [
          `${i + 1}. ${m.from ?? ""}`,
          ...(m.body ?? []),
        ]),
      ];
    case "chat":
      return [`${p.roomTitle ?? ""} · 상대: ${p.speaker ?? ""}`];
    default:
      return [];
  }
}

// 메신저는 지문이 방 제목뿐이고 대화가 문항마다 흩어져 있다(#80).
// 그래서 다시 보기에서는 그 문항이 들고 있는 대사를 지문 자리에 편다.
export function chatContextLines(step: Record<string, unknown>): string[] {
  const context = (step.context ?? []) as ContextMessage[];
  return context.map(
    (m) => `${m.speaker}: ${m.text}${m.at ? ` (${m.at})` : ""}`,
  );
}
