"use client";

import { useSyncExternalStore } from "react";

import { RESULT_STORAGE_KEY, type StoredResult } from "@/app/lib/quiz";

// sessionStorage의 채점 결과를 읽는다. 결과 화면과 문제 다시 보기가 같은 값을 본다(#95).
// getSnapshot은 참조가 안정적이어야 하므로 raw 문자열이 같으면 파싱 결과를 캐시해 동일 객체를 반환한다.
let cachedRaw: string | null = null;
let cachedResult: StoredResult | null = null;

function subscribe() {
  // 결과는 마운트 후 바뀌지 않으므로 구독은 비워둔다.
  return () => {};
}

function readResult(): StoredResult | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  try {
    cachedResult = raw ? (JSON.parse(raw) as StoredResult) : null;
  } catch {
    cachedResult = null;
  }
  return cachedResult;
}

export default function useStoredResult(): StoredResult | null {
  return useSyncExternalStore(subscribe, readResult, () => null);
}
