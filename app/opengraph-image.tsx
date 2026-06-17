import { ImageResponse } from "next/og";

// 공유 미리보기(카카오톡·트위터·구글) 썸네일. opengraph-image 규약 파일이라
// 트위터 카드에도 동일 이미지가 자동 적용된다.
export const alt = "국평오 테스트 — 검색 없이 10문제";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 대현자 마스코트 (GradeCharacter grade 1)를 data URI SVG로 삽입해 Satori가 렌더링하게 한다.
const SAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 104">
<path d="M48 58 C31 58 26 76 24 95 C23 101 28 102 34 102 L62 102 C68 102 73 101 72 95 C70 76 65 58 48 58 Z" fill="#f59e0b"/>
<circle cx="48" cy="50" r="15" fill="#ffd9b0"/>
<circle cx="43" cy="49" r="2.6" fill="#2a2440"/>
<circle cx="53" cy="49" r="2.6" fill="#2a2440"/>
<path d="M36 54 C39 80 57 80 60 54 C55 69 41 69 36 54 Z" fill="#f4f2ff"/>
<ellipse cx="48" cy="38" rx="26" ry="6" fill="#d4920f"/>
<polygon points="48,4 33,38 63,38" fill="#f5b342"/>
<circle cx="48" cy="5" r="4" fill="#f4f2ff"/>
</svg>`;
const SAGE_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(SAGE_SVG)}`;

// 한글 렌더링용 폰트. 구형 User-Agent로 요청해 Satori가 읽는 TTF를 받는다.
async function loadKoreanFont(): Promise<ArrayBuffer> {
  const css = await (
    await fetch("https://fonts.googleapis.com/css2?family=Black+Han+Sans", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.45 Safari/535.19",
      },
    })
  ).text();
  const fontUrl = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!fontUrl) throw new Error("Black Han Sans 폰트 URL을 찾지 못했습니다");
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

export default async function Image() {
  const font = await loadKoreanFont();
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
          fontFamily: "Black Han Sans",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 28px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              color: "#e9d5ff",
              fontSize: 34,
              marginBottom: 36,
            }}
          >
            국어 문해력 테스트
          </div>
          <div style={{ display: "flex", color: "#ffffff", fontSize: 92, lineHeight: 1.1 }}>
            당신의 문해력은 몇 등급?
          </div>
          <div style={{ display: "flex", color: "#e9d5ff", fontSize: 46, marginTop: 28 }}>
            빠르게 문제 풀고 등급 확인하기
          </div>
          <div style={{ display: "flex", color: "#c4b5fd", fontSize: 32, marginTop: 56 }}>
            gukpyeongo.site
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SAGE_DATA_URI} width={300} height={325} alt="" />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Black Han Sans", data: font, style: "normal", weight: 400 }],
    }
  );
}
