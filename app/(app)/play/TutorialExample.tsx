"use client";

import { type ScenarioKind } from "@/app/lib/scenario-admin";
import { TUTORIAL_EXAMPLES } from "@/app/lib/tutorial-examples";

import SurfaceByKind from "./SurfaceByKind";

// 튜토리얼 예시 장 (#93).
// 손으로 흉내 낸 그림 대신 실제 표면을 그대로 돌린다 — 표면을 고쳐도 예시가 어긋나지 않는다.
// 예시 문항은 timeLimitSec이 0이라 제한시간 없이 눌러볼 수 있다(useScenario).
export default function TutorialExample({ kind }: { kind: ScenarioKind }) {
  const scenario = TUTORIAL_EXAMPLES[kind];
  if (!scenario) return null;

  return (
    // 표면은 부모 높이를 채우는 구조다. 튜토리얼이 정해준 자리를 그대로 쓴다.
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface-muted/30 p-3">
      {/* 예시는 채점하지 않는다 — 끝나도 아무 일도 일어나지 않는다. */}
      <SurfaceByKind kind={kind} scenario={scenario} onFinish={() => {}} />
    </div>
  );
}
