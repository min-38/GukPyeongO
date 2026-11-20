"use client";

// 목록이나 문제를 불러오지 못했을 때(문제 리스트 명세서 예외 처리).
export default function ProblemsError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-base leading-6">문제를 불러오지 못했습니다. 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="h-11 rounded-2xl bg-brand px-6 text-base font-bold text-brand-foreground hover:bg-brand-strong"
      >
        다시 시도
      </button>
    </main>
  );
}
