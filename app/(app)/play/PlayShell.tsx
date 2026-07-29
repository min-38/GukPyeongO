"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";

import useIsDesktop from "@/app/lib/useIsDesktop";
import { unlockAudio } from "@/app/lib/sfx";

import AdFitBanner from "../AdFitBanner";

// 유형 공용 셸 — 광고·페이지 스크롤 잠금·시작 게이트·종료 화면을 담당한다.
// 유형별로 다른 것은 튜토리얼과 시나리오 본체뿐이라 그 둘만 주입받는다.

// 한 화면에 다 담는다 — 페이지는 스크롤되지 않고 내부 영역만 스크롤.
// sm 이상에서는 루트 body의 p-6(상하 3rem)을 빼야 잘리지 않는다.
const SCREEN = "h-[100dvh] overflow-hidden sm:h-[calc(100dvh_-_3rem)]";

export default function PlayShell({
  tutorial,
  renderScenario,
  doneTitle,
  doneLink,
  initialScore,
}: {
  // start()가 오디오 잠금을 풀고 시나리오를 시작한다.
  tutorial: (start: () => void) => ReactNode;
  renderScenario: (onFinish: (score: number) => void) => ReactNode;
  doneTitle: string;
  // 끝낸 화면에 덧붙일 링크(#97). 오늘의 문제는 여기서 결과 화면으로 보낸다.
  doneLink?: ReactNode;
  // 이미 푼 사람에게는 문제 대신 결과를 보여준다(#90).
  // 기록은 브라우저에 있어 마운트 뒤에야 알 수 있으므로 나중에 들어와도 반영한다.
  initialScore?: number | null;
}) {
  const isDesktop = useIsDesktop();
  const [started, setStarted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [runId, setRunId] = useState(0); // 다시 하기 시 시나리오 리셋용
  const [restarted, setRestarted] = useState(false);

  // 이번 회차 점수가 없으면 지난 기록을 보여준다. "다시"를 누른 뒤에는 기록을 무시한다.
  const shownScore = finalScore ?? (restarted ? null : (initialScore ?? null));

  // 푸는 도중에 새로고침하면 회차가 통째로 날아간다 — 오늘 문제는 다시 못 푼다.
  // 브라우저 기본 확인창을 띄워 한 번 더 묻는다(문구는 브라우저가 정한다).
  const playing = started && shownScore === null;
  useEffect(() => {
    if (!playing) return;
    const confirmLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [playing]);

  // 이 화면에서는 페이지 자체가 스크롤되지 않는다(머무는 동안만 문서 스크롤 잠금).
  useEffect(() => {
    const { documentElement: html, body } = document;
    const prev = [html.style.overflow, body.style.overflow] as const;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev[0];
      body.style.overflow = prev[1];
    };
  }, []);

  // 브라우저 자동재생 정책상 조작 전에는 소리가 안 나므로, 시작 클릭을 잠금 해제 지점으로 쓴다.
  const start = () => {
    unlockAudio();
    setStarted(true);
  };
  const restart = () => {
    setRestarted(true);
    setFinalScore(null);
    setRunId((n) => n + 1);
    setStarted(true);
  };

  const mobileAd = isDesktop === false && (
    <div className="flex shrink-0 justify-center">
      <AdFitBanner
        unit="DAN-lgDU2Dq4xvULyTQD"
        width={320}
        height={50}
        className="mb-6"
      />
    </div>
  );
  const desktopAd = isDesktop === true && (
    <div className="fixed left-1/2 top-0 z-40 -translate-x-1/2">
      <AdFitBanner unit="DAN-oszfGEM0MoJsuWN3" width={728} height={90} />
    </div>
  );

  if (shownScore !== null) {
    return (
      <main
        className={`flex flex-col items-center justify-center gap-5 px-6 text-center ${SCREEN}`}
      >
        {desktopAd}
        <span className="text-5xl">🎉</span>
        <p className="text-lg font-bold">{doneTitle}</p>
        <p className="text-base text-muted">
          획득 점수 <span className="font-bold text-brand">{shownScore}점</span>
        </p>
        {doneLink}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground active:scale-95"
          >
            다시
          </button>
          <Link
            href="/"
            className="rounded-2xl bg-surface-muted px-5 py-2.5 text-sm font-bold text-brand active:scale-95"
          >
            처음으로
          </Link>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main
        className={`flex flex-col px-6 py-4 lg:justify-center lg:pt-28 ${SCREEN}`}
      >
        {desktopAd}
        {mobileAd}
        {tutorial(start)}
      </main>
    );
  }

  return (
    <main
      className={`flex flex-col px-6 py-4 lg:px-0 lg:pb-6 lg:pt-28 ${SCREEN}`}
    >
      {desktopAd}
      {mobileAd}
      <div key={runId} className="flex min-h-0 flex-1 flex-col">
        {renderScenario(setFinalScore)}
      </div>
    </main>
  );
}
