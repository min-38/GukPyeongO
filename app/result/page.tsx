"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import {
  gradeTheme,
  QUESTION_TYPE_LABELS,
  RESULT_STORAGE_KEY,
  type ScoreResponse,
} from "@/app/lib/quiz";

import Comments from "./Comments";

// sessionStorage의 채점 결과를 읽는다. getSnapshot은 참조가 안정적이어야 하므로
// raw 문자열이 같으면 파싱 결과를 캐시해 동일 객체를 반환한다.
let cachedRaw: string | null = null;
let cachedResult: ScoreResponse | null = null;

function subscribe() {
  // 결과는 마운트 후 바뀌지 않으므로 구독은 비워둔다.
  return () => {};
}

function readResult(): ScoreResponse | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  try {
    cachedResult = raw ? (JSON.parse(raw) as ScoreResponse) : null;
  } catch {
    cachedResult = null;
  }
  return cachedResult;
}

export default function ResultPage() {
  const result = useSyncExternalStore(subscribe, readResult, () => null);
  const [copied, setCopied] = useState(false);

  // 결과 공유: 지원 기기는 네이티브 공유 시트, 아니면 링크 복사 폴백.
  // 개인정보는 담지 않고 사이트 진입 경로(랜딩)만 공유한다.
  async function handleShare() {
    if (!result) return;
    const url = window.location.origin;
    const text = `국평오 테스트 결과: ${result.grade}등급 "${result.title}"! 검색 없이 10문제, 당신의 문해력은?`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "국평오 테스트", text, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 복사도 불가한 환경은 조용히 무시
    }
  }

  // 결과 없이 직접 접근한 경우
  if (!result) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-5xl">🧐</span>
        <p className="text-base font-medium text-muted">
          아직 응시한 결과가 없어요.
        </p>
        <Link
          href="/test"
          className="flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-base font-bold text-brand-foreground shadow-lg shadow-brand/30 active:scale-95"
        >
          테스트 하러 가기
        </Link>
      </main>
    );
  }

  const theme = gradeTheme(result.grade);
  const avgSec = (result.avgReactionMs / 1000).toFixed(1);

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <div className="animate-pop flex flex-col items-center text-center">
        <span className="text-6xl">{theme.emoji}</span>
        <p className="mt-3 text-sm font-bold tracking-widest text-muted">
          나의 문해력
        </p>
        <p
          className="font-display text-[5.5rem] leading-none tracking-tight"
          style={{ color: theme.color }}
        >
          {result.grade}
          <span className="ml-1 align-top text-3xl">등급</span>
        </p>
        <p
          className="mt-1 rounded-full px-5 py-2 text-lg font-extrabold text-white"
          style={{ backgroundColor: theme.color }}
        >
          {result.title}
        </p>
        <p className="mt-4 max-w-xs text-base text-muted">{theme.blurb}</p>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-muted p-4">
          <dt className="text-sm font-medium text-muted">맞힌 문제</dt>
          <dd className="mt-1 text-2xl font-extrabold">
            {result.correctCount}
            <span className="text-base font-bold text-muted">
              {" / "}
              {result.totalCount}
            </span>
          </dd>
        </div>
        <div className="rounded-2xl bg-surface-muted p-4">
          <dt className="text-sm font-medium text-muted">평균 반응속도</dt>
          <dd className="mt-1 text-2xl font-extrabold">
            {avgSec}
            <span className="text-base font-bold text-muted"> 초</span>
          </dd>
        </div>
      </dl>

      <div className="mt-3 rounded-2xl bg-surface-muted p-4">
        <p className="text-sm font-medium text-muted">취약 유형</p>
        {result.weakTypes.length === 0 ? (
          <p className="mt-2 text-base font-bold">
            🎯 약점이 안 보여요. 고르게 잘 봤네요!
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {result.weakTypes.map((type) => (
              <span
                key={type}
                className="rounded-full bg-surface px-3 py-1 text-sm font-bold"
              >
                {QUESTION_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleShare}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98]"
      >
        {copied ? "✅ 링크가 복사됐어요!" : "📣 결과 공유하기"}
      </button>

      <Link
        href="/test"
        className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-border text-base font-bold transition-colors hover:bg-surface-muted active:scale-[0.99]"
      >
        다시 도전
      </Link>

      <Comments grade={result.grade} gradeToken={result.gradeToken} />
    </main>
  );
}
