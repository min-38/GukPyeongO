"use client";

import { type StoryScenario } from "@/app/lib/story-scenario";

import PlayShell from "../play/PlayShell";
import StoryScenarioView from "../play/StoryScenario";
import StoryTutorial from "./StoryTutorial";

export default function StoryPlay({ scenario }: { scenario: StoryScenario }) {
  return (
    <PlayShell
      doneTitle="이야기 정독 완료!"
      tutorial={(start) => <StoryTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <StoryScenarioView
          scenario={scenario}
          onFinish={onFinish}
          slug="story"
        />
      )}
    />
  );
}
