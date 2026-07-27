"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { playCountGo, playCountTick, unlockAudio } from "@/app/lib/sfx";

// 모든 시작 화면의 공용 골격 (#93).
// 한 장에 몰아 넣지 않고 이전/다음으로 한 장씩 넘긴다(v1 튜토리얼과 같은 방식).
// 마지막 장의 버튼이 시작 버튼이고, 그게 오디오 잠금 해제 지점이다.
//
// 건너뛰는 방식이 두 가지다.
//   dismissKey 있음(공통) — "다시 보지 않기". 끄면 다음부터 튜토리얼을 건너뛴다.
//   dismissKey 없음(유형별) — "바로 시작". 유형마다 읽는 법이 달라 끄지는 않는다.

export interface TutorialPage {
  // 이모지 한 글자가 보통이지만 배지 같은 작은 그림을 넣기도 한다.
  emoji?: ReactNode;
  // 예시만으로 충분한 장은 제목·설명 없이 예시만 둘 수 있다.
  title?: string;
  // 배열로 주면 문장마다 점을 찍어 한 줄씩 보여준다.
  desc?: ReactNode | ReactNode[];
  visual?: ReactNode;
}

function seen(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false; // localStorage 접근 불가 — 그냥 보여준다.
  }
}

export default function TutorialShell({
  label,
  pages,
  startLabel,
  onStart,
  dismissKey,
  framed,
  countdown,
}: {
  // 유형 이름·상황 라벨. 없으면 상단 줄 자체를 띄우지 않는다 — 위치는 점으로 보인다.
  label?: string;
  pages: TutorialPage[];
  startLabel: string;
  onStart: () => void;
  // 주면 "다시 보지 않기"가 생긴다. 없으면 "바로 시작".
  dismissKey?: string;
  // 화면을 채우지 않고 가운데 카드 하나로 띄운다.
  //   true      — 공통 튜토리얼. 글과 작은 그림만 들어간다.
  //   "example" — 유형별 튜토리얼. 예시 표면이 들어가 자리가 더 필요하고,
  //               시작할 때 유형명을 먼저 보여준다.
  framed?: boolean | "example";
  // 시작을 누르면 3·2·1을 세고 들어간다. 마음의 준비를 할 틈을 준다.
  countdown?: boolean;
}) {
  const last = pages.length - 1;
  // 튜토리얼은 언제나 첫 장부터 — 읽던 위치를 이어주지 않는다.
  const [index, setIndex] = useState(0);

  // 이미 끈 사람에게는 아예 띄우지 않는다.
  // localStorage는 서버에 없으므로 렌더 중에 읽지 않고 마운트 뒤에 확인한다.
  // 오디오 잠금은 sfx가 첫 입력에서 알아서 푼다(sfx.ts의 bindUnlock).
  // localStorage는 서버에 없어 마운트 뒤에야 껐는지 알 수 있다.
  // 그때까지 아무것도 그리지 않는다 — 먼저 그리면 껐던 사람 화면에 튜토리얼이 깜빡인다.
  const [ready, setReady] = useState(dismissKey === undefined);
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      playCountGo();
      onStart();
      return;
    }
    playCountTick();
    const t = window.setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
    // onStart는 렌더마다 새로 오므로 의존성에 넣으면 타이머가 계속 다시 걸린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  // 유형명을 먼저 보여준 뒤 제자리로 올려보낸다. 무슨 유형인지 눈에 박히게(#93).
  // 공통 튜토리얼은 유형이 없으므로 그냥 뜬다.
  const intro = framed === "example";
  const [entered, setEntered] = useState(!intro);
  // 제자리에서 화면 정중앙까지의 거리. 재서 계산해야 어느 화면에서든 정확히 가운데서 시작한다.
  const labelRef = useRef<HTMLHeadingElement>(null);
  const [riseFrom, setRiseFrom] = useState(0);
  const [measured, setMeasured] = useState(!intro);
  useLayoutEffect(() => {
    if (!intro) return;
    const measure = () => {
      const el = labelRef.current;
      if (!el) return;
      // getBoundingClientRect는 지금 걸어둔 transform까지 반영해 다시 잴 때 값이 오염된다.
      // offsetTop은 레이아웃 위치라 transform과 무관하다.
      let top = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement)
        top += n.offsetTop;
      setRiseFrom(window.innerHeight / 2 - (top + el.offsetHeight / 2));
      setMeasured(true);
    };
    measure();
    // 광고 배너가 늦게 자리를 잡으면 제자리가 밀린다 — 다음 프레임에 다시 잰다.
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [intro]);
  useEffect(() => {
    if (!intro) return;
    const t = window.setTimeout(() => setEntered(true), 650);
    return () => clearTimeout(t);
  }, [intro]);
  useEffect(() => {
    if (dismissKey === undefined) return;
    if (seen(dismissKey)) onStart();
    // 껐는지 확인한 뒤에야 그린다. 렌더 중에 읽으면 서버와 어긋나고,
    // 그리고 나서 지우면 껐던 사람 화면에 튜토리얼이 한 프레임 깜빡인다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setReady(true);
    // 마운트 시 한 번만 — onStart가 렌더마다 새로 와도 다시 부르지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;

  const page = pages[index];
  const isLast = index === last;
  // 예시만 있는 장은 자리를 더 준다 — 실제 표면이 잘리면 눌러볼 수가 없다.
  const exampleOnly = !!page.visual && !page.title && !page.desc;

  // 3 → 2 → 1 → 시작. null이면 세고 있지 않다는 뜻.
  function begin() {
    if (!countdown) return onStart();
    // 카운트 소리는 onStart(오디오 잠금 해제) 전에 나므로 여기서 먼저 풀어둔다.
    unlockAudio();
    setCount(3);
  }

  function skip() {
    if (dismissKey) {
      try {
        localStorage.setItem(dismissKey, "1");
      } catch {
        /* localStorage 접근 불가 시 무시 */
      }
    }
    onStart();
  }

  // 카운트다운 중에는 숫자만 크게 — 튜토리얼은 다 읽은 뒤라 가릴 것이 없다.
  if (count !== null && count > 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span
          key={count}
          className="animate-count-pop font-display text-8xl text-brand"
        >
          {count}
        </span>
      </div>
    );
  }

  const body = (
    <>
      {label && !framed && (
        <div className="flex shrink-0 items-center justify-between">
          <span className="text-xs font-bold tracking-wide text-brand">
            {label}
          </span>
          <span className="text-xs font-bold tabular-nums text-muted">
            {index + 1} / {pages.length}
          </span>
        </div>
      )}

      {/* 장을 넘길 때마다 새로 마운트 — 예시 표면도 처음부터 다시 돈다.
          카드형은 높이를 고정한다. 안 그러면 이전/다음마다 카드가 늘었다 줄었다 한다. */}
      <div
        key={index}
        className={`animate-rise flex min-h-0 flex-col justify-center gap-3 ${
          framed ? "h-[24rem] shrink-0 overflow-hidden" : "flex-1"
        }`}
      >
        <header className="flex min-h-0 flex-1 flex-col items-center text-center">
          {/* 이모지 자리는 높이를 고정한다 — 배지처럼 다른 그림이 오면 아래가 밀린다. */}
          {page.emoji && (
            <span className="flex h-16 shrink-0 items-center justify-center text-6xl">
              {page.emoji}
            </span>
          )}
          {page.title && (
            <h1 className="mt-4 text-2xl font-extrabold">{page.title}</h1>
          )}
          {/* 글 상자는 가운데, 글줄은 왼쪽 — 여러 줄일 때 가운데 정렬은 읽기 불편하다.
              상자 크기는 장마다 같게 고정한다. 글 길이에 따라 늘었다 줄면 카드가 흔들린다. */}
          {page.desc &&
            (Array.isArray(page.desc) ? (
              <ul className="mt-3 flex min-h-0 w-full flex-1 flex-col justify-center gap-3 overflow-y-auto rounded-2xl bg-surface-muted/30 px-4 py-3 text-left text-[17px] font-medium leading-[1.7] text-foreground/85">
                {page.desc.map((line, i) => (
                  <li key={i} className="flex gap-2.5">
                    {/* 순서가 있는 절차가 아니라 나열이라 번호 대신 점을 찍는다. */}
                    <span
                      aria-hidden
                      className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex min-h-0 w-full flex-1 items-center overflow-y-auto rounded-2xl bg-surface-muted/30 px-4 py-3 text-left text-[17px] font-medium leading-[1.7] text-foreground/85">
                {page.desc}
              </p>
            ))}
        </header>
        {/* 예시만 있는 장에서는 예시가 자리를 다 쓴다. */}
        {page.visual && (
          <div className={`min-h-0 ${exampleOnly ? "flex-1" : "mt-5 shrink"}`}>
            {page.visual}
          </div>
        )}
      </div>

      {pages.length > 1 && (
        <div className="mt-4 flex shrink-0 justify-center gap-2">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-brand" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              className="flex h-14 items-center justify-center rounded-2xl border-2 border-border px-6 text-lg font-bold active:scale-[0.98]"
            >
              이전
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? begin() : setIndex((i) => i + 1))}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-lg shadow-brand/30 active:scale-[0.98]"
          >
            {isLast ? startLabel : "다음"}
          </button>
        </div>

        {/* 마지막 장에는 건너뛸 것이 없다. 자리는 남겨둔다 — 빼면 카드 높이가 바뀐다. */}
        <button
          type="button"
          onClick={skip}
          className={`text-center text-sm font-bold text-muted ${
            isLast ? "invisible" : ""
          }`}
        >
          {dismissKey ? "다시 보지 않기" : "바로 시작"}
        </button>
      </div>
    </>
  );

  // 카드형(공통) — 화면 가운데에 내용만큼만.
  if (framed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-4 ${
          measured ? "" : "invisible"
        }`}
      >
        {label && (
          <h2
            ref={labelRef}
            className="font-display text-3xl transition-transform duration-500 ease-out"
            style={
              entered
                ? undefined
                : { transform: `translateY(${riseFrom}px) scale(1.6)` }
            }
          >
            {label}
          </h2>
        )}
        <div
          className={`flex w-full max-w-md flex-col gap-5 rounded-[2rem] border border-border bg-surface p-6 transition-opacity duration-500 ${
            entered ? "opacity-100" : "opacity-0"
          }`}
        >
          {body}
        </div>
      </div>
    );
  }

  // 전면형(유형별) — 예시 표면이 들어가므로 화면을 채운다.
  return (
    <div className="flex h-full w-full flex-col gap-4 lg:mx-auto lg:max-w-md">
      {body}
    </div>
  );
}
