"use client";

import { type CommunityScenario } from "@/app/lib/community-scenario";
import { SCENARIO_KIND_TITLES } from "@/app/lib/scenario-admin";

import CommunityScenarioView from "../play/CommunityScenario";
import PlayShell from "../play/PlayShell";
import CommunityTutorial from "./CommunityTutorial";

export default function CommunityPlay({
  scenario,
}: {
  scenario: CommunityScenario;
}) {
  return (
    <PlayShell
      doneTitle="정독 완료!"
      tutorial={(start) => (
        <CommunityTutorial boardName={scenario.boardName} onStart={start} />
      )}
      renderScenario={(onFinish) => (
        <CommunityScenarioView label={SCENARIO_KIND_TITLES.community} scenario={scenario} onFinish={onFinish} />
      )}
    />
  );
}
