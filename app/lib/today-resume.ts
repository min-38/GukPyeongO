import { stepPoints } from "./scenario-points";
import { type ReviewStep } from "./quiz";

// 이어풀기 (#109).
// 나갔다 돌아온 사람이 어디까지 갔었는지를 서버가 돌려준 "이미 답한 문항"으로 되짚는다.
// 답은 처음부터 서버에 있었다(scenario_step_answers) — 브라우저가 잃는 것은 "몇 번째였나"뿐이다.
//
// 지문 단위로 끊는다. 풀던 지문은 처음부터 다시 보게 되지만, 문항 단위로 끊으려면
// 유형별 표면(대화 재생·읽기 타이머)을 전부 중간부터 시작하게 만들어야 해서 값에 비해 크다.
//
// 서버·클라이언트 어느 쪽도 아닌 중립 모듈에 둔다 — 화면에서 떼어 놔야 이 셈을 따로 검증할 수 있다.

export interface AnsweredStep {
  slug: string;
  stepKey: string;
  choiceIndex: number | null;
  answerIndex: number;
}

// 표면이 받는 지문 한 편. 여기서 필요한 것은 slug 와 문항 목록뿐이다.
export interface ResumableScenario {
  slug: string;
  content: Record<string, unknown>;
}

export interface Resumed {
  // 이어서 열 지문 번호. 0 이면 처음부터다. 지문 수와 같으면 다 풀고 채점만 안 받은 것이다.
  index: number;
  // 다 푼 지문에서 얻은 점수. 진행 중 점수와 같은 셈법이라 이어 붙일 수 있다.
  score: number;
  // 다시 보기 기록. 복원하지 않으면 결과 화면의 앞부분이 통째로 빈다.
  review: ReviewStep[];
}

export function resumeFrom(
  scenarios: ResumableScenario[],
  answered: AnsweredStep[],
): Resumed {
  const bySlug = new Map<string, Map<string, AnsweredStep>>();
  for (const a of answered) {
    const forSlug = bySlug.get(a.slug) ?? new Map<string, AnsweredStep>();
    forSlug.set(a.stepKey, a);
    bySlug.set(a.slug, forSlug);
  }

  let index = 0;
  let score = 0;
  const review: ReviewStep[] = [];

  for (const scenario of scenarios) {
    const steps = (scenario.content.steps ?? []) as {
      id: string;
      points?: number | null;
      difficulty?: number;
    }[];
    const forSlug = bySlug.get(scenario.slug);
    // 한 문항이라도 안 풀었으면 그 지문부터 다시 시작한다.
    if (steps.length === 0 || !steps.every((s) => forSlug?.has(s.id))) break;

    for (const step of steps) {
      const a = forSlug!.get(step.id)!;
      review.push({
        slug: scenario.slug,
        stepKey: step.id,
        choiceIndex: a.choiceIndex,
        answerIndex: a.answerIndex,
      });
      // 최종 점수는 어차피 서버가 저장된 답으로 다시 계산한다(/api/today-grade).
      // 여기 값은 진행 중 화면과 브라우저 기록에만 쓰인다.
      if (a.choiceIndex === a.answerIndex) score += stepPoints(step);
    }
    index += 1;
  }

  return { index, score, review };
}
