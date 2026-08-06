"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { type ScheduledScenario } from "@/app/lib/schedule.server";
import {
  GRADE_TITLES,
  type GradeRank,
  RESULT_STORAGE_KEY,
  type ReviewStep,
  type StoredResult,
} from "@/app/lib/quiz";
import { saveRoundResult, useRoundScore } from "@/app/lib/today-result";

// 회차 채점 응답 (#89). 정답·배점·만점은 서버가 DB에서 읽어 계산한다.
// 라우트가 server-only 모듈을 끌고 오므로 타입을 여기서 다시 적는다.
interface GradeResponse {
  grade: number;
  score: number;
  maxScore: number;
  correctCount: number;
  totalCount: number;
  gradeToken: string;
  roundId: string;
  typeStats: { type: string; correct: number; total: number }[];
  finishedAt: string;
  rank?: GradeRank;
}

import PlayShell from "../play/PlayShell";
import SurfaceByKind from "../play/SurfaceByKind";
import TutorialByKind from "../play/TutorialByKind";
import TutorialShell from "../play/TutorialShell";

// 오늘 편성된 문제를 이어서 푸는 한 회차 (#87).
// 유형이 섞여 나온다 — 하나가 끝나면 다음 시나리오로 넘어가고, 점수는 회차 전체로 합산한다.
export default function TodayPlay({
  scenarios,
  roundId,
}: {
  scenarios: ScheduledScenario[];
  // 지금 진행 중인 회차. 채점 요청과 기록 저장이 이 값으로 묶인다(#100).
  roundId: string;
}) {
  // 지금 푸는 시나리오와 여기까지 쌓인 점수. 마지막이 끝나면 합계를 셸에 넘긴다.
  const router = useRouter();
  const [index, setIndex] = useState(0);
  // 문제마다 그 유형의 읽는 법을 먼저 보여준다(#93). 유형이 섞여 나오기 때문(#87).
  const [kindReady, setKindReady] = useState(false);
  const [scoreSoFar, setScoreSoFar] = useState(0);
  // 문제를 풀며 알게 된 내 답과 정답. "문제 다시 보기"(#96)가 이 값을 읽는다.
  // 점수는 서버가 저장해 둔 답안으로 다시 계산하므로 여기서 만든 값은 보내지 않는다.
  const answersRef = useRef<ReviewStep[]>([]);
  // 이번 회차에 이미 푼 기록. 있으면 문제 대신 결과부터 보여준다(#90).
  const seenScore = useRoundScore(roundId);
  // 채점 중 화면. 결과 페이지로 넘어갈 때까지 이 화면을 붙잡는다.
  const [grading, setGrading] = useState(false);
  // 채점을 못 받은 경우. 그냥 두면 "채점 중" 화면에 갇힌다.
  const [gradeError, setGradeError] = useState<{
    message: string;
    retry: boolean;
  } | null>(null);

  const total = scenarios.length;
  const current = scenarios[Math.min(index, total - 1)];

  // 회차가 끝나면 서버에 답을 보내 등급을 받고 결과 화면으로 넘긴다.
  // 채점이 순식간에 끝나도 최소 시간은 보여준다 — 결과가 툭 튀어나오면 뭘 한 건지 모른다.
  const GRADING_MIN_MS = 3000;
  async function gradeAndGo() {
    setGradeError(null);
    setGrading(true);
    const shown = new Promise((r) => setTimeout(r, GRADING_MIN_MS));
    try {
      // 답은 이미 문항을 풀 때 서버에 남았다(/api/scenario-answer).
      // 여기서는 어느 회차를 끝냈는지만 알려주고, 점수는 그 기록으로 계산된다.
      const res = await fetch("/api/today-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId }),
      });
      if (!res.ok) {
        await shown;
        setGrading(false);
        setGradeError(
          res.status === 409
            ? { message: "이미 응시한 회차예요.", retry: false }
            : { message: "채점을 마치지 못했어요.", retry: true },
        );
        return;
      }
      const g = (await res.json()) as GradeResponse;

      // 결과 화면은 v1 채점 응답 모양을 그대로 읽는다. 없는 값(반응 속도 등)은 비워 둔다.
      const stored: StoredResult = {
        mode: "quick",
        modeLabel: "이 주의 문제",
        score: g.score,
        maxScore: g.maxScore,
        grade: g.grade,
        title: GRADE_TITLES[g.grade] ?? "",
        correctCount: g.correctCount,
        totalCount: g.totalCount,
        avgReactionMs: 0,
        weakTypes: g.typeStats
          .filter((t) => t.correct < t.total)
          .map((t) => t.type),
        typeStats: g.typeStats as StoredResult["typeStats"],
        gradeToken: g.gradeToken,
        roundId: g.roundId,
        finishedAt: g.finishedAt,
        review: answersRef.current,
        ...(g.rank ? { rank: g.rank } : {}),
        perQuestion: [],
        typeLabels: Object.fromEntries(
          g.typeStats.map((t) => [t.type, t.type]),
        ),
      };
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(stored));
      // 다시 들어온 사람에게도 결과를 보여주려면 탭이 닫혀도 남아야 한다(#97).
      saveRoundResult({ roundId, score: g.score, result: stored });
      // 채점이 더 오래 걸렸으면 기다린 만큼만, 빨리 끝났으면 최소 시간까지.
      await shown;
      router.push("/result");
    } catch {
      await shown;
      setGrading(false);
      setGradeError({
        message: "채점을 마치지 못했어요. 연결을 확인해 주세요.",
        retry: true,
      });
    }
  }

  if (gradeError) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">😵</span>
        <p className="font-display text-2xl">{gradeError.message}</p>
        <p className="text-sm text-muted">
          {gradeError.retry
            ? "답을 낸 기록은 서버에 남아 있어요. 다시 시도해 주세요."
            : "이 회차의 결과는 결과 화면에서 볼 수 있어요."}
        </p>
        <div className="flex gap-3">
          {gradeError.retry ? (
            <button
              type="button"
              onClick={() => void gradeAndGo()}
              className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground active:scale-95"
            >
              다시 시도
            </button>
          ) : (
            <Link
              href="/result"
              className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground active:scale-95"
            >
              결과 보기
            </Link>
          )}
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

  if (grading) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <span className="animate-float text-5xl">🧮</span>
        <p className="font-display text-2xl">채점 중이에요</p>
        <p className="text-sm text-muted">잠시만 기다려주세요.</p>
      </main>
    );
  }

  return (
    <PlayShell
      initialScore={seenScore}
      // 한 회차는 한 번만 응시한다 — 여기서 다시 풀 길을 열어두면 안 된다.
      allowRestart={false}
      doneTitle="이 주의 문제 끝!"
      doneLink={
        <Link
          href="/result"
          className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground active:scale-95"
        >
          결과 보기
        </Link>
      }
      tutorial={(start) => (
        <TutorialShell
          framed
          countdown
          pages={[
            {
              title: "테스트 방식",
              desc: [
                "다양한 유형의 문항이 연속으로 출제됩니다.",
                "지문을 잘 읽고 문제에 알맞은 답을 선택해 보세요.",
                "한 회차는 한 번만 응시할 수 있어요."
              ]
            },
            {
  
              title: "시간 제한",
              desc: [
                "문제가 나오고 제한시간이 시작됩니다.",
                "시간 초과 시 오답 처리됩니다.",
              ]
            },
            {
              title: "읽기 시간",
              desc: [
                "긴 지문의 경우 읽기 시간을 드립니다.",
                "독서 타이머를 눌러 스킵하고 바로 진행할 수 있어요.",
              ]
            },
            {
              title: "점수 배점",
              desc: [
                "문제의 난이도마다 배점을 달리 정했습니다.",
                "각 문제마다 배점을 보여줍니다."
              ]
            },
            {
              title: `등급 산정`,
              desc: [
                "정답을 맞춘 점수를 합산해 등급을 매겨요.",
                "26년도 수능 국어 영역 등급 기준을 참고했습니다.",
              ],
            },
            {
              title: "모두 지어낸 이야기",
              desc: [
                "지문의 인물·기관·도시·법령 등은 모두 가상의 설정입니다.",
                "실제 정보로 받아들이지 마세요.",
                "읽는 능력을 재기 위해 만든 글입니다.",
              ],
            },
          ]}
          startLabel="시작하기"
          onStart={() => {
            // 시작만 하고 이탈한 사람도 세야 이탈 지점이 보인다(#91).
            void fetch("/api/today-session", { method: "POST" });
            // 다시 하기로 들어와도 처음부터 — 셸이 이 트리를 새로 마운트한다.
            setIndex(0);
            setKindReady(false);
            setScoreSoFar(0);
            start();
          }}
        />
      )}
      renderScenario={(onFinish) => (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* 끝이 안 보이면 지문이 바뀌는 자리에서 나간다(#100).
              문항이 아니라 지문 단위로 센다 — 문항 수는 지문마다 다르고 미리 알려주지 않는다.
              막대는 같은 말을 다시 하는 그림이라 읽어주지 않는다. */}
          <div className="mb-3 shrink-0">
            <p className="mb-1 text-xs text-muted">
              지문 {index + 1} / {total}
            </p>
            <div aria-hidden className="h-1 rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>
          {!kindReady ? (
            <TutorialByKind
              key={`tutorial-${index}`}
              kind={current.kind}
              scenario={current.content}
              onStart={() => {
                // 첫 지문 화면에 들어간 시각을 남긴다(#105). 시작과 첫 문항 사이에서
                // 유형 튜토리얼에서 나갔는지, 지문을 읽다 나갔는지를 이 표식이 가른다.
                // 두 번째 지문부터는 답안으로 이미 보이므로 첫 지문에서만 부른다.
                if (index === 0) {
                  void fetch("/api/today-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stage: "reading" }),
                  });
                }
                setKindReady(true);
              }}
            />
          ) : (
            <SurfaceByKind
              // 시나리오가 바뀌면 표면을 새로 마운트해 재생을 처음부터 돌린다.
              key={index}
              kind={current.kind}
              scenario={current.content}
              slug={current.slug}
              onAnswered={(stepKey, choiceIndex, answerIndex) =>
                answersRef.current.push({
                  slug: current.slug,
                  stepKey,
                  choiceIndex,
                  answerIndex,
                })
              }
              onFinish={(score) => {
                const sum = scoreSoFar + score;
                if (index + 1 >= total) {
                  saveRoundResult({ roundId, score: sum });
                  void gradeAndGo();
                  return onFinish(sum);
                }
                setScoreSoFar(sum);
                setIndex(index + 1);
                setKindReady(false);
              }}
            />
          )}
        </div>
      )}
    />
  );
}
