// 유형이 공유하는 재생 페이싱 헬퍼.

const clamp = (min: number, v: number, max: number) =>
  Math.min(max, Math.max(min, v));

// 대사 길이에 비례해 속도를 조절한다. 긴 메시지일수록
//  · 상대가 타이핑하는 시간이 길고(typingMs)
//  · 읽을 시간을 더 준다(readMs — 다음 등장까지의 간격).
export const typingMs = (text: string) => clamp(700, text.length * 45, 1500);
export const readMs = (text: string) => clamp(900, text.length * 60, 2600);

// 타이핑 인디케이터 → onShown 등장을 예약한다.
// 실제로 등장하는 시각(ms)을 돌려줘 다음 예약의 기준으로 쓴다.
export function scheduleTyping(
  timers: number[],
  startAt: number,
  text: string,
  setTyping: (v: boolean) => void,
  onShown: () => void
): number {
  timers.push(window.setTimeout(() => setTyping(true), startAt));
  const shownAt = startAt + typingMs(text);
  timers.push(
    window.setTimeout(() => {
      setTyping(false);
      onShown();
    }, shownAt)
  );
  return shownAt;
}
