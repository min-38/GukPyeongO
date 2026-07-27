"use client";

import { type ScenarioKind } from "@/app/lib/scenario-admin";

import ChatScenarioView from "./ChatScenario";
import CommunityScenarioView from "./CommunityScenario";
import DocScenarioView from "./DocScenario";
import EmailScenarioView from "./EmailScenario";
import StoryScenarioView from "./StoryScenario";

// 유형에 맞는 표면을 고른다 (#87).
// 편성된 문제는 유형이 섞여 나오고, 어드민 미리보기도 같은 분기가 필요해 한 곳에 모았다.
// 지문 구조가 유형마다 달라 표면별 타입으로 좁혀 넘긴다.
export default function SurfaceByKind({
  kind,
  scenario,
  slug,
  onFinish,
}: {
  kind: ScenarioKind;
  scenario: Record<string, unknown>;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onFinish: (score: number) => void;
}) {
  const common = { scenario: scenario as never, slug, onFinish };
  switch (kind) {
    case "doc":
      return <DocScenarioView {...common} />;
    case "community":
      return <CommunityScenarioView {...common} />;
    case "email":
      return <EmailScenarioView {...common} />;
    case "story":
      return <StoryScenarioView {...common} />;
    case "chat":
      return <ChatScenarioView {...common} />;
    default:
      return (
        <p className="py-10 text-center text-sm text-muted">
          이 유형은 아직 표시할 수 없습니다.
        </p>
      );
  }
}
