"use client";

// 루트 레이아웃 자체가 터졌을 때 마지막으로 남는 화면.
// 이 경우 레이아웃이 못 그려졌으므로 globals.css 도 없다 — Tailwind 클래스는 먹지 않는다.
// 그래서 <html>/<body> 를 직접 세우고 색과 여백을 인라인으로 준다.
// (거의 올 일 없는 자리다. 여기까지 왔으면 서비스가 통째로 안 뜨는 상황이다.)
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 24,
          textAlign: "center",
          background: "#faf9ff",
          color: "#1b1533",
          fontFamily:
            "system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        }}
      >
        <span style={{ fontSize: 56 }} aria-hidden>
          🛠️
        </span>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
          잠시 서비스를 열 수 없어요
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#6b6880" }}>
          잠시 후 다시 시도해 주세요.
          <br />
          계속된다면 contact@gukpyeongo.site 로 알려주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: 48,
            minWidth: 200,
            border: 0,
            borderRadius: 16,
            background: "#7c3aed",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
        {error.digest && (
          <p style={{ margin: 0, fontSize: 11, color: "#8b88a0" }}>
            오류 코드 {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
