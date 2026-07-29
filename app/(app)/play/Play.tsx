"use client";

import { type ChatScenario } from "@/app/lib/chat-scenario";
import { SCENARIO_KIND_TITLES } from "@/app/lib/scenario-admin";

import ChatScenarioView from "./ChatScenario";
import PlayShell from "./PlayShell";
import Tutorial from "./Tutorial";

export default function ChatPlay({ scenario }: { scenario: ChatScenario }) {
  return (
    <PlayShell
      doneTitle="대화 종료!"
      tutorial={(start) => <Tutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <ChatScenarioView label={SCENARIO_KIND_TITLES.chat} scenario={scenario} onFinish={onFinish} slug="chat" />
      )}
    />
  );
}
