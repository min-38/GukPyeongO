// 문서형 유형(공지·신문)이 공유하는 데이터 형태.
// "문서 1개 + 문제 여러 개" — 커뮤니티에서 댓글을 뺀 구조.

export interface DocContent {
  source: string; // 출처/발신 (기관명·매체명)
  title: string;
  body: string[]; // 문단(줄) 단위
  // 지문을 HTML 조각으로 쓸 때(#99). 있으면 body 대신 이걸 그대로 그린다.
  // <div> 안에 들어갈 조각만 — DOCTYPE·html·body 태그는 필요 없다.
  html?: string;
}

// 문서 위에서 출제되는 문제 한 개. 콘텐츠는 문서가 통째로 가지므로 문제 정보만.
export interface DocStep {
  id: string;
  type: string; // 세부정보·낚시조항·조건판단·주제·추론·사실판단 등
  prompt: string;
  choices: string[];
  answerIndex: number;
  difficulty: 1 | 2 | 3; // 1 쉬움 / 2 중 / 3 킬러
  timeLimitSec: number;
}

export interface DocScenario {
  // 문제가 열리기 전 지문을 훑는 시간(#99). 없으면 글 길이로 계산한다.
  readSec?: number;
  id: string;
  sourceLabel: string; // 상단바 라벨 (예: "공지사항", "국평오일보")
  doc: DocContent; // 처음에 한 번에 보여준다
  steps: DocStep[];
}
