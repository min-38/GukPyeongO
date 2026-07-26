"use client";

import { type EmailScenario } from "@/app/lib/email-scenario";

import EmailScenarioView from "../play/EmailScenario";
import PlayShell from "../play/PlayShell";
import EmailTutorial from "./EmailTutorial";

export default function EmailPlay({ scenario }: { scenario: EmailScenario }) {
  return (
    <PlayShell
      doneTitle="메일 정독 완료!"
      tutorial={(start) => <EmailTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <EmailScenarioView
          scenario={scenario}
          onFinish={onFinish}
          slug="email"
        />
      )}
    />
  );
}
