"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { gradeTheme, GRADE_TITLES } from "@/app/lib/quiz";

import GradeCharacter from "./GradeCharacter";

// 실제 문해력 논란 사례 (온라인에서 우리 또래 사이에 벌어진 일)
const CASES = [
  {
    word: "사흘",
    prompt: '"사흘 안에 제출해주세요."',
    reaction: '"사(4)+흘이니까 4일이죠?"',
    fact: "사흘은 3일입니다.",
  },
  {
    word: "금일",
    prompt: '"금일 마감입니다."',
    reaction: '"금요일 마감이면 미리 말해줬어야죠."',
    fact: "금일(今日)은 오늘을 뜻합니다.",
  },
  {
    word: "심심한 사과",
    prompt: '"심심한 사과의 말씀을 드립니다."',
    reaction: '"사과가 심심하다고? 성의가 없네요."',
    fact: "심심(甚深)은 '매우 깊다'는 뜻입니다.",
  },
  {
    word: "모집 0명",
    prompt: '"배우 모집 인원: 0명"',
    reaction: '"0명 뽑는다고 공고는 왜 냈어요?"',
    fact: "한 자릿수 채용의 관행적 표기입니다.",
  },
];

// 색 섹션을 데스크톱에서 화면 전체 폭으로 확장 (좌우 그라데이션 노출 방지).
// 모바일/태블릿은 컨테이너(카드) 폭을 그대로 채운다.
const FULL_BLEED = "lg:relative lg:left-1/2 lg:w-screen lg:-translate-x-1/2";

// 스크롤 진입 시 한 번 트리거되는 훅
function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal(0.15);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [activeGrade, setActiveGrade] = useState(5);
  const theme = gradeTheme(activeGrade);

  // 히어로 아래로 스크롤하면 하단 고정 CTA 표시
  const heroRef = useRef<HTMLElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const bottom = heroRef.current?.getBoundingClientRect().bottom ?? 1;
      setShowSticky(bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <main className="flex flex-col">
        {/* ────────────────────────────────────────────
            1. 히어로
        ──────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative flex min-h-[100dvh] flex-col px-6 pb-8 pt-12 lg:grid lg:min-h-[100dvh] lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-16 lg:py-0"
        >
          <div className="flex flex-1 flex-col lg:flex-none">
            <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center lg:flex-none lg:items-start lg:gap-8 lg:text-left">
              <span className="animate-float inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-sm">
                문해력 상승 프로젝트
              </span>

              <div className="flex flex-col items-center gap-4 lg:items-start">
                <h1 className="font-display text-5xl leading-[1.2] tracking-tight lg:text-7xl">
                  <span className="text-brand">국</span>민 문해력
                  <br />
                  <span className="text-brand">평</span>균을
                  <br />
                  <span className="text-brand">오</span>르게
                </h1>
                <p className="text-2xl font-extrabold leading-snug lg:text-4xl">
                  <span className="text-brand">내 문해력은 몇 등급?</span>
                </p>
              </div>

              <p className="max-w-xs text-base leading-relaxed text-muted lg:max-w-md lg:text-lg">
                회원가입 없이 바로 시작.
                <br /> 1~9등급으로 결과가 딱 나와요.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onMouseEnter={() => setActiveGrade(g)}
                    onClick={() => setActiveGrade(g)}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold transition-colors lg:h-10 lg:w-10 lg:text-base ${
                      g === activeGrade
                        ? "bg-brand text-brand-foreground"
                        : "bg-surface-muted text-muted"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-muted lg:hidden">
                {activeGrade}등급 ·
                <GradeCharacter grade={activeGrade} className="h-6 w-6" />
                <span style={{ color: theme.color }}>
                  {GRADE_TITLES[activeGrade]}
                </span>
              </p>
            </div>

            <Link
              href="/test"
              className="group mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98] lg:mt-10 lg:h-16 lg:w-auto lg:self-start lg:px-12 lg:text-xl"
            >
              테스트 시작
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <p className="mt-3 text-center text-xs text-muted lg:text-left lg:text-sm">
              당신의 문해력 캐릭터는 무엇일까?
            </p>

            {/* 모바일 스크롤 유도 (정상 흐름 — 캡션과 겹치지 않음) */}
            <div className="mt-5 flex flex-col items-center gap-0.5 text-brand lg:hidden">
              <span className="text-xs font-bold">아래로 더 있어요</span>
              <span className="animate-bounce text-xl leading-none">↓</span>
            </div>
          </div>

          {/* 데스크톱 우측 등급 미리보기 카드 */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <div className="animate-float w-full max-w-sm rounded-[2rem] border border-border bg-surface p-8 text-center shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)]">
              <GradeCharacter
                grade={activeGrade}
                className="mx-auto h-32 w-32"
              />
              <p className="mt-3 text-sm font-bold tracking-widest text-muted">
                나의 문해력 캐릭터
              </p>
              <p
                className="mt-1 font-display text-5xl leading-tight tracking-tight transition-colors"
                style={{ color: theme.color }}
              >
                {GRADE_TITLES[activeGrade]}
              </p>
              <p
                className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-extrabold text-white transition-colors"
                style={{ backgroundColor: theme.color }}
              >
                {activeGrade}등급
              </p>
              <p className="mt-4 text-sm text-muted">
                등급 배지에 마우스를 올려보세요. 당신은?
              </p>
            </div>
          </div>

          {/* 데스크톱 스크롤 유도 (절대배치 — CTA가 좌측이라 하단 중앙 비어 있음) */}
          <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-brand lg:flex">
            <span className="text-xs font-bold">아래로 더 있어요</span>
            <span className="animate-bounce text-xl leading-none">↓</span>
          </div>
        </section>

        {/* ────────────────────────────────────────────
            2. 실제 논란 사례 (가장 와닿는 훅 → 맨 위)
        ──────────────────────────────────────────── */}
        <section
          className={`flex min-h-[75vh] flex-col items-center justify-center bg-surface-muted px-6 py-24 ${FULL_BLEED}`}
        >
          <Reveal>
            <h2 className="text-center font-display text-3xl lg:text-4xl">
              이런 장면, 낯설지 않으시죠?
            </h2>
            <p className="mt-2 text-center text-sm text-muted">
              온라인에서 우리 또래 사이에 벌어진 진짜 논란들
            </p>
          </Reveal>

          <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            {CASES.map((c, i) => (
              <Reveal key={c.word} delay={i * 110}>
                <div className="flex h-full flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm">
                  <span className="w-fit rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold text-brand">
                    "{c.word}"
                  </span>
                  <p className="text-sm text-muted">
                    공지문:{" "}
                    <span className="font-medium text-foreground">
                      {c.prompt}
                    </span>
                  </p>
                  <div className="rounded-xl bg-red-50 px-3 py-2.5 dark:bg-red-950/20">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      😤 {c.reaction}
                    </p>
                  </div>
                  <p className="mt-auto text-xs text-muted">{c.fact}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={500}>
            <p className="mt-8 text-center text-xs text-muted">
              출처: 한국일보(2024.8), 아주경제(2024.4)
            </p>
          </Reveal>
        </section>

        {/* ────────────────────────────────────────────
            3. 성인 문해력 평균 (투명 — 배경 그라데이션 위)
        ──────────────────────────────────────────── */}
        <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.2em] text-brand">
              OECD PIAAC 2023 · 성인역량조사
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-3 text-base font-medium text-muted">
              한국 성인 문해력 점수 (500점 만점)
            </p>
          </Reveal>
          <Reveal delay={260}>
            <p className="mt-1 font-display leading-none text-brand">
              <span className="text-[7rem] lg:text-[10rem]">249</span>
              <span className="text-4xl lg:text-5xl">점</span>
            </p>
          </Reveal>
          <Reveal delay={400}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-500">
              ▼ OECD 평균 260점 아래
            </span>
            <p className="mt-3 text-sm text-muted">
              31개국 중 10년 새 20점 이상 떨어진 4개국에 한국 포함
            </p>
          </Reveal>
          <Reveal delay={540}>
            <div className="mt-12 flex items-center gap-6 sm:gap-10">
              <div className="text-center">
                <p className="font-display text-4xl text-muted sm:text-5xl">
                  13%
                </p>
                <p className="mt-1 text-xs text-muted">
                  2012년
                  <br />
                  기초 문해력 미달
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl text-brand">→</span>
                <span className="text-xs text-muted">10년 뒤</span>
              </div>
              <div className="text-center">
                <p className="font-display text-4xl text-brand sm:text-5xl">
                  31%
                </p>
                <p className="mt-1 text-xs text-muted">
                  2023년
                  <br />
                  기초 문해력 미달
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted/70">
              기초 문해력 미달 성인 10년 사이 2.4배 증가
            </p>
          </Reveal>
        </section>

        {/* ────────────────────────────────────────────
            4. 지금 10대가 가장 낮은 세대 + AI 역설 (PISA 하락 → AI)
        ──────────────────────────────────────────── */}
        <section
          className={`flex min-h-[80vh] flex-col items-center justify-center bg-surface-muted px-6 py-24 ${FULL_BLEED}`}
        >
          {/* 4-A. PISA 읽기 16년 하락 */}
          <Reveal>
            <p className="text-center text-xs font-bold tracking-[0.2em] text-brand">
              수학·과학은 세계 최상위, 그런데
            </p>
            <h2 className="mt-3 text-center font-display text-3xl leading-snug lg:text-4xl">
              읽기는 16년째
              <br />
              내리막입니다
            </h2>
            <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-muted">
              한국 청소년(만 15세)의 PISA 읽기 점수. 2006년 세계 1위에서
              해마다 미끄러졌고, 지금 10대가 역대 최저 세대입니다.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <figure className="mt-10 w-full max-w-md rounded-2xl bg-surface p-5 shadow-sm">
              <svg
                viewBox="0 0 320 180"
                className="w-full"
                shapeRendering="crispEdges"
                role="img"
                aria-label="한국 PISA 읽기 점수: 2006년 556점에서 2022년 515점으로 하락"
              >
                {/* 기준선 */}
                <line
                  x1="36"
                  y1="150"
                  x2="300"
                  y2="150"
                  stroke="var(--border)"
                  strokeWidth="2"
                />
                {/* 하락 라인 (각진 픽셀 톤) */}
                <polyline
                  points="36,37 89,75 142,81 194,123 247,130 300,128"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="4"
                  strokeLinejoin="miter"
                  strokeLinecap="square"
                />
                {/* 픽셀 마커 (정사각형 점) */}
                <rect x="32" y="33" width="8" height="8" fill="var(--brand)" />
                <rect x="85" y="71" width="8" height="8" fill="var(--brand)" />
                <rect x="138" y="77" width="8" height="8" fill="var(--brand)" />
                <rect x="190" y="119" width="8" height="8" fill="var(--brand)" />
                <rect x="243" y="126" width="8" height="8" fill="var(--brand)" />
                <rect x="296" y="124" width="8" height="8" fill="#dc2626" />
                {/* 점수·연도 라벨 */}
                <text
                  x="36"
                  y="26"
                  fill="var(--foreground)"
                  fontSize="15"
                  fontWeight="700"
                  textAnchor="start"
                >
                  556
                </text>
                <text
                  x="300"
                  y="116"
                  fill="#dc2626"
                  fontSize="15"
                  fontWeight="700"
                  textAnchor="end"
                >
                  515
                </text>
                <text
                  x="168"
                  y="95"
                  fill="#dc2626"
                  fontSize="15"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  ▼ 41점
                </text>
                <text
                  x="36"
                  y="170"
                  fill="var(--muted)"
                  fontSize="11"
                  textAnchor="start"
                >
                  &apos;06 세계 1위
                </text>
                <text
                  x="300"
                  y="170"
                  fill="var(--muted)"
                  fontSize="11"
                  textAnchor="end"
                >
                  &apos;22
                </text>
              </svg>
              <figcaption className="mt-2 text-center text-xs text-muted/80">
                한국 PISA 읽기 평균 (500점 만점) · 2006 → 2022
              </figcaption>
            </figure>
          </Reveal>

          {/* 4-B. AI 역설 */}
          <Reveal delay={120}>
            <p className="mt-20 text-center text-xs font-bold tracking-[0.2em] text-brand">
              그리고 이제
            </p>
            <h2 className="mt-3 text-center font-display text-3xl leading-snug lg:text-4xl">
              AI가 글을 씁니다
              <br />
              읽는 건 당신이고요
            </h2>
            <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-muted">
              연구에 따르면 챗봇 답변은 평균적으로 대학 2~3학년 수준의
              독해력을 요구합니다. 권장 눈높이보다 한참 위예요.
            </p>
          </Reveal>

          <div className="mt-10 grid w-full max-w-md gap-4 sm:grid-cols-2">
            <Reveal delay={120}>
              <div className="flex h-full flex-col items-center gap-2 rounded-2xl bg-surface p-6 text-center shadow-sm">
                <p className="font-display text-5xl text-brand sm:text-6xl">
                  14<span className="text-2xl">학년</span>
                </p>
                <p className="text-sm font-bold">AI 답변이 요구하는 독해 수준</p>
                <p className="text-xs leading-relaxed text-muted">
                  미국 학년 기준 ≈ 대학 2~3년차 (Flesch–Kincaid 14.8)
                </p>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex h-full flex-col items-center gap-2 rounded-2xl bg-surface p-6 text-center shadow-sm">
                <p className="font-display text-5xl sm:text-6xl">
                  6<span className="text-2xl">학년</span>
                </p>
                <p className="text-sm font-bold">전문가 권장 눈높이</p>
                <p className="text-xs leading-relaxed text-muted">
                  일반 독자가 무리 없이 읽는 수준 (미국의학협회 권고)
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={360}>
            <p className="mt-8 max-w-sm text-center text-sm font-bold leading-relaxed text-foreground">
              AI는 점점 똑똑해지는데, 그 답을 읽어낼 사람은 준비됐을까요?
            </p>
            <p className="mt-6 text-center text-xs text-muted">
              출처: OECD PISA 2022 · 챗봇 응답 가독성 연구(ScienceDirect 2023, Nature 2024)
            </p>
          </Reveal>
        </section>

        {/* ────────────────────────────────────────────
            5. 최하단 CTA
        ──────────────────────────────────────────── */}
        <section className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-24 text-center">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.2em] text-brand">
              지금 바로
            </p>
            <h2 className="mt-3 font-display text-3xl lg:text-5xl">
              나의 등급은 몇 등급일까요?
            </h2>
            <p className="mt-3 text-sm text-muted">
              빠른 10문제 · 정밀 30문제 · 즉시 채점 · 무료
            </p>
          </Reveal>
          <Reveal delay={200}>
            <Link
              href="/test"
              className="group mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-10 text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98]"
            >
              테스트 시작
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Reveal>
        </section>
      </main>

      {/* ────────────────────────────────────────────
          하단 고정 CTA (히어로 지나친 후 표시)
      ──────────────────────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-gradient-to-t from-background via-background/80 to-transparent px-6 pb-5 pt-12 transition-all duration-300 sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2 lg:hidden ${
          showSticky
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <Link
          href="/test"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-xl shadow-brand/40 transition-all hover:bg-brand-strong active:scale-[0.98]"
        >
          테스트 시작 →
        </Link>
      </div>
    </>
  );
}
