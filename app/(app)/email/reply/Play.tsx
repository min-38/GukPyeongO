"use client";

import { type EmailScenario } from "@/app/lib/email-scenario";
import { SCENARIO_KIND_TITLES } from "@/app/lib/scenario-admin";

import EmailScenarioView from "../../play/EmailScenario";
import PlayShell from "../../play/PlayShell";
import EmailTutorial from "../EmailTutorial";

export default function EmailReplyPlay({
  scenario,
}: {
  scenario: EmailScenario;
}) {
  return (
    <PlayShell
      doneTitle="대조 완료!"
      tutorial={(start) => <EmailTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <EmailScenarioView
          label={SCENARIO_KIND_TITLES.email}
          scenario={scenario}
          onFinish={onFinish}
          slug="email-reply"
        />
      )}
    />
  );
}
