"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { POINTS_BY_DIFFICULTY } from "./scenario-points";

// 유형(회사 메신저·커뮤니티…)이 공유하는 진행 상태머신.
// "무엇을 어떻게 보여줄지"(맥락 재생·반응 연출)는 표면이 콜백으로 주입하고,
// 이 훅은 문제 진행·타이머·점수·정답 공개만 담당한다.

export type ScenarioStage = "replaying" | "answering" | "answered";

// 유형별 문제 스텝의 최소 공통 형태.
// answerIndex는 서버 채점(#83)으로 오면 클라이언트에 내려오지 않는다.
export interface ScenarioStep {
  id?: string;
  answerIndex?: number;
  difficulty: 1 | 2 | 3;
  timeLimitSec: number;
}

// 배점은 서버 채점(#89)과 공유해야 해서 중립 모듈에 둔다.
export { POINTS_BY_DIFFICULTY } from "./scenario-points";

// 서버 채점 (#83). 정답이 클라이언트에 없을 때만 부른다.
async function gradeOnServer(
  slug: string | undefined,
  stepKey: string | undefined,
  choiceIndex: number | null,
): Promise<{ answerIndex: number } | null> {
  if (!slug || !stepKey) return null;
  try {
    const res = await fetch("/api/scenario-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, stepKey, choiceIndex }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { answerIndex: number };
  } catch {
    return null;
  }
}

const SCORE_POP_MS = 1000; // 점수 애니메이션 길이 (globals.css의 score-pop과 동일)

export interface AnswerResult {
  choiceIndex: number | null; // null = 무응답(시간 초과)
  isCorrect: boolean;
  gained: number;
}

export function useScenario<S extends ScenarioStep>({
  steps,
  onFinish,
  // DB에서 온 시나리오의 라우트 키. 있으면 정답 판정을 서버에 맡긴다(#83).
  slug,
  // 회차 채점(#89)을 위해 고른 답을 위로 흘려보낸다. 무응답은 null.
  onAnswered,
  // 현재 스텝의 맥락을 재생한다. 다 보여준 뒤 open()을 호출하면 선택지가 열린다.
  // 정리 함수를 반환한다(예약 타이머 취소).
  reveal,
  // 답변 후 반응을 연출한다. 다 읽힌 뒤 next()를 호출하면 다음 스텝으로 넘어간다.
  respond,
}: {
  steps: S[];
  onFinish: (score: number) => void;
  slug?: string;
  onAnswered?: (stepId: string, choiceIndex: number | null) => void;
  reveal: (step: S, index: number, open: () => void) => () => void;
  respond: (step: S, result: AnswerResult, next: () => void) => () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<ScenarioStage>("replaying");
  const [remaining, setRemaining] = useState(steps[0].timeLimitSec);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(false);
  const [scorePop, setScorePop] = useState<number | null>(null);
  // 공개할 정답. 서버 채점이면 응답으로 채워지고, mock 폴백이면 스텝이 그대로 갖고 있다.
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);

  const lockRef = useRef(false);
  const scoreRef = useRef(0);
  // 답변 후 연출의 정리 함수(반응 연출 + 점수팝 제거) — 언마운트/다음 스텝 시 정리.
  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupRef.current?.(), []);

  // reveal/respond는 매 렌더 새로 오므로 ref로 잡아 effect 의존성을 흔들지 않는다.
  const revealRef = useRef(reveal);
  const respondRef = useRef(respond);
  useEffect(() => {
    revealRef.current = reveal;
    respondRef.current = respond;
  }, [reveal, respond]);

  const step = steps[stepIndex];
  const total = steps.length;
  const isLast = stepIndex + 1 >= total;

  const answer = useCallback(
    async (choiceIndex: number | null) => {
      if (lockRef.current) return;
      lockRef.current = true;

      // 정답이 스텝에 없으면(=DB에서 온 시나리오) 서버가 채점한다.
      // 실패하면 오답으로 두지 않고 무효 처리해 다시 고를 수 있게 한다.
      let revealed = step.answerIndex;
      if (revealed === undefined) {
        const graded = await gradeOnServer(slug, step.id, choiceIndex);
        if (!graded) {
          lockRef.current = false;
          return;
        }
        revealed = graded.answerIndex;
      }

      onAnswered?.(step.id ?? "", choiceIndex);

      const isCorrect = choiceIndex !== null && choiceIndex === revealed;
      const gained = isCorrect ? POINTS_BY_DIFFICULTY[step.difficulty] : 0;
      scoreRef.current += gained;

      setAnswerIndex(revealed);
      setPicked(choiceIndex);
      setCorrect(isCorrect);
      setStage("answered");

      if (!isCorrect && typeof navigator !== "undefined") {
        navigator.vibrate?.(80); // 햅틱: 오답 시 1회
      }

      let popTimer: number | undefined;
      if (isCorrect) {
        setScorePop(gained);
        popTimer = window.setTimeout(() => setScorePop(null), SCORE_POP_MS);
      }

      const next = () => {
        if (isLast) {
          onFinish(scoreRef.current);
          return;
        }
        lockRef.current = false;
        setStage("replaying"); // 정답 공개는 다음 선택지가 열릴 때까지 유지
        setStepIndex((i) => i + 1);
      };

      const cleanupRespond = respondRef.current(
        step,
        { choiceIndex, isCorrect, gained },
        next,
      );
      cleanupRef.current = () => {
        if (popTimer) clearTimeout(popTimer);
        cleanupRespond();
      };
    },
    [step, isLast, onFinish, slug, onAnswered],
  );

  // 스텝 진입 → 맥락 재생 → open()으로 선택지 노출.
  useEffect(() => {
    const open = () => {
      setPicked(null);
      setCorrect(false);
      setRemaining(step.timeLimitSec);
      setStage("answering");
    };
    return revealRef.current(step, stepIndex, open);
  }, [step, stepIndex]);

  // 제한시간 타이머 — 선택지가 열린 뒤(answering)부터. 초과 시 무응답 처리.
  useEffect(() => {
    if (stage !== "answering") return;
    let left = step.timeLimitSec;
    const tick = setInterval(() => {
      left -= 1;
      setRemaining(left > 0 ? left : 0);
    }, 1000);
    const deadline = window.setTimeout(
      () => answer(null),
      step.timeLimitSec * 1000,
    );
    return () => {
      clearInterval(tick);
      clearTimeout(deadline);
    };
  }, [stage, step.timeLimitSec, answer]);

  return {
    step,
    stepIndex,
    total,
    stage,
    remaining,
    picked,
    correct,
    scorePop,
    // 정답 공개용. 서버 채점이면 응답 값, 아니면 스텝이 들고 있던 값.
    answerIndex: answerIndex ?? step.answerIndex ?? -1,
    answer,
  };
}
