"use client";

import { MOCK_STORY } from "@/app/lib/mock-story";

import PlayShell from "../play/PlayShell";
import StoryScenarioView from "../play/StoryScenario";
import StoryTutorial from "./StoryTutorial";

export default function StoryPage() {
  return (
    <PlayShell
      doneTitle="이야기 정독 완료!"
      tutorial={(start) => <StoryTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <StoryScenarioView scenario={MOCK_STORY} onFinish={onFinish} />
      )}
    />
  );
}
