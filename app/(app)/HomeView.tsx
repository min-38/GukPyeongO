"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  AI_READABILITY,
  CASES,
  PIAAC,
  PISA_READING,
  type Source,
  sourceText,
} from "@/app/lib/literacy-facts";
import { gradeTheme, GRADE_TITLES } from "@/app/lib/quiz";
import { useRoundScore } from "@/app/lib/today-result";

import Footer from "./Footer";
import GradeCharacter from "./GradeCharacter";

// 색 섹션을 데스크톱에서 화면 전체 폭으로 확장 (좌우 그라데이션 노출 방지).
// 모바일/태블릿은 컨테이너(카드) 폭을 그대로 채운다.
const FULL_BLEED = "lg:relative lg:left-1/2 lg:w-screen lg:-translate-x-1/2";

// 수치 옆에 붙는 출처. 링크가 있으면 눌러서 원문으로 갈 수 있게 한다(#102).
function SourceLine({
  source,
  className = "",
}: {
  source: Source;
  className?: string;
}) {
  const text = sourceText(source);
  return (
    <p className={`text-xs text-muted ${className}`}>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted hover:text-muted"
        >
          {text}
        </a>
      ) : (
        text
      )}
    </p>
  );
}

// PISA 읽기 점수 꺾은선 (#102). 좌표를 데이터에서 계산한다 —
// 수치가 갱신되면 literacy-facts.ts만 고치면 그래프가 따라 움직인다.
// 차트 라이브러리는 들이지 않는다. 랜딩은 SEO 진입점이라 번들을 늘리지 않는다.
function PisaChart() {
  const { series } = PISA_READING;
  const scores = series.map((p) => p.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  // 위아래 여백을 주고 점수 폭을 그래프 높이에 맞춘다.
  const x = (i: number) => 36 + (i * 264) / (series.length - 1);
  const y = (score: number) =>
    150 - ((score - min) / (max - min || 1)) * 113 - 4;

  const first = series[0];
  const last = series[series.length - 1];

  return (
    <svg
      viewBox="0 0 320 180"
      className="w-full"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`한국 PISA 읽기 점수: ${first.year}년 ${first.score}점에서 ${last.year}년 ${last.score}점으로 하락`}
    >
      <line
        x1="36"
        y1="150"
        x2="300"
        y2="150"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <polyline
        points={series.map((p, i) => `${x(i)},${y(p.score)}`).join(" ")}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="4"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      {series.map((p, i) => (
        <rect
          key={p.year}
          x={x(i) - 4}
          y={y(p.score) - 4}
          width="8"
          height="8"
          fill={i === series.length - 1 ? "#dc2626" : "var(--brand)"}
        />
      ))}
      <text
        x="36"
        y={y(first.score) - 11}
        fill="var(--foreground)"
        fontSize="15"
        fontWeight="700"
        textAnchor="start"
      >
        {first.score}
      </text>
      <text
        x="300"
        y={y(last.score) - 11}
        fill="#dc2626"
        fontSize="15"
        fontWeight="700"
        textAnchor="end"
      >
        {last.score}
      </text>
      <text
        x="168"
        y="95"
        fill="#dc2626"
        fontSize="15"
        fontWeight="700"
        textAnchor="middle"
      >
        ▼ {first.score - last.score}점
      </text>
      <text x="36" y="170" fill="var(--muted)" fontSize="11" textAnchor="start">
        &apos;{String(first.year).slice(2)} 최고점
      </text>
      <text x="300" y="170" fill="var(--muted)" fontSize="11" textAnchor="end">
        &apos;{String(last.year).slice(2)}
      </text>
    </svg>
  );
}

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
      { threshold },
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

// 회차 마감을 날짜로 읽는다. 몇 시까지인지는 홈에서 알 필요 없다 — 언제까지인지만 알면 된다.
const endLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });

export default function HomeView({
  todayCount,
  roundId,
  roundEndsAt,
  finished,
}: {
  todayCount: number;
  // 진행 중인 회차. 회차 사이 빈 기간이면 null이다(#100).
  roundId: string | null;
  roundEndsAt: string | null;
  // 이번 회차를 끝낸 사람 수(#105).
  finished: number;
}) {
  // 편성이 비어 있으면 문제로 보낼 게 없다 — 버튼 문구로 알린다(#90).
  const ready = todayCount > 0;
  // 이미 푼 사람에게는 결과를 보여준다. 기록은 브라우저에만 있다.
  const solved = useRoundScore(roundId) !== null;

  const ctaLabel = !ready
    ? "다음 회차 준비 중"
    : solved
      ? "이번 주 결과 보기"
      : "이 주의 문제 풀기";
  // 이미 푼 사람을 문제 화면으로 보내면 "이 주의 문제 끝!"만 다시 본다(#97).
  const ctaHref = solved ? "/result" : "/today";
  // 회차는 일주일씩 열린다 — 마감일은 버튼 바로 위에 크게, 주기는 아래에 작게(#104).
  const deadline = ready && roundEndsAt ? endLabel(roundEndsAt) : null;
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
    onScroll(); // 스크롤된 위치로 새로고침해도 바로 반영되게 한 번 먼저 본다
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
                {/* 글줄은 왼쪽 맞춤 — 가운데 맞춤이면 국/평/오가 줄마다 어긋난다.
                    블록 자체는 부모(items-center)가 가운데로 세운다. */}
                <h1 className="text-left font-display text-5xl leading-[1.2] tracking-tight lg:text-7xl">
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
              {/* 등급을 눌러(또는 마우스를 올려) 오른쪽 카드의 캐릭터를 바꿔 본다.
                  캐릭터 9종을 한 번에 늘어놓으면 결과 화면의 재미가 먼저 새어나간다 —
                  한 번에 하나씩만 보여준다. */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onMouseEnter={() => setActiveGrade(g)}
                    onClick={() => setActiveGrade(g)}
                    // 숫자만 있으면 스크린리더가 "1"로만 읽는다. 무엇을 고르는 버튼인지 밝힌다.
                    aria-label={`${g}등급 캐릭터 보기`}
                    aria-pressed={g === activeGrade}
                    className={`grid h-11 w-11 place-items-center rounded-lg text-sm font-bold transition-colors lg:h-11 lg:w-11 lg:text-base ${
                      g === activeGrade
                        ? "bg-brand text-brand-foreground"
                        : "bg-surface-muted text-muted"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* 모바일에는 오른쪽 카드가 없다 — 고른 등급을 한 줄로 보여준다. */}
              <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-muted lg:hidden">
                {activeGrade}등급 ·
                <GradeCharacter
                  grade={activeGrade}
                  priority={false}
                  className="h-6 w-6"
                />
                <span style={{ color: theme.color }}>
                  {GRADE_TITLES[activeGrade]}
                </span>
              </p>
            </div>

            {/* 이번 회차 응시자 수(#105). 먼저 푼 사람이 있다는 것만 알려준다. */}
            <p className="mt-4 text-center text-sm text-muted lg:text-left">
              {finished === 0 ? (
                <>이번 회차는 아직 완주한 사람이 없어요. 첫 번째가 되어보세요</>
              ) : (
                <>
                  이번 회차는 지금까지{" "}
                  <b className="text-foreground">{finished}명</b>이 응시했어요
                </>
              )}
            </p>

            {/* 마감일은 누르기 직전에 봐야 한다 — 버튼 바로 위, 크게. */}
            {deadline && (
              <p className="mt-8 text-center text-xl font-extrabold lg:mt-10 lg:text-left lg:text-2xl">
                이번 회차는 <span className="text-brand">{deadline}</span>까지
              </p>
            )}
            <Link
              href={ctaHref}
              className={`group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98] lg:h-16 lg:w-auto lg:self-start lg:px-12 lg:text-xl ${
                deadline ? "mt-3" : "mt-8 lg:mt-10"
              }`}
            >
              {ctaLabel}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <p className="mt-3 text-center text-xs text-muted lg:text-left lg:text-sm">
              문제는 일주일마다 바뀝니다
            </p>

            {/* 모바일 스크롤 유도 (정상 흐름 — 캡션과 겹치지 않음) */}
            <div className="mt-5 flex flex-col items-center gap-0.5 text-brand lg:hidden">
              <span className="text-xs font-bold">아래로 더 있어요</span>
              <span className="animate-bounce text-xl leading-none">↓</span>
            </div>
          </div>

          {/* 데스크톱 우측 등급 미리보기 카드. 왼쪽 등급 버튼과 연동된다. */}
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
                className="mt-1 font-display text-4xl leading-tight tracking-tight transition-colors"
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
                    &ldquo;{c.word}&rdquo;
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

          {/* 사례마다 보도 출처가 다르다 — 같은 기사는 한 번만 적는다. */}
          <Reveal delay={500}>
            <div className="mt-8 flex flex-col items-center gap-1">
              {[...new Map(CASES.map((c) => [c.source.label, c.source])).values()].map(
                (s) => (
                  <SourceLine key={s.label} source={s} />
                ),
              )}
            </div>
          </Reveal>
        </section>

        {/* ────────────────────────────────────────────
            3. 성인 문해력 평균 (투명 — 배경 그라데이션 위)
        ──────────────────────────────────────────── */}
        <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.2em] text-brand">
              OECD 성인역량조사(PIAAC) 2주기
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-3 text-base font-medium text-muted">
              한국 성인 문해력 점수 (500점 만점)
            </p>
          </Reveal>
          <Reveal delay={260}>
            <p className="mt-1 font-display leading-none text-brand">
              <span className="text-[7rem] lg:text-[10rem]">{PIAAC.score}</span>
              <span className="text-4xl lg:text-5xl">점</span>
            </p>
          </Reveal>
          <Reveal delay={400}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-500">
              ▼ OECD 평균 {PIAAC.oecdScore}점 아래
            </span>
            <p className="mt-3 text-sm text-muted">
              10여 년 전 첫 조사에서는 {PIAAC.prevScore}점이었습니다
            </p>
          </Reveal>
          {/* 점수 하나만으로는 분포가 안 보인다 — 아래쪽이 얼마나 두꺼운지 같이 놓는다. */}
          <Reveal delay={540}>
            <div className="mt-12 flex items-center gap-6 sm:gap-10">
              <div className="text-center">
                <p className="font-display text-4xl text-brand sm:text-5xl">
                  {PIAAC.lowLevelPercent}%
                </p>
                <p className="mt-1 text-xs text-muted">
                  1수준 이하
                  <br />
                  (OECD {PIAAC.oecdLowLevelPercent}%)
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="font-display text-4xl text-muted sm:text-5xl">
                  {PIAAC.topLevelPercent}%
                </p>
                <p className="mt-1 text-xs text-muted">
                  4~5수준
                  <br />
                  (OECD {PIAAC.oecdTopLevelPercent}%)
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted/70">
              1수준 이하는 아주 단순한 과제만 풀 수 있는 수준입니다
            </p>
            <SourceLine className="mt-2" source={PIAAC.source} />
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
              한국 청소년(만 15세)의 PISA 읽기 점수. 2006년 세계 1위에서 해마다
              미끄러졌고, 지금 10대가 역대 최저 세대입니다.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <figure className="mt-10 w-full max-w-md rounded-2xl bg-surface p-5 shadow-sm">
              <PisaChart />
              <figcaption className="mt-2 text-center text-xs text-muted/80">
                한국 PISA 읽기 평균 (500점 만점) ·{" "}
                {PISA_READING.series[0].year} →{" "}
                {PISA_READING.series[PISA_READING.series.length - 1].year}
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
              연구에 따르면 챗봇 답변은 평균적으로 대학 2~3학년 수준의 독해력을
              요구합니다. 권장 눈높이보다 한참 위예요.
            </p>
          </Reveal>

          <div className="mt-10 grid w-full max-w-md gap-4 sm:grid-cols-2">
            <Reveal delay={120}>
              <div className="flex h-full flex-col items-center gap-2 rounded-2xl bg-surface p-6 text-center shadow-sm">
                <p className="font-display text-5xl text-brand sm:text-6xl">
                  {AI_READABILITY.chatbotGrade}
                  <span className="text-2xl">학년</span>
                </p>
                <p className="text-sm font-bold">
                  AI 답변이 요구하는 독해 수준
                </p>
                <p className="text-xs leading-relaxed text-muted">
                  {AI_READABILITY.note} ≈ 대학 2~3년차
                </p>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex h-full flex-col items-center gap-2 rounded-2xl bg-surface p-6 text-center shadow-sm">
                <p className="font-display text-5xl sm:text-6xl">
                  {AI_READABILITY.recommendedGrade}
                  <span className="text-2xl">학년</span>
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
            <div className="mt-6 flex flex-col items-center gap-1">
              <SourceLine source={PISA_READING.source} />
              <SourceLine source={AI_READABILITY.source} />
            </div>
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
              {!ready
                ? "다음 회차를 준비 중입니다 · 즉시 채점 · 무료"
                : solved
                  ? "이번 회차를 이미 푸셨어요 · 결과 다시 보기"
                  : `이번 회차 ${todayCount}문제 · 즉시 채점 · 무료`}
            </p>
            <p className="mt-1 text-xs text-muted/70">
              문제는 일주일마다 바뀝니다
            </p>
          </Reveal>
          <Reveal delay={200}>
            {deadline && (
              <p className="mt-8 text-xl font-extrabold lg:text-2xl">
                이번 회차는 <span className="text-brand">{deadline}</span>까지
              </p>
            )}
            <Link
              href={ctaHref}
              className={`group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-10 text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98] ${
                deadline ? "mt-3" : "mt-8"
              }`}
            >
              {ctaLabel}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Reveal>
        </section>
      </main>

      <Footer className="pb-28 lg:pb-8" />

      {/* ────────────────────────────────────────────
          하단 고정 CTA (히어로 지나친 후 표시)
      ──────────────────────────────────────────── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-gradient-to-t from-background via-background/80 to-transparent px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-12 transition-all duration-300 sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2 lg:hidden ${
          showSticky
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <Link
          href={ctaHref}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-xl shadow-brand/40 transition-all hover:bg-brand-strong active:scale-[0.98]"
        >
          {ctaLabel} →
        </Link>
      </div>
    </>
  );
}
