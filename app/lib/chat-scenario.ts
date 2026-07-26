// 메신저(회사 대화) 유형이 공유하는 데이터 형태.
// 다른 유형과 달리 지문이 문항마다 흩어져 있다 — 시나리오는 방 제목·상대 화자만 갖고,
// 대화(context)와 답변 후 반응(react*)은 문항이 각자 들고 간다.
// doc-scenario.ts / community-scenario.ts / email-scenario.ts / story-scenario.ts 와 같은 자리.

export interface ContextMessage {
  speaker: string;
  text: string;
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
  difficulty: 1 | 2 | 3; // 1 쉬움 / 2 중 / 3 킬러
  timeLimitSec: number;
}

export interface ChatScenario {
  id: string;
  roomTitle: string; // 채팅방 제목
  speaker: string; // 상대 화자 (반응 대사의 화자)
  steps: ChatStep[];
}
