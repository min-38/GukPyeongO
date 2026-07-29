"use client";

import { useSyncExternalStore } from "react";

import { RESULT_STORAGE_KEY, type StoredResult } from "@/app/lib/quiz";
import { readTodayResult, todayKstClient } from "@/app/lib/today-result";

// sessionStorage의 채점 결과를 읽는다. 결과 화면과 문제 다시 보기가 같은 값을 본다(#95).
// 탭을 닫았다 다시 들어온 사람은 sessionStorage가 비어 있어 오늘 기록에서 꺼내 쓴다(#97).
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
  // 이 탭에서 방금 푼 게 아니면 오늘 기록을 본다. 어제 것이면 readTodayResult가 걸러낸다.
  if (raw === null) {
    const saved = readTodayResult(todayKstClient())?.result ?? null;
    // 여기서도 캐시를 태워야 렌더마다 새 객체가 나오지 않는다.
    raw = saved ? JSON.stringify(saved) : null;
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

// 아직 읽기 전이면 undefined, 다 읽었는데 없으면 null.
// 서버 렌더에서는 저장소를 볼 수 없어 첫 그림이 무조건 "결과 없음"이 된다 —
// 둘을 구분하지 않으면 결과가 있는 사람에게도 "아직 응시한 결과가 없어요"가 한 번 스친다.
export default function useStoredResult(): StoredResult | null | undefined {
  // 서버 스냅샷은 undefined — 하이드레이션 첫 그림까지 이 값이 쓰인다.
  return useSyncExternalStore(subscribe, readResult, () => undefined);
}
