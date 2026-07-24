"use client";

import { MOCK_COMMUNITY } from "@/app/lib/mock-community";

import CommunityScenarioView from "../play/CommunityScenario";
import PlayShell from "../play/PlayShell";
import CommunityTutorial from "./CommunityTutorial";

export default function CommunityPage() {
  return (
    <PlayShell
      doneTitle="정독 완료!"
      tutorial={(start) => (
        <CommunityTutorial
          boardName={MOCK_COMMUNITY.boardName}
          onStart={start}
        />
      )}
      renderScenario={(onFinish) => (
        <CommunityScenarioView scenario={MOCK_COMMUNITY} onFinish={onFinish} />
      )}
    />
  );
}
