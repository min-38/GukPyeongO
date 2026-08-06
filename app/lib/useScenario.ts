"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { stepPoints } from "./scenario-points";
import { playCorrect, playCountTick, playWrong } from "./sfx";

// 유형(회사 메신저·커뮤니티…)이 공유하는 진행 상태머신.
// "무엇을 어떻게 보여줄지"(맥락 재생·반응 연출)는 표면이 콜백으로 주입하고,
// 이 훅은 문제 진행·타이머·점수·정답 공개만 담당한다.

export type ScenarioStage = "replaying" | "answering" | "answered";

// 지문을 훑는 동안 남은 시간을 보여주려면 표면이 그 길이를 알려줘야 한다(#99).
// 표면이 재생을 시작할 때 plan()을 부르고, 훅이 초를 세며 건너뛰기를 받는다.
//   openMs   — 지금부터 몇 ms 뒤에 문제가 열리는지(카운트다운이 0이 되는 시각)
//   showFrom — 지문이 화면에 뜨는 시각. 그 전까지는 남은 초를 감춘다.
//              '다 읽었어요' 버튼이 지문보다 먼저 튀어나오면 읽을 것도 없는데
//              다 읽었냐고 묻는 꼴이 된다. 0이면 즉시 보인다(지문 없는 어휘 유형).
export type PlanRead = (openMs: number, showFrom?: number) => void;

// 유형별 문제 스텝의 최소 공통 형태.
// answerIndex는 서버 채점(#83)으로 오면 클라이언트에 내려오지 않는다.
export interface ScenarioStep {
  id?: string;
  answerIndex?: number;
  difficulty: 1 | 2 | 3;
  points?: number; // 문항 배점(#99). 없으면 난이도 환산표를 쓴다.
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
// 남은 시간이 이만큼일 때 한 번 알린다. 상단 타이머가 빨갛게 변하는 시점과 같은 값이라
// 눈으로 보든 소리로 듣든 같은 순간에 알아챈다(ScenarioUI의 remaining <= 5).
const WARN_SEC = 5;
// 벽시계를 얼마나 자주 들여다보는가. 1초보다 촘촘히 봐야 숨은 탭에서 돌아온 순간
// 곧바로 남은 시간이 맞춰진다. 하는 일이 뺄셈 하나뿐이라 비용은 없다.
const TIME_TICK_MS = 250;
const READ_TICK_MS = 250;
// 지문이 뜨고 나서 '다 읽었어요'까지의 뜸. 같이 튀어나오면 읽기도 전에 다 읽었냐고 묻는 꼴이라
// 지문을 한 박자 먼저 눈에 넣게 둔다.
// ponytail: 읽기 시간이 이 뜸보다 짧으면 버튼이 잠깐 떴다 사라진다.
// 지금 가장 짧은 읽기 시간(readMs 하한 900ms)이 두 덩어리라 실제로는 안 걸린다.
const READ_BUTTON_LEAD_IN_MS = 1000;

export interface AnswerResult {
  choiceIndex: number | null; // null = 무응답(시간 초과)
  isCorrect: boolean;
  gained: number;
}

// 고른 답을 위로 흘려보내는 콜백. 표면들이 그대로 전달만 하므로 형태를 한 곳에 둔다.
// 정답(answerIndex)도 같이 넘긴다 — 채점이 끝난 뒤 "문제 다시 보기"(#96)가 이 값을 쓴다.
// 서버에서 다시 내려받지 않는 이유: 그러려면 회차 전체의 정답을 한 번에 돌려주는 응답이
// 필요한데, 그 응답이 곧 문제를 풀지 않고도 정답을 얻는 길이 된다.
export type OnAnswered = (
  stepKey: string,
  choiceIndex: number | null,
  answerIndex: number,
) => void;

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
  onAnswered?: OnAnswered;
  reveal: (
    step: S,
    index: number,
    open: () => void,
    plan: PlanRead,
  ) => () => void;
  respond: (step: S, result: AnswerResult, next: () => void) => () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<ScenarioStage>("replaying");
  // 지문 읽는 시간 중 남은 초. null이면 표시하지 않는다(#99).
  const [readLeft, setReadLeft] = useState<number | null>(null);
  // timeLimitSec이 0이면 제한시간 없음 — 튜토리얼 예시를 눌러보는 용도(#93).
  const [remaining, setRemaining] = useState(steps[0].timeLimitSec);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(false);
  const [scorePop, setScorePop] = useState<number | null>(null);
  // 틀린 문항에서 다음으로 넘어갈 준비가 됐지만 손을 기다리는 중이면 여기 담긴다(#110).
  const [pendingNext, setPendingNext] = useState<(() => void) | null>(null);
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

      onAnswered?.(step.id ?? "", choiceIndex, revealed);

      const isCorrect = choiceIndex !== null && choiceIndex === revealed;
      const gained = isCorrect ? stepPoints(step) : 0;
      scoreRef.current += gained;

      setAnswerIndex(revealed);
      setPicked(choiceIndex);
      setCorrect(isCorrect);
      setStage("answered");

      if (isCorrect) {
        playCorrect();
      } else {
        playWrong();
        if (typeof navigator !== "undefined") {
          navigator.vibrate?.(80); // 햅틱: 오답 시 1회
        }
      }

      let popTimer: number | undefined;
      if (isCorrect) {
        setScorePop(gained);
        popTimer = window.setTimeout(() => setScorePop(null), SCORE_POP_MS);
      }

      const advance = () => {
        setPendingNext(null);
        if (isLast) {
          onFinish(scoreRef.current);
          return;
        }
        lockRef.current = false;
        setStage("replaying"); // 정답 공개는 다음 선택지가 열릴 때까지 유지
        setStepIndex((i) => i + 1);
      };

      // 틀렸으면 손으로 넘긴다 (#110).
      // 표면은 연출이 끝나면 next() 를 부르는데, 맞힌 문항은 그대로 넘어가고
      // 틀린 문항은 여기서 잡아 둔다 — 왜 틀렸는지 읽기도 전에 화면이 넘어가면
      // 정답을 공개하는 뜻이 없다. 무응답도 못 맞힌 것이라 같이 잡는다.
      const next = () => {
        if (isCorrect) advance();
        else setPendingNext(() => advance);
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
  // 재생 중에는 남은 읽기 시간을 세고, 건너뛰기를 누르면 남은 연출을 끊고 바로 연다.
  const openRef = useRef<() => void>(() => {});
  const endRevealRef = useRef<() => void>(() => {});
  const readTickRef = useRef<number | null>(null);

  const stopReadClock = () => {
    if (readTickRef.current !== null) window.clearInterval(readTickRef.current);
    readTickRef.current = null;
    setReadLeft(null);
  };

  useEffect(() => {
    const open = () => {
      stopReadClock();
      setPicked(null);
      setCorrect(false);
      setRemaining(step.timeLimitSec);
      setStage("answering");
    };
    openRef.current = open;

    const plan: PlanRead = (openMs, showFrom = 0) => {
      // 같은 스텝에서 두 번 불려도 시계가 겹치지 않게 먼저 멈춘다.
      if (readTickRef.current !== null)
        window.clearInterval(readTickRef.current);
      if (openMs <= 0) return;
      // 째깍을 세지 않고 벽시계로 계산한다 — 아래 제한시간과 같은 이유다.
      const startedAt = Date.now();
      const endsAt = startedAt + openMs;
      // 지문이 뜬 뒤 한 박자 두고 버튼을 올린다. showFrom이 0이면(지문 없는 유형) 뜸도 없다.
      const showAt =
        startedAt + showFrom + (showFrom > 0 ? READ_BUTTON_LEAD_IN_MS : 0);
      const tick = () => {
        const now = Date.now();
        if (now < showAt) return; // 아직 지문만 볼 때다 — 버튼은 나중에
        setReadLeft(Math.max(0, Math.ceil((endsAt - now) / 1000)));
      };
      readTickRef.current = window.setInterval(tick, READ_TICK_MS);
      tick(); // showFrom이 0이면 기다리지 않고 바로 보인다
    };

    const cleanup = revealRef.current(step, stepIndex, open, plan);
    endRevealRef.current = cleanup ?? (() => {});
    return () => {
      stopReadClock();
      cleanup?.();
    };
  }, [step, stepIndex]);

  // 다 읽었으면 기다리지 않고 넘어간다.
  const skipRead = useCallback(() => {
    if (stage !== "replaying") return;
    endRevealRef.current();
    openRef.current();
  }, [stage]);

  // 제한시간 타이머 — 선택지가 열린 뒤(answering)부터. 초과 시 무응답 처리.
  //
  // 째깍 수를 세지 않고 벽시계(Date.now)로 남은 시간을 계산한다.
  // 브라우저는 화면에 안 보이는 탭의 타이머를 크게 늦춘다(크롬은 1분에 한 번까지).
  // 1초마다 left를 1씩 깎던 옛 방식은 그동안 깎이지 않아 시계가 사실상 멈췄고,
  // 탭을 옮겨 답을 찾아본 뒤 돌아와도 시간이 그대로 남아 있었다.
  // 이제 돌아온 첫 째깍에 실제 흐른 시간이 반영되고, 이미 지났으면 무응답 처리된다.
  useEffect(() => {
    if (stage !== "answering" || step.timeLimitSec <= 0) return;
    const endsAt = Date.now() + step.timeLimitSec * 1000;
    let warned = false;
    let id = 0;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);
      // 제한시간이 원래 짧은 문항은 시작하자마자 울리게 되므로 건너뛴다.
      if (!warned && left <= WARN_SEC && step.timeLimitSec > WARN_SEC) {
        warned = true;
        playCountTick();
      }
      if (left === 0) {
        window.clearInterval(id);
        answer(null); // answer 안의 lockRef가 중복 호출을 막는다
      }
    };
    id = window.setInterval(tick, TIME_TICK_MS);
    return () => window.clearInterval(id);
  }, [stage, step.timeLimitSec, answer]);

  return {
    step,
    stepIndex,
    total,
    stage,
    // 제한시간이 없는 스텝(튜토리얼 예시)은 null — 표면이 타이머를 감춘다.
    remaining: step.timeLimitSec > 0 ? remaining : null,
    readLeft,
    skipRead,
    picked,
    correct,
    scorePop,
    // 정답 공개용. 서버 채점이면 응답 값, 아니면 스텝이 들고 있던 값.
    answerIndex: answerIndex ?? step.answerIndex ?? -1,
    answer,
    // 틀린 문항에서 "다음"을 눌러야 넘어간다(#110). 맞힌 문항은 null 이라 버튼이 안 뜬다.
    goNext: pendingNext,
  };
}
