import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// 공유 미리보기(카카오톡·트위터·구글) 썸네일. opengraph-image 규약 파일이라
// 트위터 카드에도 동일 이미지가 자동 적용된다.
export const alt = "국평오 테스트 — 이 주의 문해력 문제";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 등급 캐릭터 9종을 한 줄로 늘어놓는다(#106).
// 1등급 하나만 쓰면 "이미 1등급"처럼 읽히는 데다, 등급이 아홉 칸이라는 게 안 보인다.
// 아홉 마리가 늘어서 있으면 그림만으로 "몇 등급인지 재는 테스트"가 전달된다.
// Satori는 외부 URL을 못 읽으므로 파일을 읽어 data URI로 넘긴다.
const OG_CHARACTER: "all" | number = "all"; // 하나만 쓰려면 등급 숫자를 넣는다(5 = 양)

async function loadAnimal(grade: number): Promise<string> {
  const file = await readFile(join(process.cwd(), `public/animals/${grade}.png`));
  return `data:image/png;base64,${file.toString("base64")}`;
}

async function loadAnimals(): Promise<string[]> {
  const grades =
    OG_CHARACTER === "all" ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [OG_CHARACTER];
  return Promise.all(grades.map(loadAnimal));
}

// 한글 렌더링용 폰트. 구형 User-Agent로 요청해 Satori가 읽는 TTF를 받는다.
// 폰트를 구글에서 받아오므로 이 요청이 실패하면 썸네일이 통째로 500이 된다.
// 카카오톡 공유가 주 유입 경로라 그 자리에서 미리보기가 사라진다 —
// 실패하면 한글 없이라도 그림은 내보낸다(아래 Image 참고).
// 한 달 캐시를 걸어 크롤러가 올 때마다 구글을 두드리지 않게 한다.
const FONT_CACHE = { next: { revalidate: 60 * 60 * 24 * 30 } };

async function loadKoreanFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch("https://fonts.googleapis.com/css2?family=Black+Han+Sans", {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.45 Safari/535.19",
        },
        ...FONT_CACHE,
      })
    ).text();
    const fontUrl = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!fontUrl) return null;
    return await fetch(fontUrl, FONT_CACHE).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const [font, animals] = await Promise.all([loadKoreanFont(), loadAnimals()]);

  // 한글 폰트를 못 받았다. 한글을 그대로 그리면 네모로 깨져 나가므로 로마자만 남긴다.
  if (!font) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "80px 96px",
            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
          }}
        >
          <div style={{ display: "flex", color: "#ffffff", fontSize: 84 }}>
            gukpyeongo.site
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {animals.slice(0, 3).map((src, i) => (
              <img key={i} src={src} width={150} height={150} alt="" />
            ))}
          </div>
        </div>
      ),
      size,
    );
  }

  const many = animals.length > 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 84px 56px",
          background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
          fontFamily: "Black Han Sans",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 28px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              color: "#e9d5ff",
              fontSize: 32,
              marginBottom: 28,
            }}
          >
            국어 문해력 테스트
          </div>
          <div style={{ display: "flex", color: "#ffffff", fontSize: 86, lineHeight: 1.1 }}>
            당신의 문해력은 몇 등급?
          </div>
          <div style={{ display: "flex", color: "#e9d5ff", fontSize: 40, marginTop: 22 }}>
            일주일마다 새 문제 · 회원가입 없이
          </div>
        </div>

        {/* 등급 1에서 9까지, 왼쪽이 높은 등급이다. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: many ? "space-between" : "flex-end",
          }}
        >
          {animals.map((src, i) => (
            <img
              key={i}
              src={src}
              width={many ? 116 : 260}
              height={many ? 116 : 260}
              alt=""
            />
          ))}
        </div>

        <div style={{ display: "flex", color: "#c4b5fd", fontSize: 30 }}>
          www.gukpyeongo.site
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Black Han Sans", data: font, style: "normal", weight: 400 }],
    }
  );
}
