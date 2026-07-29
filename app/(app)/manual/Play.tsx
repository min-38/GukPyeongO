"use client";

import { type DocScenario } from "@/app/lib/doc-scenario";
import { SCENARIO_KIND_TITLES } from "@/app/lib/scenario-admin";

import PlayShell from "../play/PlayShell";
import DocScenarioView from "../play/DocScenario";
import ManualTutorial from "./ManualTutorial";

// 사용설명서 유형 맛보기 페이지 (#99).
export default function ManualPlay({ scenario }: { scenario: DocScenario }) {
  return (
    <PlayShell
      doneTitle="사용설명서 끝!"
      tutorial={(start) => <ManualTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <DocScenarioView
          label={SCENARIO_KIND_TITLES.manual}
          scenario={scenario}
          onFinish={onFinish}
          slug="manual-robot"
        />
      )}
    />
  );
}
