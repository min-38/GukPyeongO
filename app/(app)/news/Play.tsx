"use client";

import { type DocScenario } from "@/app/lib/doc-scenario";
import { SCENARIO_KIND_TITLES } from "@/app/lib/scenario-admin";

import DocScenarioView from "../play/DocScenario";
import PlayShell from "../play/PlayShell";
import NewsTutorial from "./NewsTutorial";

export default function NewsPlay({ scenario }: { scenario: DocScenario }) {
  return (
    <PlayShell
      doneTitle="기사 정독 완료!"
      tutorial={(start) => <NewsTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <DocScenarioView label={SCENARIO_KIND_TITLES.news} scenario={scenario} onFinish={onFinish} slug="news" />
      )}
    />
  );
}
