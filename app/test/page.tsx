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

  const answersRef = useRef<ScoreRequestItem[]>([]);
  const startRef = useRef(0);
  const lockRef = useRef(false); // 한 문제당 한 번만 응답 처리

  // 문제 로드 (#3 API)
  useEffect(() => {
    let active = true;
    fetch("/api/questions")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<{ questions: PublicQuestion[] }>;
      })
      .then((data) => {
        if (!active) return;
        setQuestions(data.questions);
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

  // 결과 제출 (#5 채점 API)
  const submit = useCallback(
    async (items: ScoreRequestItem[]) => {
      setPhase("submitting");
      try {
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
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

  // 응답 처리(클릭/시간초과 공통)
  const answer = useCallback(
    (choiceIndex: number | null) => {
      if (lockRef.current) return;
      lockRef.current = true;

      const q = questions[index];
      const reactionMs =
        choiceIndex === null
          ? 0
          : Math.round(performance.now() - startRef.current);
      const items: ScoreRequestItem[] = [
        ...answersRef.current,
        { questionId: q.id, choiceIndex, reactionMs },
      ];
      answersRef.current = items;

      if (index + 1 < questions.length) {
        setRemaining(questions[index + 1].timeLimitSec);
        setIndex(index + 1);
      } else {
        void submit(items);
      }
    },
    [questions, index, submit]
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
    const deadline = setTimeout(() => answer(null), limit * 1000);

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

  return (
    <main className="flex flex-1 flex-col px-6 py-7">
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

        <div className="mt-7 flex flex-col gap-3">
          {q.choices.map((choice, i) => (
            <button
              key={i}
              type="button"
              onClick={() => answer(i)}
              className="group flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-4 text-left transition-all hover:border-brand hover:bg-surface-muted active:scale-[0.99]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-sm font-bold text-muted transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-base font-medium">{choice}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
