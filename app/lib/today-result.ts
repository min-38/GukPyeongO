// 오늘 푼 기록 (#90, #97).
// 이미 푼 사람에게는 문제를 다시 내지 않고 결과를 보여준다.
//
// 서버에 남기지 않고 브라우저에만 둔다 — 아직 사용자를 식별하는 장치가 없다.
// visitor_id는 쿠키라 서버로 옮겨도 기기를 바꾸면 못 찾는다(#97). 기록이 실제 권한
// (랭킹·보상)에 걸리면 그때 로그인과 함께 서버로 옮긴다.
//
// 채점 결과 전체(StoredResult)도 함께 담는다. 결과 화면이 읽는 sessionStorage는
// 탭을 닫으면 사라져서, 그것만으로는 다시 들어온 사람에게 결과를 보여줄 수 없다.

"use client";

import { useSyncExternalStore } from "react";

import { type StoredResult } from "./quiz";

const KEY = "gukpyeongo:today";

export interface TodayResult {
  date: string; // KST 기준 YYYY-MM-DD
  score: number;
  // 문제만 끝낸 시점에는 없다. 채점이 돌아오면 채워진다.
  result?: StoredResult;
}

// 오늘 날짜(KST). 서버의 todayKst()와 같은 계산 —
// 결과 화면은 서버 컴포넌트를 거치지 않아 날짜를 받아올 자리가 없다.
export function todayKstClient(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

// 같은 날 안에서는 덮어쓰지 않고 합친다 — 문제를 끝낸 시점에 점수를 먼저 남기고
// 채점이 돌아오면 결과를 얹기 때문이다. 날짜가 바뀌면 어제 것은 버려진다.
export function saveTodayResult(next: TodayResult) {
  if (typeof window === "undefined") return;
  try {
    const prev = readTodayResult(next.date);
    window.localStorage.setItem(KEY, JSON.stringify({ ...prev, ...next }));
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
