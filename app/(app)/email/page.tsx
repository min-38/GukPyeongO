"use client";

import { MOCK_EMAIL } from "@/app/lib/mock-email";

import EmailScenarioView from "../play/EmailScenario";
import PlayShell from "../play/PlayShell";
import EmailTutorial from "./EmailTutorial";

export default function EmailPage() {
  return (
    <PlayShell
      doneTitle="메일 정독 완료!"
      tutorial={(start) => <EmailTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <EmailScenarioView scenario={MOCK_EMAIL} onFinish={onFinish} />
      )}
    />
  );
}
