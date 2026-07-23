"use client";

import { useEffect, useState } from "react";

// 광고는 CSS 숨김 대신 뷰포트별 조건부 마운트에 쓴다 — 숨겨진 ins에
// 애드핏 SDK가 광고를 요청하면 콘솔 에러 + 무효노출 취급 위험이 있다.
// null = 뷰포트 미확정(SSR/첫 렌더). 확정 전에는 광고를 마운트하지 않는다.
export default function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}
