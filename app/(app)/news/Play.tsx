"use client";

import { type DocScenario } from "@/app/lib/doc-scenario";

import DocScenarioView from "../play/DocScenario";
import PlayShell from "../play/PlayShell";
import NewsTutorial from "./NewsTutorial";

export default function NewsPlay({ scenario }: { scenario: DocScenario }) {
  return (
    <PlayShell
      doneTitle="기사 정독 완료!"
      tutorial={(start) => <NewsTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <DocScenarioView scenario={scenario} onFinish={onFinish} slug="news" />
      )}
    />
  );
}
