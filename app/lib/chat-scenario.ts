// 메신저(회사 대화) 유형이 공유하는 데이터 형태.
// 다른 유형과 달리 지문이 문항마다 흩어져 있다 — 시나리오는 방 제목·상대 화자만 갖고,
// 대화(context)와 답변 후 반응(react*)은 문항이 각자 들고 간다.
// doc-scenario.ts / community-scenario.ts / email-scenario.ts / story-scenario.ts 와 같은 자리.

export interface ContextMessage {
  speaker: string;
  text: string;
  at?: string; // 보낸 시각. "오전 9:17" 처럼 그대로 찍는 문자열 (email-scenario의 at과 같은 방식)
  // 내가 이미 한 말(오른쪽 말풍선). 대화가 오가다 문제가 나오게 하려면 필요하다 —
  // 이게 없으면 '나'는 답을 고를 때만 입을 연다.
  mine?: boolean;
}

export interface ChatStep {
  id: string;
  type: string; // 유형 (어휘·화법·문법 등)
  context: ContextMessage[]; // 이 문제 앞에 이어붙는 대화
  prompt: string; // 내 속마음 — "어떻게 답장하지?"
  choices: string[];
  answerIndex: number;
  reactCorrect: string;
  reactWrong: string;
  reactTimeout: string; // 시간 초과(무응답) 시 — 오답과 상황이 다르다
  // 반응 대사를 누가 하는지. 단톡이면 답하는 사람이 매번 같지 않다.
  // 비우면 지문의 상대 화자(ChatScenario.speaker)가 말한다.
  reactCorrectSpeaker?: string;
  reactWrongSpeaker?: string;
  reactTimeoutSpeaker?: string;
  // 내 답장과 상대 반응이 오간 시각. 대화는 문항이 진행되며 앞으로 흐른다 —
  // 맥락 대사의 at 뒤, 다음 문항의 첫 대사보다는 앞이어야 한다.
  at?: string;
  // 이 문항의 대화가 오간 날. "2월 3일 월요일"처럼 그대로 찍는 문자열(at과 같은 방식).
  // 대화가 며칠에 걸칠 수 있으므로, 앞 문항과 날이 다르면 구분선을 넣는다.
  date?: string;
  difficulty: 1 | 2 | 3; // 1 쉬움 / 2 중 / 3 킬러
  timeLimitSec: number;
}

export interface ChatScenario {
  id: string;
  speaker: string; // 상대 화자 (반응 대사의 화자)
  steps: ChatStep[];
}

// 화면 말풍선 중 시각을 달 것만 고른다.
// 이름·프로필은 묶음의 첫 줄에만 붙는다(#93). 시각은 같은 규칙으로 마지막 줄에만 붙는다 —
// 같은 사람이 같은 시각에 연달아 보냈으면 묶음이 끝나는 줄에서 한 번.
export interface TimedBubble {
  side: "them" | "me";
  speaker: string;
  at?: string;
}

// 이 문항에서 날짜 구분선을 찍어야 하면 그 날짜를, 아니면 undefined.
// 앞 문항까지 화면에 찍힌 마지막 날과 비교한다 — 날짜를 비워 둔 문항은 앞 날을 이어간다.
export function dateMark(
  steps: { date?: string }[],
  index: number,
): string | undefined {
  const cur = steps[index]?.date;
  if (!cur) return undefined;
  const prev = steps
    .slice(0, index)
    .reduce<string | undefined>((d, s) => s.date ?? d, undefined);
  return cur === prev ? undefined : cur;
}

export function showsTime(bubbles: TimedBubble[], index: number): boolean {
  const b = bubbles[index];
  if (!b?.at) return false;
  const next = bubbles[index + 1];
  return !(
    next?.side === b.side &&
    next.speaker === b.speaker &&
    next.at === b.at
  );
}
