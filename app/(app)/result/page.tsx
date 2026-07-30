"use client";

import Link from "next/link";
import { useState } from "react";

import {
  gradeBlurb,
  gradeTheme,
  GRADE_TITLES,
  type QuizMode,
  QUIZ_MODES,
  type StoredResult,
} from "@/app/lib/quiz";

import useIsDesktop from "@/app/lib/useIsDesktop";

import AdFitBanner from "../AdFitBanner";
import Footer from "../Footer";
import GradeCharacter from "../GradeCharacter";

import Comments from "./Comments";
import GradeBar from "./GradeBar";
import GradeDistribution from "./GradeDistribution";
import useStoredResult from "./useStoredResult";

// 공유 아이콘. 아이콘 묶음을 새로 들이지 않고 필요한 두 개만 그린다.
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

// 응시 시각 — "2026년 7월 28일 오전 03시 16분". 서버가 찍은 시각을 한국 시간으로 읽는다.
// toLocaleString은 "오전 03:16"까지만 만들어줘서 조각을 직접 잇는다.
function formatFinishedAt(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const part: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date))
    part[p.type] = p.value;
  return `${part.year}년 ${part.month}월 ${part.day}일 ${part.dayPeriod} ${part.hour}시 ${part.minute}분`;
}

// 등급 아래 한 줄을 고를 값. 채점 시각이 있으면 회차마다 다른 문장이 나오고,
// 없으면(v1) 맞힌 개수를 쓴다. 결과가 같으면 늘 같은 문장이라 새로고침해도 안 바뀐다.
function blurbSeed(r: StoredResult): number {
  return r.finishedAt ? Date.parse(r.finishedAt) / 60000 : r.correctCount;
}

// 응시 모드 해석. 저장된 mode가 없으면(구버전 데이터) 문항 수로 추정한다.
function resultMode(r: StoredResult): QuizMode {
  if (r.mode === "quick" || r.mode === "deep") return r.mode;
  return r.totalCount >= QUIZ_MODES.deep.size ? "deep" : "quick";
}

export default function ResultPage() {
  const result = useStoredResult();
  const [copied, setCopied] = useState(false);
  const isDesktop = useIsDesktop();

  // 결과 공유: 지원 기기는 네이티브 공유 시트, 아니면 링크 복사 폴백.
  // 개인정보는 담지 않고 사이트 진입 경로(랜딩)만 공유한다.
  async function handleShare() {
    if (!result) return;
    const url = window.location.origin;
    const modeCfg = QUIZ_MODES[resultMode(result)];
    const text = `국평오 ${result.modeLabel ?? modeCfg.label}(${result.totalCount}문제): 내 문해력 캐릭터는 "${result.title}" (${result.grade}등급)! 당신은?`;

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

  // 저장소를 아직 못 읽었거나 뷰포트가 안 정해졌다. 지금 그리면 광고 자리가
  // 나중에 끼어들며 화면이 한 번 밀린다 — 다 정해진 뒤에 한 번에 그린다(#99).
  if (result === undefined || isDesktop === null) {
    return <main className="flex flex-1" aria-busy />;
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
  const finishedAt = result.finishedAt
    ? formatFinishedAt(result.finishedAt)
    : null;

  return (
    <>
      <main className="flex flex-1 flex-col px-6 py-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-12 lg:py-12">
        {/* 모바일 상단 배너 320×50 */}
        {isDesktop === false && (
          <div className="flex justify-center">
            <AdFitBanner
              unit="DAN-lgDU2Dq4xvULyTQD"
              width={320}
              height={50}
              className="mb-6"
            />
          </div>
        )}
        {/* 왼쪽 위: 등급·점수·응시 시각·버튼 카드.
            데스크톱에서는 댓글이 길어져도 자리를 지킨다 — 공유하기를 누르려고 위로 올라갈 일이 없게.
            화면이 낮아 카드가 다 안 들어가면 카드 안에서만 스크롤한다. */}
        <div className="lg:sticky lg:top-6 lg:col-start-1 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:rounded-[2rem] lg:border lg:border-border lg:bg-surface lg:p-8 lg:shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)]">
          <h1 className="mb-3 font-display text-2xl">테스트 결과</h1>
          <div className="animate-pop flex flex-col items-center rounded-2xl border border-border p-6 text-center">
            <GradeCharacter grade={result.grade} className="h-32 w-32" />
            {/* 그림만으로는 무슨 동물인지 갈리는 게 있다 — 이름을 붙여준다(#106). */}
            <p
              className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl"
              style={{ color: theme.color }}
            >
              {GRADE_TITLES[result.grade] ?? result.title}
            </p>
            <p
              className="mt-2 inline-block rounded-full px-4 py-1.5 text-sm font-extrabold text-white"
              style={{ backgroundColor: theme.color }}
            >
              {result.grade}등급
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              {gradeBlurb(result.grade, blurbSeed(result))}
            </p>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3">
            {/* v2는 점수로 등급을 매긴다(#89) — 개수보다 점수를 먼저 보여준다. */}
            {result.score !== undefined && result.maxScore !== undefined && (
              <div className="rounded-2xl bg-surface-muted p-4 text-center">
                <dt className="text-sm font-medium text-muted">얻은 점수</dt>
                <dd className="mt-1 text-2xl font-extrabold">
                  {result.score}
                  <span className="text-base font-bold text-muted">
                    {" / "}
                    {result.maxScore}
                  </span>
                </dd>
              </div>
            )}
            <div className="rounded-2xl bg-surface-muted p-4 text-center">
              <dt className="text-sm font-medium text-muted">맞춘 문제 수</dt>
              <dd className="mt-1 text-2xl font-extrabold">
                {result.correctCount}
                <span className="text-base font-bold text-muted">
                  {" / "}
                  {result.totalCount}
                </span>
              </dd>
            </div>
          </dl>

          {/* 응시 시각과 등급 분포 속 내 위치. v1 회차에는 둘 다 없어 통째로 빠진다. */}
          {(finishedAt || result.rank) && (
            <div className="mt-3 rounded-2xl border border-border p-4">
              {finishedAt && (
                <p className="text-center text-base font-bold">{finishedAt}</p>
              )}
              {result.rank && (
                <div className="mt-2">
                  <GradeBar grade={result.grade} rank={result.rank} />
                  <GradeDistribution grade={result.grade} rank={result.rank} />
                </div>
              )}
            </div>
          )}

          {/* 회차를 알아야 그 회차 지문을 다시 읽어올 수 있다(#100).
              회차가 없던 시절에 저장된 기록에는 보여줄 게 없어 버튼을 감춘다. */}
          {result.roundId && (
            <Link
              href={`/result/review?round=${result.roundId}`}
              className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98]"
            >
              문제 다시 보기
            </Link>
          )}

          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-border text-base font-bold transition-colors hover:bg-surface-muted active:scale-[0.99]"
            >
              홈으로
            </Link>
            {/* 공유는 아이콘만. 글자를 빼서 '홈으로'가 주가 되게 한다. */}
            <button
              type="button"
              onClick={handleShare}
              aria-label={copied ? "링크가 복사됐어요" : "결과 공유하기"}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-brand text-brand transition-colors hover:bg-brand/10 active:scale-[0.98]"
            >
              {copied ? <CheckIcon /> : <ShareIcon />}
            </button>
          </div>
        </div>

        {/* 오른쪽 전체: 댓글 (데스크톱) */}
        <div className="lg:col-start-2 lg:[&>section]:mt-0">
          {/* PC 전용: 댓글 위 250×250 */}
          {isDesktop === true && (
            <div className="flex justify-center">
              <AdFitBanner
                unit="DAN-AVHY1ki21whWnOYz"
                width={250}
                height={250}
                className="mb-6"
              />
            </div>
          )}
          <Comments grade={result.grade} gradeToken={result.gradeToken} />
        </div>
      </main>
      <Footer />
    </>
  );
}
