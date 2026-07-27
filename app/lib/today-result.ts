// 오늘 푼 기록 (#90).
// 이미 푼 사람에게는 문제를 다시 내지 않고 결과를 보여준다.
//
// 서버에 남기지 않고 브라우저에만 둔다 — 아직 사용자를 식별하는 장치가 없다.
// 기기를 바꾸면 초기화되고 손으로 지울 수도 있지만, 공식 기록이 아니라 재방문 화면을
// 고르는 용도라 그 정도로 충분하다. 서버 기록이 필요해지면 그때 옮긴다.

"use client";

import { useSyncExternalStore } from "react";

const KEY = "gukpyeongo:today";

export interface TodayResult {
  date: string; // KST 기준 YYYY-MM-DD
  score: number;
}

export function readTodayResult(date: string): TodayResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as TodayResult;
    // 날짜가 넘어갔으면 오늘 것이 아니다.
    return saved.date === date ? saved : null;
  } catch {
    return null;
  }
}

export function saveTodayResult(result: TodayResult) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // 저장이 막혀 있어도(사생활 보호 모드 등) 푸는 데는 지장이 없다.
  }
}

// 오늘 점수를 읽는 훅.
// effect로 옮겨 담으면 렌더가 한 번 더 도는 데다 서버 렌더와 어긋난다.
// 점수(원시값)를 그대로 돌려주므로 스냅샷 비교가 안정적이다.
const noopSubscribe = () => () => {};

export function useTodayScore(date: string): number | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => readTodayResult(date)?.score ?? null,
    () => null,
  );
}
