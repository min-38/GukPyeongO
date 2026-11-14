"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BLANK,
  checkAnswer,
  MAX_ANSWER_LENGTH,
  type ProblemView,
  type SubmissionRow,
  type SubmitResult,
} from "@/app/lib/problems";
import { SCENARIO_KIND_LABELS, type ScenarioKind } from "@/app/lib/scenario-admin";

// 시안: 문제 풀이 웹 시안(claude.ai Design 캔버스). 상태 5개를 이 화면 하나가 오간다.
type Result = "none" | "grading" | "wrong" | "correct";

// Level 마다 글자색이 다르다. 흰 바탕에서 4.5:1 이상.
const LEVEL_CLASS = {
  1: "text-blue-600 dark:text-blue-400",
  2: "text-violet-700 dark:text-violet-400",
  3: "text-orange-700 dark:text-orange-400",
} as const;

const RESULT_BOX: Record<Result, string> = {
  none: "border-border bg-surface",
  grading: "border-border bg-surface",
  wrong: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
  correct: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
};

const icon = {
  back: <path d="M15 18l-6-6 6-6" />,
  down: <path d="M6 9l6 6 6-6" />,
  up: <path d="M6 15l6-6 6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

function Icon({ name, size = 16, stroke = 2.2 }: { name: keyof typeof icon; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon[name]}
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin motion-reduce:animate-none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="text-border" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-brand" />
    </svg>
  );
}

function PassageLine({ line }: { line: string }) {
  const parts = line.split(BLANK);
  return (
    <p className="text-base leading-7">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <span aria-label="빈칸" className="inline-block min-w-[72px] border-b-2 border-brand text-center font-bold text-brand-strong">
              (　　)
            </span>
          )}
          {part}
        </span>
      ))}
    </p>
  );
}

const textButton = "inline-flex items-center gap-1 text-sm font-medium text-brand-strong hover:underline";
const popClass = "animate-pop motion-reduce:animate-none";

const GUIDE = {
  criteria: "인정하는 답과 글자가 같아야 정답입니다. 띄어쓰기까지 같아야 하고, 앞뒤 공백은 지우고 비교합니다.",
  help: "지문을 읽고 발문이 묻는 답을 답안 칸에 직접 써서 제출하세요. 틀려도 몇 번이든 다시 낼 수 있고, 처음 맞히면 점수를 받습니다.",
};

export default function ProblemScreen({ view }: { view: ProblemView }) {
  const router = useRouter();
  const me = view.me;

  const [result, setResult] = useState<Result>(me?.lastResult ?? "none");
  const [answer, setAnswer] = useState(me?.draft ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(me?.submissionCount ?? 0);
  const [guide, setGuide] = useState<keyof typeof GUIDE | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rows, setRows] = useState<SubmissionRow[] | null>(null);
  const [modal, setModal] = useState<SubmitResult | null>(null);
  // 채점할 때마다 결과를 다시 띄운다. 정답 뒤 또 정답이면 글자가 그대로라 채점됐는지 알 수 없다.
  const [graded, setGraded] = useState(0);

  // 입력이 멈추고 1초 뒤 임시 저장(P-07). 화면을 떠날 때 남은 것은 바로 보낸다.
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDraft = useRef<string | null>(null);
  const draftUrl = `/api/problems/${view.id}/draft`;

  const sendDraft = (value: string, keepalive = false) =>
    fetch(draftUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: value }),
      keepalive,
    }).catch(() => {}); // 임시 저장 실패는 조용히 넘긴다 — 제출에는 영향이 없다.

  const cancelDraft = () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
    pendingDraft.current = null;
  };

  useEffect(() => {
    return () => {
      if (pendingDraft.current !== null) sendDraft(pendingDraft.current, true);
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
    // 화면을 떠날 때 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (value: string) => {
    setAnswer(value);
    setError(null);
    if (!me) return; // 비로그인은 저장하지 않는다.
    if (draftTimer.current) clearTimeout(draftTimer.current);
    pendingDraft.current = value;
    draftTimer.current = setTimeout(() => {
      draftTimer.current = null;
      pendingDraft.current = null;
      sendDraft(value);
    }, 1000);
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/problems/${view.id}/submissions`);
      if (res.ok) setRows((await res.json()).submissions);
    } catch {
      // 이력은 다시 열면 다시 불러온다.
    }
  };

  const toggleHistory = () => {
    const open = !historyOpen;
    setHistoryOpen(open);
    if (open) loadHistory();
  };

  const submit = async () => {
    const checked = checkAnswer(answer);
    if ("error" in checked) {
      setError(checked.error);
      return;
    }
    const before = result;
    setSubmitting(true);
    setError(null);
    setResult("grading"); // 이전 결과가 새 답의 결과로 읽히지 않게 바로 바꾼다.
    try {
      const res = await fetch(`/api/problems/${view.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: checked.answer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(before);
        setError(data.error ?? "제출하지 못했어요. 다시 시도해 주세요");
        return;
      }
      const r = data as SubmitResult;
      setResult(r.isCorrect ? "correct" : "wrong");
      setGraded((n) => n + 1);
      setCount((c) => c + 1);
      if (r.isCorrect) cancelDraft(); // 서버가 임시 답안을 지웠다(P-08). 늦게 도착한 저장이 되살리지 않게.
      if (r.pointsAwarded > 0) setModal(r);
      if (historyOpen) loadHistory();
    } catch {
      setResult(before);
      setError("제출하지 못했어요. 다시 시도해 주세요");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const kindLabel = SCENARIO_KIND_LABELS[view.passage.kind as ScenarioKind] ?? view.passage.kind;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <button type="button" onClick={back} className={`self-start ${textButton}`}>
          <Icon name="back" />
          뒤로 가기
        </button>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-brand/10 px-3 text-xs font-bold text-brand">
              {kindLabel}
            </span>
            <h1 className="font-display text-[32px] leading-10 break-keep">{view.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className={`text-sm font-bold ${LEVEL_CLASS[view.level]}`}>Level {view.level}</span>
            <span className="font-display text-2xl leading-8" aria-label={`획득 가능 ${view.points}점`}>
              {view.points}점
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        {/* 왼쪽 기준 폭 480: 1024px 화면(본문 928)에서도 오른쪽 384와 나란히 선다. */}
        <section className="flex min-w-0 flex-[999_1_480px] flex-col gap-4">
          <p className="text-lg leading-7 font-bold">{view.prompt}</p>
          <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-8">
            {view.passage.title && <h2 className="text-lg leading-7 font-bold">{view.passage.title}</h2>}
            {view.passage.body.map((line, i) => (
              <PassageLine key={i} line={line} />
            ))}
            {view.passage.source && <p className="text-right text-base leading-7">{view.passage.source}</p>}
          </article>
          {view.notes.length > 0 && (
            <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-sm font-bold">유의사항</h2>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                {view.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          )}
        </section>

        <aside className="flex min-w-0 flex-[1_1_384px] flex-col gap-4">
          <section
            aria-live="polite"
            aria-busy={result === "grading"}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 ${RESULT_BOX[result]}`}
          >
            <h2 className="text-sm font-bold">채점 결과</h2>
            {result === "none" && <strong className="font-display text-[28px] leading-9 font-normal text-muted">미제출</strong>}
            {result === "grading" && (
              <strong className="inline-flex items-center gap-2 font-display text-[28px] leading-9 font-normal text-muted">
                <Spinner />
                채점 중
              </strong>
            )}
            {result === "wrong" && (
              <strong key={graded} className={`inline-flex items-center gap-2 font-display text-[28px] leading-9 font-normal text-red-700 dark:text-red-400 ${graded ? popClass : ""}`}>
                <Icon name="x" size={24} stroke={3} />
                오답
              </strong>
            )}
            {result === "correct" && (
              <strong key={graded} className={`inline-flex items-center gap-2 font-display text-[28px] leading-9 font-normal text-green-700 dark:text-green-400 ${graded ? popClass : ""}`}>
                <Icon name="check" size={24} stroke={3} />
                정답
              </strong>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="answer" className="text-sm font-bold">답안</label>
              <div className="flex gap-4">
                {(["criteria", "help"] as const).map((k) => (
                  <button key={k} type="button" aria-expanded={guide === k}
                    onClick={() => setGuide(guide === k ? null : k)} className={textButton}>
                    {k === "criteria" ? "채점 기준" : "도움말"}
                  </button>
                ))}
              </div>
            </div>
            {guide && <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm leading-5">{GUIDE[guide]}</p>}
            <div className="flex flex-col gap-1.5">
              <textarea
                id="answer"
                value={answer}
                maxLength={MAX_ANSWER_LENGTH}
                onChange={(e) => onChange(e.target.value)}
                placeholder="답을 입력하세요"
                className="h-[120px] w-full resize-none rounded-2xl border border-[#8e88ad] bg-surface p-4 text-base leading-6 outline-none placeholder:text-muted focus:border-2 focus:border-brand focus:p-[15px] dark:border-muted"
              />
              <span className="self-end text-xs font-medium text-muted tabular-nums">
                {answer.length}/{MAX_ANSWER_LENGTH}
              </span>
            </div>
            {/* 오류 문구는 버튼 옆에 둔다. 버튼 위에 끼우면 문구가 뜰 때마다 버튼이 밀린다. */}
            <div className="flex min-h-12 items-center gap-3">
              {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
              {me ? (
                <button type="button" onClick={submit} disabled={submitting || !answer.trim()}
                  className="ml-auto h-12 shrink-0 rounded-2xl border border-brand bg-brand px-6 text-base font-bold text-brand-foreground enabled:hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40">
                  제출
                </button>
              ) : (
                // shortcut: 로그인 화면이 아직 없어 누를 곳이 없다. 로그인을 붙일 때 로그인 페이지로 잇는다(P-10).
                <button type="button"
                  className="ml-auto h-12 shrink-0 rounded-2xl border border-brand bg-surface px-6 text-base font-bold text-brand-strong hover:bg-brand/10">
                  로그인하기
                </button>
              )}
            </div>
          </section>

          {me && (
            <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">
                  제출 이력 <span className="font-medium text-muted tabular-nums">{count}</span>
                </h2>
                <button type="button" aria-expanded={historyOpen} onClick={toggleHistory} className={textButton}>
                  {historyOpen ? "접기" : "히스토리 보기"}
                  <Icon name={historyOpen ? "up" : "down"} />
                </button>
              </div>
              {historyOpen && rows && rows.length === 0 && <p className="py-2 text-sm text-muted">제출 이력 없음</p>}
              {historyOpen && rows && rows.length > 0 && (
                <table className="w-full border-collapse text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium text-muted">
                      <th className="py-2.5 text-left font-medium">제출일</th>
                      <th className="px-3 py-2.5 text-left font-medium">답안</th>
                      <th className="py-2.5 text-right font-medium">결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.createdAt} className="border-b border-border last:border-0">
                        <td className="py-2.5">{formatDate(r.createdAt)}</td>
                        <td className="px-3 py-2.5 break-all">{r.answer}</td>
                        <td className={`py-2.5 text-right font-bold ${r.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                          {r.isCorrect ? "✓ 정답" : "✕ 오답"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </aside>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,22,48,0.5)] p-6">
          <div role="dialog" aria-modal="true" aria-labelledby="score-title"
            onKeyDown={(e) => e.key === "Escape" && setModal(null)}
            className="flex w-[400px] max-w-full flex-col items-center gap-2 rounded-3xl bg-surface p-8 text-center">
            <h2 id="score-title" className="font-display text-[28px] leading-9">점수 획득</h2>
            <p className="font-display text-5xl leading-[56px] text-brand">+{modal.pointsAwarded}점</p>
            <p className="text-sm text-muted tabular-nums">
              누적 점수 {modal.totalScore - modal.pointsAwarded}점 → {modal.totalScore}점
            </p>
            <button type="button" autoFocus onClick={() => setModal(null)}
              className="mt-4 h-12 w-full rounded-2xl bg-brand text-base font-bold text-brand-foreground hover:bg-brand-strong">
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
