// 효과음 — 에셋 없이 Web Audio로 합성 (test 화면의 방식과 동일).
// AudioContext는 모듈 단위로 1개만 생성한다.
//
// 브라우저 자동재생 정책: 사용자 조작 전에 AudioContext를 만들면
// "The AudioContext was not allowed to start" 경고가 나고 소리도 안 난다.
// 그래서 생성 자체를 첫 조작(pointerdown/keydown) 안으로 미루고,
// 그전에 들어온 재생 요청은 조용히 건너뛴다(무음 예약 방지).
// 첫 조작 전 메시지가 무음인 건 정책상 불가피 — 인테이크의
// "소리 켜고 시작" 버튼이 생기면 그 클릭이 unlock 제스처가 된다.
let audioCtx: AudioContext | null = null;
let unlockBound = false;

function bindUnlock() {
  if (unlockBound || typeof window === "undefined") return;
  unlockBound = true;
  const unlock = () => {
    try {
      audioCtx ??= new AudioContext();
      void audioCtx.resume();
    } catch {
      /* 오디오 사용 불가 시 무시 */
    }
  };
  // 어떤 입력 경로로 들어와도 잠금이 풀리도록 넓게 건다
  // (터치·포인터·클릭·키보드 활성화).
  for (const ev of ["pointerdown", "touchstart", "click", "keydown"]) {
    window.addEventListener(ev, unlock, { passive: true });
  }
}

// 사용자 제스처 핸들러 안에서 직접 호출해 오디오 잠금을 푼다.
// (시작 버튼처럼 확실한 조작 지점에서 쓰는 것이 가장 안전하다.)
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
  } catch {
    /* 오디오 사용 불가 시 무시 */
  }
}

// AudioContext는 첫 제스처(unlock) 안에서만 생성한다.
// 그 전에 생성하면 브라우저가 "not allowed to start" 경고를 낸다.
function blip(from: number, to: number, dur: number, peak: number) {
  bindUnlock();
  const ctx = audioCtx;
  if (!ctx || ctx.state !== "running") return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.006); // 빠른 어택
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur); // 툭 끊김

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch {
    /* 오디오 재생 불가 시 무시 */
  }
}

// 받은 메시지 — 짧고 밝게 올라가는 팝("뽑").
export function playMessagePop() {
  if (typeof window === "undefined") return;
  blip(520, 1040, 0.09, 0.18);
}

// 내가 보낸 메시지 — 반대로 살짝 내려가는 낮고 조용한 톡.
// 수신음과 구분되되 자기 행동이라 더 작게.
export function playSendPop() {
  if (typeof window === "undefined") return;
  blip(700, 420, 0.07, 0.12);
}
