import { describe, expect, it } from "vitest";

import { sanitizeHtml } from "./sanitize-html";

describe("sanitizeHtml", () => {
  it("지문에 쓰는 태그와 클래스는 그대로 둔다", () => {
    const html =
      '<p class="text-sm">공지 <strong>본문</strong></p><ul><li>첫째</li></ul>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("인라인 이벤트 핸들러를 지운다", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)" alt="사진">');
    expect(out).not.toContain("onerror");
    expect(out).toContain('src="x"');
  });

  it("대문자·공백으로 감춘 이벤트 핸들러도 지운다", () => {
    const out = sanitizeHtml('<img src="x" OnErrOr = "alert(1)">');
    expect(out.toLowerCase()).not.toContain("onerror");
  });

  it("javascript: 링크를 지운다", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">누르기</a>');
    expect(out).not.toContain("javascript:");
    expect(out).toContain("누르기");
  });

  it("제어문자로 끊어 쓴 javascript: 도 지운다", () => {
    const out = sanitizeHtml('<a href="java\tscript:alert(1)">누르기</a>');
    expect(out).not.toContain("href");
  });

  it("iframe·object 껍데기를 벗긴다", () => {
    expect(sanitizeHtml('<iframe src="//evil"></iframe>')).toBe("");
    expect(sanitizeHtml("<object data=x></object>")).toBe("");
  });

  it("script 는 안의 내용까지 지운다", () => {
    expect(sanitizeHtml('<script>alert(1)</script>본문')).toBe("본문");
  });

  it("닫지 않은 script 도 끝까지 지운다", () => {
    expect(sanitizeHtml("앞<script>alert(1)")).toBe("앞");
  });

  it("style 은 앱 전체로 새므로 지운다", () => {
    expect(sanitizeHtml("<style>body{display:none}</style>글")).toBe("글");
  });

  it("data:text/html 은 막고 data:image 는 남긴다", () => {
    expect(sanitizeHtml('<img src="data:text/html,<script>">')).not.toContain(
      "src",
    );
    expect(sanitizeHtml('<img src="data:image/png;base64,AAA">')).toContain(
      "src",
    );
  });

  it("허용하지 않는 태그는 글만 남긴다", () => {
    expect(sanitizeHtml("<marquee>흐르는 글</marquee>")).toBe("흐르는 글");
  });

  it("빈 값을 안전하게 다룬다", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});
