"use client";

import { MOCK_NOTICE } from "@/app/lib/mock-notice";

import DocScenarioView from "../play/DocScenario";
import PlayShell from "../play/PlayShell";
import NoticeTutorial from "./NoticeTutorial";

export default function NoticePage() {
  return (
    <PlayShell
      doneTitle="공고 정독 완료!"
      tutorial={(start) => <NoticeTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <DocScenarioView scenario={MOCK_NOTICE} onFinish={onFinish} />
      )}
    />
  );
}
