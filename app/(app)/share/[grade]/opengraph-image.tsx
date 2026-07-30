import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { GRADE_TITLES } from "@/app/lib/quiz";

// 결과 공유용 썸네일 (#106 후속).
// 홈의 공유 이미지는 캐릭터 아홉을 늘어놓지만, 결과를 공유할 때는 "내 등급"이 보여야 한다.
// 등급은 브라우저에만 있어서 서버가 알 수 없으므로 주소(/share/3)로 받는다.
export const alt = "국평오 테스트 결과";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 아홉 등급을 미리 만들어 둔다 — 공유 직후 크롤러가 바로 읽어가므로 그때 그리면 늦다.
export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => ({ grade: String(g) }));
}

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

// 등급을 벗어난 값이 주소로 들어와도 그림은 나와야 한다 — 5등급으로 떨어뜨린다.
function safeGrade(raw: string): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 9 ? n : 5;
}

export default async function Image({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const grade = safeGrade((await params).grade);
  const [font, animal] = await Promise.all([
    loadKoreanFont(),
    readFile(join(process.cwd(), `public/animals/${grade}.png`)).then(
      (f) => `data:image/png;base64,${f.toString("base64")}`,
    ),
  ]);

  const title = GRADE_TITLES[grade] ?? "";

  // 한글 폰트를 못 받았을 때. 한글을 그리면 네모로 깨지므로 숫자와 그림만 남긴다.
  if (!font) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
          }}
        >
          <div style={{ display: "flex", color: "#ffffff", fontSize: 200 }}>
            {grade}
          </div>
          <img src={animal} width={380} height={380} alt="" />
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "70px 90px",
          background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
          fontFamily: "Black Han Sans",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 28px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              color: "#e9d5ff",
              fontSize: 30,
              marginBottom: 26,
            }}
          >
            국평오 문해력 테스트
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div style={{ display: "flex", color: "#facc15", fontSize: 150, lineHeight: 1 }}>
              {grade}
            </div>
            <div style={{ display: "flex", color: "#ffffff", fontSize: 66, marginLeft: 12, marginBottom: 12 }}>
              등급
            </div>
          </div>
          <div style={{ display: "flex", color: "#ffffff", fontSize: 52, marginTop: 18 }}>
            {title}
          </div>
          <div style={{ display: "flex", color: "#c4b5fd", fontSize: 30, marginTop: 26 }}>
            당신은 몇 등급? · www.gukpyeongo.site
          </div>
        </div>
        <img src={animal} width={380} height={380} alt="" />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Black Han Sans", data: font, style: "normal", weight: 400 }],
    },
  );
}
