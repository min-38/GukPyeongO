"use client";

import { MOCK_NEWS } from "@/app/lib/mock-news";

import DocScenarioView from "../play/DocScenario";
import PlayShell from "../play/PlayShell";
import NewsTutorial from "./NewsTutorial";

export default function NewsPage() {
  return (
    <PlayShell
      doneTitle="기사 정독 완료!"
      tutorial={(start) => <NewsTutorial onStart={start} />}
      renderScenario={(onFinish) => (
        <DocScenarioView scenario={MOCK_NEWS} onFinish={onFinish} />
      )}
    />
  );
}
