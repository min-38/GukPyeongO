"use client";

import Link from "next/link";

import QuestionStats from "../QuestionStats";
import useStoredResult from "../useStoredResult";

// 문제 다시 보기 (#95의 버튼이 여는 자리).
// 문항을 하나씩 넘겨 보는 화면과 별점 평가는 #96에서 만든다. 지금은 결과 화면에 있던
// 문항 목록·신고를 그대로 옮겨 왔다 — 링크가 죽지 않게, 신고 기능이 사라지지 않게.
export default function ReviewPage() {
  const result = useStoredResult();
  const hasQuestions = (result?.perQuestion.length ?? 0) > 0;

  return (
    <main className="flex flex-1 flex-col px-6 py-8 lg:mx-auto lg:w-full lg:max-w-2xl lg:py-12">
      <h1 className="font-display text-2xl">문제 다시 보기</h1>

      {hasQuestions ? (
        <QuestionStats results={result!.perQuestion} />
      ) : (
        <p className="mt-6 text-base text-muted">
          {result
            ? "이번 회차는 문항을 다시 볼 수 없어요. 준비 중이에요."
            : "아직 응시한 결과가 없어요."}
        </p>
      )}

      <Link
        href={result ? "/result" : "/test"}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-border text-base font-bold transition-colors hover:bg-surface-muted active:scale-[0.99]"
      >
        {result ? "결과로 돌아가기" : "테스트 하러 가기"}
      </Link>
    </main>
  );
}
