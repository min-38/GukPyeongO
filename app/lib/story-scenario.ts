// 서사 읽기 유형이 쓰는 데이터 형태.
//
// 문서형(공지·신문)과 다른 점: 지문이 길어 "읽는 단계"를 따로 둔다.
// 공용 readMs는 상한이 2.6초라 긴 지문에서는 다 읽기도 전에 타이머가 돈다.
// 그래서 읽기 전용 카운트다운을 주고, 다 읽으면 스스로 문제로 넘어가게 한다.
// 지문은 문제를 푸는 동안에도 위에 그대로 남는다 — 못 돌아보면 기억력 시험이 된다.

export interface StoryStep {
  id: string;
  type: string; // 세부정보·인물 비교·생략된 정보·근거 판단·서술자 신뢰성
  prompt: string;
  choices: string[];
  answerIndex: number;
  difficulty: 1 | 2 | 3;
  timeLimitSec: number;
}

export interface StoryScenario {
  id: string;
  sourceLabel: string; // 상단바 라벨
  source: string; // 상황 라벨 (예: "명절 전날")
  title: string;
  body: string[]; // 문단 단위
  readSec: number; // 문제 전에 주는 읽기 시간. 조기 시작 가능
  steps: StoryStep[];
}
