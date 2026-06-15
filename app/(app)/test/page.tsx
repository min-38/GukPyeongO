"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  QUESTION_TYPE_LABELS,
  RESULT_STORAGE_KEY,
  type PublicQuestion,
  type ScoreRequestItem,
  type ScoreResponse,
} from "@/app/lib/quiz";

type Phase = "loading" | "playing" | "submitting" | "error";

export default function TestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [textInput, setTextInput] = useState(""); // 단답형 입력
  // 풀이 직후 정답/오답 피드백 (correct=null이면 확인 중). 정답 내용은 받지 않음.
  const [feedback, setFeedback] = useState<{
    selectedIndex: number | null;
    correct: boolean | null;
  } | null>(null);
  // 객관식 보기 표시 순서 (문제별 1회 셔플, 원래 인덱스 배열). questions와 같은 인덱스로 대응.
  const [choiceOrders, setChoiceOrders] = useState<number[][]>([]);

  const answersRef = useRef<ScoreRequestItem[]>([]);
  const startRef = useRef(0);
  const lockRef = useRef(false); // 한 문제당 한 번만 응답 처리
  const quizTokenRef = useRef(""); // 출제 세트 서명 토큰 (#18)

  // 문제 로드 (무작위 출제 + 출제 세트 토큰)
  useEffect(() => {
    let active = true;
    fetch("/api/questions")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<{
          questions: PublicQuestion[];
          quizToken: string;
        }>;
      })
      .then((data) => {
        if (!active) return;
        quizTokenRef.current = data.quizToken;
        setQuestions(data.questions);
        setChoiceOrders(
          data.questions.map((qq) => {
            const order = qq.choices.map((_, i) => i);
            for (let i = order.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [order[i], order[j]] = [order[j], order[i]];
            }
            return order;
          })
        );
        setRemaining(data.questions[0]?.timeLimitSec ?? 0);
        setPhase("playing");
      })
      .catch(() => {
        if (active) setPhase("error");
      });
    return () => {
      active = false;
    };
  }, []);

  // 결과 제출 (#5 채점 API) — 출제 세트 토큰을 함께 보내 출제 세트 기준 채점
  const submit = useCallback(
    async (items: ScoreRequestItem[]) => {
      setPhase("submitting");
      try {
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, quizToken: quizTokenRef.current }),
        });
        if (!res.ok) throw new Error();
        const result: ScoreResponse = await res.json();
        sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
        router.push("/result");
      } catch {
        setPhase("error");
      }
    },
    [router]
  );

  // 다음 문항으로 진행 (마지막이면 제출)
  const advance = useCallback(() => {
    setFeedback(null);
    if (index + 1 < questions.length) {
      setTextInput("");
      setRemaining(questions[index + 1].timeLimitSec);
      setIndex(index + 1);
    } else {
      void submit(answersRef.current);
    }
  }, [index, questions, submit]);

  // 응답 처리(객관식 클릭 / 단답형 제출 / 시간초과 공통)
  const answer = useCallback(
    (choiceIndex: number | null, text: string | null) => {
      if (lockRef.current) return;
      lockRef.current = true;

      const q = questions[index];
      const answered =
        choiceIndex !== null || (text !== null && text.length > 0);
      const reactionMs = answered
        ? Math.round(performance.now() - startRef.current)
        : 0;
      answersRef.current = [
        ...answersRef.current,
        { questionId: q.id, choiceIndex, text, reactionMs },
      ];

      // 미응답(시간초과)은 피드백 없이 바로 진행
      if (!answered) {
        advance();
        return;
      }

      // 선택 즉시 표시 후, 서버에서 정답/오답만 확인 (정답 내용은 받지 않음)
      setFeedback({ selectedIndex: choiceIndex, correct: null });
      fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: q.id,
          choiceIndex,
          text,
          quizToken: quizTokenRef.current,
        }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
        .then((d: { correct: boolean }) =>
          setFeedback({ selectedIndex: choiceIndex, correct: d.correct })
        )
        .catch(() => {
          /* 확인 실패 시 그대로 진행 */
        })
        .finally(() => window.setTimeout(advance, 1100));
    },
    [questions, index, advance]
  );

  // 문제별 제한시간 타이머 (표시용 카운트다운 + 시간초과 자동 진행)
  useEffect(() => {
    if (phase !== "playing" || questions.length === 0) return;
    lockRef.current = false;
    startRef.current = performance.now();
    const limit = questions[index].timeLimitSec;

    const tick = setInterval(
      () => setRemaining((r) => (r > 0 ? r - 1 : 0)),
      1000
    );
    const deadline = setTimeout(() => answer(null, null), limit * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(deadline);
    };
  }, [index, phase, questions, answer]);

  if (phase === "loading" || phase === "submitting") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="animate-float text-5xl">
          {phase === "loading" ? "📖" : "🧮"}
        </span>
        <p className="text-base font-medium text-muted">
          {phase === "loading" ? "문제 가져오는 중..." : "채점하는 중..."}
        </p>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-5xl">😵</span>
        <p className="text-base font-medium text-muted">
          문제가 발생했어요. 다시 시도해주세요.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-surface-muted px-5 py-2.5 text-sm font-bold text-brand active:scale-95"
        >
          처음으로
        </Link>
      </main>
    );
  }

  const q = questions[index];
  const progress = (index / questions.length) * 100;
  const order = choiceOrders[index] ?? q.choices.map((_, i) => i);

  return (
    <main className="flex flex-1 flex-col px-6 py-7 lg:items-center lg:justify-center lg:px-0 lg:py-10">
     <div className="flex w-full flex-1 flex-col lg:max-w-2xl lg:flex-none lg:rounded-[2.5rem] lg:border lg:border-border lg:bg-surface lg:p-12 lg:shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)]">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold tabular-nums">
          {index + 1}
          <span className="text-muted"> / {questions.length}</span>
        </span>
        <span
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
            remaining <= 5
              ? "animate-pulse bg-red-500 text-white"
              : "bg-surface-muted text-foreground"
          }`}
        >
          ⏱ {remaining}s
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={q.id} className="animate-rise mt-9 flex flex-1 flex-col">
        <span className="w-fit rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
          {QUESTION_TYPE_LABELS[q.type]}
        </span>
        <h2 className="mt-4 text-2xl font-extrabold leading-relaxed">
          {q.prompt}
        </h2>

        {feedback?.correct != null && (
          <div
            className={`mt-5 rounded-2xl px-4 py-3 text-center text-base font-extrabold ${
              feedback.correct
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {feedback.correct ? "정답이에요! 🎉" : "틀렸어요 😅"}
          </div>
        )}

        {q.format === "short_answer" ? (
          <form
            className="mt-7 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const t = textInput.trim();
              answer(null, t.length > 0 ? t : null);
            }}
          >
            <input
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={feedback != null}
              placeholder="정답을 입력하세요"
              className="h-14 w-full rounded-2xl border-2 border-border bg-surface px-4 text-lg font-medium outline-none transition-colors focus:border-brand disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={feedback != null || textInput.trim().length === 0}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98] disabled:opacity-40"
            >
              제출
            </button>
          </form>
        ) : (
          <div className="mt-7 flex flex-col gap-3 lg:grid lg:grid-cols-2">
            {order.map((originalIndex, pos) => {
              const choice = q.choices[originalIndex];
              const sel = feedback?.selectedIndex === originalIndex;
              let state =
                "border-border bg-surface hover:border-brand hover:bg-surface-muted";
              if (feedback) {
                state = sel
                  ? feedback.correct == null
                    ? "border-brand bg-brand/5"
                    : feedback.correct
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10"
                  : "border-border opacity-50";
              }
              return (
                <button
                  key={originalIndex}
                  type="button"
                  disabled={feedback != null}
                  onClick={() => answer(originalIndex, null)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all active:scale-[0.99] ${state}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-sm font-bold text-muted">
                    {String.fromCharCode(65 + pos)}
                  </span>
                  <span className="text-base font-medium">{choice}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
     </div>
    </main>
  );
}
