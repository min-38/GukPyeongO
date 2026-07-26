"use client";

import { type CommunityScenario } from "@/app/lib/community-scenario";

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
        <CommunityScenarioView scenario={scenario} onFinish={onFinish} />
      )}
    />
  );
}
