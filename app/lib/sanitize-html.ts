// 지문 HTML 조각 정화 (#99 후속, 운영 전 보안 점검).
//
// 어드민이 쓴 HTML은 dangerouslySetInnerHTML로 모든 사용자 화면에 그려진다.
// innerHTML 경로라 <script> 본문은 실행되지 않지만 <img onerror=…>, <iframe>,
// javascript: 링크는 그대로 돈다. 어드민은 공유 비밀번호 하나로 들어가므로,
// 그 하나가 새면 전 사용자 대상 XSS가 된다.
//
// 저장할 때가 아니라 그릴 때 거른다. 유형마다 HTML이 payload 어디에 담기는지 다르고
// (공지 본문·메일 본문·서사 본문…) 이미 저장된 지문도 있어서, 화면으로 나가는
// 길목 한 곳에서 막는 편이 빠짐이 없다.
//
// 허용 목록 방식이다 — 모르는 태그는 껍데기만 벗기고 글은 남긴다.
// 이건 어드민 계정이 샜을 때를 대비한 두 번째 방어선이지, 적대적 입력을 상대로
// 검증된 파서가 아니다. 지문을 아무나 쓰게 열면 그때는 검증된 라이브러리로 바꾼다.

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "div", "span",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "small", "mark", "sub", "sup",
  "ul", "ol", "li", "dl", "dt", "dd",
  "blockquote", "pre", "code",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "a", "img", "figure", "figcaption", "time", "abbr",
]);

// 태그가 지워져도 그 안의 글까지 사라지면 지문이 통째로 비어 버린다.
// 다만 이 둘은 내용 자체가 코드라 같이 지운다.
const DROP_CONTENT_TAGS = new Set(["script", "style"]);

const ALLOWED_ATTRS = new Set([
  "class", "href", "src", "alt", "title",
  "colspan", "rowspan", "datetime", "width", "height",
]);

const URL_ATTRS = new Set(["href", "src"]);

// javascript: 같은 실행 스킴을 막는다. 사이에 낀 공백·제어문자·대소문자는 무시하고 본다.
function safeUrl(value: string): boolean {
  const scheme = value.replace(/[\u0000-\u0020]/g, "").toLowerCase();
  if (scheme.startsWith("javascript:") || scheme.startsWith("vbscript:")) {
    return false;
  }
  // data: 는 image 만 — data:text/html 은 그 자체가 스크립트 실행 통로다.
  if (scheme.startsWith("data:") && !scheme.startsWith("data:image/")) {
    return false;
  }
  return true;
}

function cleanAttributes(raw: string): string {
  const kept: string[] = [];
  const attr = /([a-zA-Z_:][-\w:.]*)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)|([a-zA-Z_:][-\w:.]*)/g;
  let m: RegExpExecArray | null;
  while ((m = attr.exec(raw)) !== null) {
    const name = (m[1] ?? m[3] ?? "").toLowerCase();
    // on* 은 통째로 막는다 — 인라인 이벤트 핸들러가 innerHTML에서 실제로 실행되는 통로다.
    if (!ALLOWED_ATTRS.has(name) || name.startsWith("on")) continue;
    if (m[2] === undefined) continue; // 값 없는 속성은 쓸 일이 없다
    const value = m[2].replace(/^["']|["']$/g, "");
    if (URL_ATTRS.has(name) && !safeUrl(value)) continue;
    kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }
  return kept.length ? ` ${kept.join(" ")}` : "";
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // 태그를 한 번만 훑는다. 태그 단위로 먼저 끊어야 속성값 안에 들어 있는 "<script>" 같은
  // 글자에 마크업이 잘리지 않는다 — 잘리면 남은 조각이 도로 태그로 읽힌다.
  const tagPattern =
    /<\s*(\/)?\s*([a-zA-Z][-\w]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
  // 주석은 조건부 주석 등을 숨길 수 있어 통째로 지운다. 태그 사이의 글에서만 찾으면 된다.
  const text = (raw: string) => raw.replace(/<!--[\s\S]*?(?:-->|$)/g, "");

  let out = "";
  let cursor = 0;
  // script·style 안에 들어온 글은 그 자체가 코드라 닫는 태그를 만날 때까지 버린다.
  let dropping: string | null = null;
  let m: RegExpExecArray | null;

  while ((m = tagPattern.exec(html)) !== null) {
    const [, closing, name, attrs] = m;
    const tag = name.toLowerCase();

    if (dropping) {
      if (closing && tag === dropping) dropping = null;
      cursor = tagPattern.lastIndex;
      continue;
    }

    out += text(html.slice(cursor, m.index));
    cursor = tagPattern.lastIndex;

    if (DROP_CONTENT_TAGS.has(tag)) {
      // 닫는 태그가 끝내 없으면 문서 끝까지 버린다 — 열어만 두고 흘리는 수를 막는다.
      if (!closing) dropping = tag;
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) continue; // 껍데기만 벗기고 안의 글은 남긴다
    if (closing) {
      out += `</${tag}>`;
      continue;
    }
    const selfClosing = /\/\s*$/.test(attrs) ? " /" : "";
    out += `<${tag}${cleanAttributes(attrs)}${selfClosing}>`;
  }

  return dropping ? out : out + text(html.slice(cursor));
}
