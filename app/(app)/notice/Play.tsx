"use client";

import { type DocScenario } from "@/app/lib/doc-scenario";

import DocScenarioView from "../play/DocScenario";
import PlayShell from "../play/PlayShell";
import NoticeTutorial from "./NoticeTutorial";

export default function NoticePlay({ scenario }: { scenario: DocScenario }) {
  return (
    <PlayShell
      doneTitle="공고 정독 완료!"
      tutorial={(start) => <NoticeTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <DocScenarioView
          scenario={scenario}
          onFinish={onFinish}
          slug="notice"
        />
      )}
    />
  );
}
