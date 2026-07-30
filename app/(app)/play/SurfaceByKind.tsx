"use client";

import {
  SCENARIO_KIND_TITLES,
  type ScenarioKind,
} from "@/app/lib/scenario-admin";
import { type OnAnswered } from "@/app/lib/useScenario";

import ChatScenarioView from "./ChatScenario";
import CommunityScenarioView from "./CommunityScenario";
import DocScenarioView from "./DocScenario";
import EmailScenarioView from "./EmailScenario";
import StoryScenarioView from "./StoryScenario";
import WordScenarioView from "./WordScenario";

// 유형에 맞는 표면을 고른다 (#87).
// 편성된 문제는 유형이 섞여 나오고, 어드민 미리보기도 같은 분기가 필요해 한 곳에 모았다.
// 지문 구조가 유형마다 달라 표면별 타입으로 좁혀 넘긴다.
export default function SurfaceByKind({
  kind,
  scenario,
  slug,
  onFinish,
  onAnswered,
}: {
  kind: ScenarioKind;
  scenario: Record<string, unknown>;
  // DB에서 온 시나리오면 정답 판정을 서버에 맡긴다(#83).
  slug?: string;
  onFinish: (score: number) => void;
  // 회차 채점(#89)을 위해 고른 답을 위로 흘려보낸다.
  onAnswered?: OnAnswered;
}) {
  // 상단바 이름은 유형에서 나온다(#99) — 지문에 적힌 게시판 이름·방 제목은 쓰지 않는다.
  const common = {
    scenario: scenario as never,
    label: SCENARIO_KIND_TITLES[kind],
    slug,
    onFinish,
    onAnswered,
  };
  switch (kind) {
    // 공지·신문·계약서·사용설명서는 유형은 다르지만 읽는 화면은 같다 — 문서 한 장을 읽는다.
    case "notice":
    case "news":
    case "contract":
    case "manual":
      return <DocScenarioView {...common} />;
    case "community":
      return <CommunityScenarioView {...common} />;
    case "email":
      return <EmailScenarioView {...common} />;
    case "story":
      return <StoryScenarioView {...common} />;
    case "chat":
      return <ChatScenarioView {...common} />;
    // 어휘는 지문이 없다 — 문항만 이어서 푼다(#101).
    case "word":
      return <WordScenarioView {...common} />;
    default:
      return (
        <p className="py-10 text-center text-sm text-muted">
          이 유형은 아직 표시할 수 없습니다.
        </p>
      );
  }
}
