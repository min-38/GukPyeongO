"use client";

import { MOCK_SCENARIO } from "@/app/lib/mock-questions";

import ChatScenario from "./ChatScenario";
import PlayShell from "./PlayShell";
import Tutorial from "./Tutorial";

export default function PlayPage() {
  return (
    <PlayShell
      doneTitle="대화 종료!"
      tutorial={(start) => (
        <Tutorial roomTitle={MOCK_SCENARIO.roomTitle} onStart={start} />
      )}
      renderScenario={(onFinish) => (
        <ChatScenario scenario={MOCK_SCENARIO} onFinish={onFinish} />
      )}
    />
  );
}
