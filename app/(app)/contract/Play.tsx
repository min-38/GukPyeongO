"use client";

import { type DocScenario } from "@/app/lib/doc-scenario";
import { SCENARIO_KIND_TITLES } from "@/app/lib/scenario-admin";

import PlayShell from "../play/PlayShell";
import DocScenarioView from "../play/DocScenario";
import ContractTutorial from "./ContractTutorial";

// 계약서 유형 맛보기 페이지 (#99). 오늘의 문제와 별개로 유형 하나만 풀어본다.
export default function ContractPlay({ scenario }: { scenario: DocScenario }) {
  return (
    <PlayShell
      doneTitle="계약서 끝!"
      tutorial={(start) => <ContractTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <DocScenarioView
          label={SCENARIO_KIND_TITLES.contract}
          scenario={scenario}
          onFinish={onFinish}
          slug="contract-oneroom"
        />
      )}
    />
  );
}
