"use client";

import { INPUT } from "./ui";

// 지문을 HTML 조각으로 쓰는 칸 (#99).
// 유형마다 조각 수가 다르지만(공지 1개, 커뮤니티 2개, 이메일 N개) 쓰는 법과 주의는 같아
// 한 곳에 모아 둔다.

export const HTML_GUIDE =
  "지문 상자 안에 들어갈 HTML 조각만 씁니다(DOCTYPE·html·body 불필요). " +
  "꾸밈은 앱 클래스로 — 쓸 수 있는 목록은 globals.css의 지문용 @source에 있습니다. " +
  "목록에 없는 클래스는 스타일이 먹지 않습니다. <style> 태그는 앱 전체에 새므로 쓰지 마세요.";

export function HtmlField({
  label,
  value,
  placeholder,
  rows = 14,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (html: string) => void;
}) {
  return (
    <label className="text-xs font-medium text-muted">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`mt-1 w-full font-mono text-[13px] leading-relaxed ${INPUT}`}
      />
    </label>
  );
}
