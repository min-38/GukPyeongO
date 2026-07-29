"use client";

import { type DocScenario } from "@/app/lib/doc-scenario";
import { SCENARIO_KIND_TITLES } from "@/app/lib/scenario-admin";

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
          label={SCENARIO_KIND_TITLES.notice}
          scenario={scenario}
          onFinish={onFinish}
          slug="notice"
        />
      )}
    />
  );
}
