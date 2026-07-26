"use client";

import { type ChatScenario } from "@/app/lib/chat-scenario";

import ChatScenarioView from "./ChatScenario";
import PlayShell from "./PlayShell";
import Tutorial from "./Tutorial";

export default function ChatPlay({ scenario }: { scenario: ChatScenario }) {
  return (
    <PlayShell
      doneTitle="대화 종료!"
      tutorial={(start) => (
        <Tutorial roomTitle={scenario.roomTitle} onStart={start} />
      )}
      renderScenario={(onFinish) => (
        <ChatScenarioView scenario={scenario} onFinish={onFinish} slug="chat" />
      )}
    />
  );
}
