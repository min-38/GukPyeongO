// 지금 어느 DB에 붙어 있는지 (#107).
//
// 환경마다 다른 파일을 읽는다 — Next는 NODE_ENV로 갈라준다.
//   next dev              → .env.development.local  (로컬 OrbStack)
//   next build/start      → .env.production.local   (클라우드)
// 문제는 로컬에서 `npm start`를 켜면 그 순간 클라우드에 붙는다는 것이다.
// 이 앱은 읽기만 하지 않는다 — 응시 기록·댓글·편성 저장이 그대로 나간다.
// 그래서 어드민 화면에 어디에 붙었는지 늘 띄워 둔다.

export interface DbTarget {
  label: string;
  host: string;
  local: boolean;
}

// 자격증명은 꺼내지 않는다. 공개 URL의 호스트만 본다.
export function dbTarget(): DbTarget {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    // 값이 비었거나 형식이 깨졌으면 그대로 보여준다 — 숨기면 더 헷갈린다.
  }
  const local = /^(127\.0\.0\.1|localhost|\[::1\])(:|$)/.test(host);
  return { label: local ? "로컬 DB" : "클라우드 DB", host, local };
}
