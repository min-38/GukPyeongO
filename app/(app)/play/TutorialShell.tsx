"use client";

import { type ReactNode } from "react";

// 모든 유형 시작 화면의 공용 골격.
// 헤더(라벨·제목·부제) + 유형별 미니 데모 + 01/02/03 안내 + 시작 버튼.
// 데모·안내 문구만 유형마다 다르므로 그 부분만 주입받는다.
// 시작 버튼 클릭이 오디오 잠금 해제 지점이기도 하다(자동재생 정책).
export default function TutorialShell({
  label,
  title,
  subtitle,
  demo,
  steps,
  startLabel,
  onStart,
}: {
  label: string;
  title: string;
  subtitle: ReactNode;
  demo: ReactNode; // 유형별 미니 데모 카드(래퍼 포함)
  steps: ReactNode[]; // 01/02/03 안내 문구
  startLabel: string;
  onStart: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-5 lg:mx-auto lg:max-w-md">
      <header className="text-center">
        <p className="text-xs font-bold tracking-wide text-brand">{label}</p>
        <h1 className="mt-1 text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </header>

      {demo}

      <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 font-bold text-brand">0{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onStart}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-base font-bold text-brand-foreground active:scale-[0.99]"
        >
          {startLabel}
        </button>
        <p className="text-center text-xs text-muted">
          🔊 효과음이 재생됩니다 · 검색은 양심에 맡길게요
        </p>
      </div>
    </div>
  );
}
