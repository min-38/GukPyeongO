"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import useIsDesktop from "@/app/lib/useIsDesktop";
import { MOCK_SCENARIO } from "@/app/lib/mock-questions";
import { unlockAudio } from "@/app/lib/sfx";

import AdFitBanner from "../AdFitBanner";
import ChatScenario from "./ChatScenario";
import Tutorial from "./Tutorial";

// 한 화면에 다 담는다 — 페이지는 스크롤되지 않고 대화 영역만 내부 스크롤.
// sm 이상에서는 루트 body의 p-6(상하 3rem)을 빼야 잘리지 않는다.
const SCREEN = "h-[100dvh] overflow-hidden sm:h-[calc(100dvh_-_3rem)]";

export default function PlayPage() {
  const isDesktop = useIsDesktop();
  const [started, setStarted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [runId, setRunId] = useState(0); // 다시 하기 시 시나리오 리셋용

  // 이 화면에서는 페이지 자체가 스크롤되지 않는다.
  // (루트 body의 sm:p-6와 레이아웃 래퍼의 min-h-[100dvh] 때문에 데스크톱에서
  //  문서 높이가 뷰포트를 넘어가므로, 머무는 동안만 문서 스크롤을 잠근다.)
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

  // 시작 게이트. 브라우저 자동재생 정책상 사용자 조작 전에는 소리가 나지 않아
  // 첫 메시지가 무음이 된다. 시작 버튼 클릭을 잠금 해제 지점으로 쓴다.
  // (정식 인테이크 화면이 생기면 그쪽으로 흡수)
  const start = () => {
    unlockAudio();
    setStarted(true);
  };

  const restart = () => {
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

  if (finalScore !== null) {
    return (
      <main
        className={`flex flex-col items-center justify-center gap-5 px-6 text-center ${SCREEN}`}
      >
        {desktopAd}
        <span className="text-5xl">🎉</span>
        <p className="text-lg font-bold">대화 종료!</p>
        <p className="text-base text-muted">
          획득 점수 <span className="font-bold text-brand">{finalScore}점</span>
          <span className="text-sm"> (mock)</span>
        </p>
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
      <main className={`flex flex-col justify-center px-6 lg:pt-28 ${SCREEN}`}>
        {desktopAd}
        <Tutorial roomTitle={MOCK_SCENARIO.roomTitle} onStart={start} />
      </main>
    );
  }

  return (
    <main
      className={`flex flex-col px-6 py-4 lg:px-0 lg:pb-6 lg:pt-28 ${SCREEN}`}
    >
      {desktopAd}
      {mobileAd}
      <ChatScenario
        key={runId}
        scenario={MOCK_SCENARIO}
        onFinish={setFinalScore}
      />
    </main>
  );
}
