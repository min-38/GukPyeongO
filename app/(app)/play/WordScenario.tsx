"use client";

import { type OnAnswered, type ScenarioStep } from "@/app/lib/useScenario";

import ReadingScenario from "./ReadingScenario";
import { WordFace } from "./SurfaceCards";

// 어휘 유형 (#101). 지문 대신 묻는 낱말 하나가 화면 가운데 크게 뜨고,
// 질문(prompt)과 선택지는 아래 선택지 칸에 그대로 나온다.
// 읽을 지문이 없으니 읽기 시간도 없다 — 바로 선택지를 연다.
// 진행·타이머·정답 공개는 읽기형 골격(ReadingScenario)이 이미 다 갖고 있다.

interface WordStep extends ScenarioStep {
  prompt: string;
  choices: string[];
  // 문항의 extra.word — 저장할 때 서버가 필수로 받는다.
  word?: string;
}

export default function WordScenario({
  scenario,
  label,
  onFinish,
  slug,
  onAnswered,
}: {
  scenario: { steps: WordStep[] };
  label: string;
  onFinish: (score: number) => void;
  slug?: string;
  onAnswered?: OnAnswered;
}) {
  return (
    <ReadingScenario
      label={label}
      steps={scenario.steps}
      onFinish={onFinish}
      slug={slug}
      onAnswered={onAnswered}
      // 낱말과 선택지를 같이 띄운다. 낱말만 먼저 보여주면 그 사이 선택지 자리가 비어
      // 화면이 한 번 흔들린다 — 읽을 지문이 없으니 뜸을 들일 이유도 없다.
      revealOnce={(open, plan) => {
        plan(0);
        open();
        return () => {};
      }}
      revealNext={(_step, _index, open, plan) => {
        plan(0);
        open();
        return () => {};
      }}
    >
      {/* 낱말은 문항마다 바뀐다 — 지금 문항을 받아 그린다. */}
      {(step) => (step.word ? <WordFace key={step.id} word={step.word} /> : null)}
    </ReadingScenario>
  );
}
