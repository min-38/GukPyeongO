// 난이도 → 배점.
// 서버(회차 채점 #89)와 클라이언트(진행 중 점수)가 같은 값을 써야 해서
// "use client" 가 붙지 않은 중립 모듈에 둔다.
// 클라이언트 모듈에 두면 서버에서 import 할 때 실제 값 대신 참조가 넘어와 0점이 된다.
//
// 킬러(3)를 크게 둬 쉬운 것만 맞혀선 고득점이 안 되게 한다.
export const POINTS_BY_DIFFICULTY: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 3,
  3: 8,
};

// 문항 배점(#99). 이제 문항이 직접 점수를 갖는다 — 없으면(옛 데이터) 난이도 환산표를 쓴다.
export function stepPoints(step: {
  points?: number | null;
  difficulty?: number;
}): number {
  if (typeof step.points === "number" && step.points > 0) return step.points;
  return POINTS_BY_DIFFICULTY[(step.difficulty ?? 2) as 1 | 2 | 3] ?? 0;
}
