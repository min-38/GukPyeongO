"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  RESULT_STORAGE_KEY,
  type PublicQuestion,
  type ScoreRequestItem,
  type ScoreResult,
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
        const result: ScoreResult = await res.json();
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
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-base text-muted">
          {phase === "loading" ? "문제를 불러오는 중..." : "채점 중..."}
        </p>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-base text-muted">
          문제가 발생했습니다. 다시 시도해주세요.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-brand active:opacity-80"
        >
          처음으로
        </Link>
      </main>
    );
  }

  const q = questions[index];

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <div className="flex items-center justify-between text-sm font-medium text-muted">
        <span>
          {index + 1} / {questions.length}
        </span>
        <span className={remaining <= 5 ? "text-brand" : ""}>{remaining}s</span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <h2 className="mt-10 text-xl font-bold leading-relaxed">{q.prompt}</h2>

      <div className="mt-8 flex flex-col gap-3">
        {q.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            onClick={() => answer(i)}
            className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-left text-base font-medium transition-colors active:bg-background"
          >
            {choice}
          </button>
        ))}
      </div>
    </main>
  );
}
