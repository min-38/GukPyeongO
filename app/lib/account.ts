// 로그인/회원가입(GUK-12) 규칙. 화면과 API가 같이 쓴다.

// 2~12자, 한글·영문·숫자만(로그인/회원가입 명세서 A-04). DB 제약(v2_profiles.sql)과 같다.
const NICKNAME_RE = /^[가-힣A-Za-z0-9]{2,12}$/;
export const MAX_NICKNAME_LENGTH = 12;
export const NICKNAME_FORMAT_ERROR = "2~12자의 한글, 영문, 숫자만 쓸 수 있습니다.";
export const NICKNAME_TAKEN_ERROR = "이미 쓰고 있는 닉네임입니다.";

export function nicknameError(nickname: unknown): string | null {
  return typeof nickname === "string" && NICKNAME_RE.test(nickname) ? null : NICKNAME_FORMAT_ERROR;
}

export type NicknameCheck = { available: true } | { available: false; reason: "format" | "taken" };

// 출생 연도 목록(A-13). 올해부터 1920년까지.
export const BIRTH_YEAR_MIN = 1920;
export function birthYears(now = new Date()): number[] {
  const years: number[] = [];
  for (let y = now.getFullYear(); y >= BIRTH_YEAR_MIN; y--) years.push(y);
  return years;
}

// 로그인 뒤 돌아갈 곳(A-07). 이 사이트 안의 주소만 받고, 로그인·가입 화면으로는 돌려보내지 않는다(돌고 돎).
export const DEFAULT_NEXT = "/problems";
export function safeNext(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return DEFAULT_NEXT;
  if (/^\/(login|signup|auth)(\/|\?|$)/.test(raw)) return DEFAULT_NEXT;
  return raw;
}

export const loginHref = (next: string) => `/login?next=${encodeURIComponent(next)}`;
export const signupHref = (next: string) => `/signup?next=${encodeURIComponent(next)}`;

// 비로그인일 때 쓴 답안을 로그인하고 돌아올 때까지 이 탭에 둔다(A-08).
export const loginDraftKey = (problemId: number) => `problems:loginDraft:${problemId}`;

// 사용자가 취소한 것 말고는 로그인 오류의 원인(공급자 설정 오류 등)을 밝히지 않고 이 문구 하나로 알린다.
export const SERVER_ERROR = "서버 오류가 발생했습니다. 다시 시도해 주세요.";

// 로그인 수단(A-01). 버튼 순서는 구글, 카카오, 네이버.
export const PROVIDERS = [
  { id: "google", label: "구글" },
  { id: "kakao", label: "카카오" },
  // 네이버는 Supabase 기본 공급자가 아니라 커스텀 OAuth 공급자로 붙인다.
  { id: "custom:naver", label: "네이버" },
] as const;
export type ProviderId = (typeof PROVIDERS)[number]["id"];
