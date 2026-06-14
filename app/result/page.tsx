"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  QUESTION_TYPE_LABELS,
  RESULT_STORAGE_KEY,
  type ScoreResult,
} from "@/app/lib/quiz";

// sessionStorage의 채점 결과를 읽는다. getSnapshot은 참조가 안정적이어야 하므로
// raw 문자열이 같으면 파싱 결과를 캐시해 동일 객체를 반환한다.
let cachedRaw: string | null = null;
let cachedResult: ScoreResult | null = null;

function subscribe() {
  // 결과는 마운트 후 바뀌지 않으므로 구독은 비워둔다.
  return () => {};
}

function readResult(): ScoreResult | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  try {
    cachedResult = raw ? (JSON.parse(raw) as ScoreResult) : null;
  } catch {
    cachedResult = null;
  }
  return cachedResult;
}

export default function ResultPage() {
  const result = useSyncExternalStore(subscribe, readResult, () => null);

  // 결과 없이 직접 접근한 경우
  if (!result) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-base text-muted">아직 응시한 결과가 없어요.</p>
        <Link
          href="/test"
          className="flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-base font-semibold text-brand-foreground active:opacity-80"
        >
          테스트 하러 가기
        </Link>
      </main>
    );
  }

  const avgSec = (result.avgReactionMs / 1000).toFixed(1);

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-medium tracking-widest text-brand">
          나의 문해력 등급
        </p>
        <p className="mt-3 text-6xl font-bold tracking-tight">
          {result.grade}
          <span className="text-3xl font-semibold text-muted">등급</span>
        </p>
        <p className="mt-4 rounded-full bg-background px-4 py-1.5 text-base font-semibold">
          {result.title}
        </p>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">맞힌 문제</dt>
          <dd className="mt-1 text-2xl font-bold">
            {result.correctCount}
            <span className="text-base font-medium text-muted">
              {" / "}
              {result.totalCount}
            </span>
          </dd>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">평균 반응속도</dt>
          <dd className="mt-1 text-2xl font-bold">
            {avgSec}
            <span className="text-base font-medium text-muted"> 초</span>
          </dd>
        </div>
      </dl>

      <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">취약 유형</p>
        {result.weakTypes.length === 0 ? (
          <p className="mt-2 text-base font-medium">
            약점이 안 보여요. 고르게 잘 봤네요.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {result.weakTypes.map((type) => (
              <span
                key={type}
                className="rounded-full bg-background px-3 py-1 text-sm font-medium"
              >
                {QUESTION_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 공유(#7)·댓글(#8) 영역 placeholder */}
      <div className="mt-3 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted">
        결과 공유·댓글 기능은 곧 추가됩니다.
      </div>

      <Link
        href="/test"
        className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-lg font-semibold text-brand-foreground transition-opacity active:opacity-80"
      >
        다시 도전
      </Link>
    </main>
  );
}
