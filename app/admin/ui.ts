// 어드민 폼 공용 스타일. 필드마다 폭·글꼴만 덧붙여 쓴다.
// 유형별 지문 편집기가 늘어나면서 같은 클래스가 파일마다 복사되던 것을 모았다.
export const INPUT =
  "rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground";

// 어드민 화면 공용 조각 (#99).
// 편성실이라는 자리에 맞춰 라벨은 자간을 넓힌 작은 글씨, 숫자는 늘 tabular-nums로 둔다.

// 목록·지표를 담는 판.
export const CARD = "rounded-2xl border border-border bg-surface";

// 항목 위에 붙는 작은 라벨. 값이 아니라 "무엇인지"를 말한다.
export const LABEL =
  "text-[11px] font-bold tracking-[0.14em] text-muted";

// 숫자를 크게 보여주는 자리. 자릿수가 바뀌어도 칸이 안 흔들린다.
export const FIGURE = "font-display text-3xl tabular-nums leading-none";
