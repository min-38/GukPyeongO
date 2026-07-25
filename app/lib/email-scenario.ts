// 이메일 유형이 공유하는 데이터 형태.
// 문서형(공지·신문)과 다른 점: 대조할 원문이 스레드 안에 들어있다.
// 그래서 "답장이 원문을 잘못 옮긴 곳 찾기" 문제를 낼 수 있다.

export interface EmailMessage {
  from: string;
  address: string;
  to: string;
  cc?: string;
  at: string;
  body: string[];
  quote?: string[]; // 접힌 인용. 펼쳐야 원문과 대조할 수 있다.
}

export interface EmailStep {
  id: string;
  type: string; // 귀속·결정·수신범위·세부정보·오기재
  prompt: string;
  choices: string[];
  answerIndex: number;
  difficulty: 1 | 2 | 3;
  timeLimitSec: number;
  // 이 문제 시점에 몇 번째 메일까지 보이는가. 생략하면 스레드 전체.
  // 원문으로 먼저 묻고 답장을 나중에 여는 순차 공개용. 오름차순이어야 한다.
  showUpTo?: number;
}

export interface EmailScenario {
  id: string;
  sourceLabel: string; // 상단바 라벨
  subject: string; // 스레드 제목 — 최상단에 한 번만
  messages: EmailMessage[]; // 시간 오름차순
  steps: EmailStep[];
  // thread(기본) — 짧은 회신을 세로로 쌓아 오간 흔적을 훑는다.
  // toggle — 장문 원문과 답장을 탭으로 갈아끼우며 대조한다. 세로로 쌓으면 대조가 안 되므로.
  layout?: "thread" | "toggle";
}
