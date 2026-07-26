// 커뮤니티 유형이 공유하는 데이터 형태.
// "게시물 1개(원글 + 댓글 전체) + 문항 N개" — 원글과 댓글은 처음에 한 번에 보여준다.
// 문제마다 댓글이 추가되면 그게 정답 힌트가 되기 때문(#69).
// doc-scenario.ts / email-scenario.ts / story-scenario.ts 와 같은 자리.

export interface CommunityPost {
  author: string;
  title: string;
  body: string[]; // 문단(줄) 단위 — "안 정돈된 날것 톤"을 그대로
}

export interface CommunityComment {
  nick: string;
  text: string;
  reply?: boolean; // 대댓글(들여쓰기)
}

// 게시물 위에서 출제되는 문제 한 개. 콘텐츠는 게시물이 통째로 가지므로 문제 정보만.
export interface CommunityStep {
  id: string;
  type: string; // 요지·반어·논점이탈·맞춤법 등
  prompt: string;
  choices: string[];
  answerIndex: number;
  difficulty: 1 | 2 | 3; // 1 쉬움 / 2 중 / 3 킬러
  timeLimitSec: number;
}

export interface CommunityScenario {
  id: string;
  boardName: string;
  post: CommunityPost;
  comments: CommunityComment[];
  steps: CommunityStep[];
}
