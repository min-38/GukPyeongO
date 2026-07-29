// 이메일 유형이 공유하는 데이터 형태.
// 문서형(공지·신문)과 다른 점: 대조할 원문이 스레드 안에 들어있다.
// 그래서 "답장이 원문을 잘못 옮긴 곳 찾기" 문제를 낼 수 있다.

export interface EmailMessage {
  // 메일 한 통을 HTML 조각으로 쓸 때(#99). 있으면 아래 항목 대신 이걸 그린다.
  html?: string;
  from?: string;
  address?: string;
  to?: string;
  cc?: string;
  at?: string;
  body?: string[];
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
  // 문제가 열리기 전 지문을 훑는 시간(#99). 없으면 글 길이로 계산한다.
  readSec?: number;
  id: string;
  sourceLabel: string; // 상단바 라벨
  subject: string; // 스레드 제목 — 최상단에 한 번만
  messages: EmailMessage[]; // 시간 오름차순
  steps: EmailStep[];
}
