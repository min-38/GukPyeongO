"use client";

import { MOCK_EMAIL_REPLY } from "@/app/lib/mock-email-reply";

import EmailScenarioView from "../../play/EmailScenario";
import PlayShell from "../../play/PlayShell";
import ReplyTutorial from "./ReplyTutorial";

export default function EmailReplyPage() {
  return (
    <PlayShell
      doneTitle="대조 완료!"
      tutorial={(start) => <ReplyTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <EmailScenarioView scenario={MOCK_EMAIL_REPLY} onFinish={onFinish} />
      )}
    />
  );
}
