"use client";

import { useEffect, useRef } from "react";

// 카카오 애드핏 배너.
// ba.min.js는 로드 시점에 kakao_ad_area를 스캔하므로, SPA 라우팅으로
// 마운트될 때마다 스크립트를 다시 삽입해 재스캔을 유도한다.
// 광고 미로드 시 <ins>가 display:none 그대로라 레이아웃을 차지하지 않는다.
export default function AdFitBanner({
  unit,
  width,
  height,
  className = "",
}: {
  unit: string;
  width: number;
  height: number;
  className?: string;
}) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kas/static/ba.min.js";
    script.async = true;
    ref.current?.parentElement?.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  // 광고가 붙는 순간 자리를 차지하면서 아래 내용이 밀린다 — 지문을 읽는 중에 밀리면
  // 읽던 줄을 놓친다. 들어올 높이를 미리 비워 둬서 실을 때 화면이 움직이지 않게 한다.
  return (
    <div style={{ minHeight: height }}>
      <ins
        ref={ref}
        className={`kakao_ad_area ${className}`}
        style={{ display: "none" }}
        data-ad-unit={unit}
        data-ad-width={String(width)}
        data-ad-height={String(height)}
      />
    </div>
  );
}
