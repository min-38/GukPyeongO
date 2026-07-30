// 홈이 내세우는 근거 (#102).
//
// 수치를 JSX 안에 문자열로 박아두면 출처가 어디였는지, 언제 자료인지 아무도 모른다.
// 여기 한 곳에 모으고 항목마다 출처와 시점을 달아 화면에도 그대로 노출한다.
// 확인되지 않는 수치는 여기에 넣지 않는다 — 넣을 자리가 없으면 화면에서도 빠진다.

export interface Source {
  label: string; // 화면에 그대로 붙는 출처 문구
  date: string; // 발표·보도 시점
  url?: string; // 원문. 링크를 확인하지 못한 자료는 비워 둔다.
}

const PIAAC_SOURCE: Source = {
  label: "OECD 국제 성인역량조사(PIAAC) 2주기 · 경향신문 보도",
  date: "2024.12",
  url: "https://www.khan.co.kr/article/202412110600015",
};

const PISA_SOURCE: Source = {
  label: "OECD PISA 2022 한국 결과",
  date: "2023.12",
  url: "https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/korea_4e0cc43a-en.html",
};

const CASE_SIMSIM: Source = {
  label: "한국일보 「‘심심한 사과’가 부른 문해력 논란」",
  date: "2022.8",
  url: "https://www.hankookilbo.com/News/Read/A2022082517070003042",
};

const CASE_UCHEON: Source = {
  label: "한국일보 「‘우천시가 어디 있는 도시죠?’」",
  date: "2024.7",
  url: "https://www.hankookilbo.com/News/Read/A2024070117020005438",
};

// 성인 문해력 (2022~23년 조사, 2024년 12월 발표).
// 1주기(2011~12) 273점 → 2주기 249점. 1수준 이하는 "아주 단순한 과제만 풀 수 있는" 수준이다.
export const PIAAC = {
  score: 249,
  oecdScore: 260,
  prevScore: 273,
  lowLevelPercent: 30.8, // 언어능력 1수준 이하
  oecdLowLevelPercent: 26,
  topLevelPercent: 5.6, // 4~5수준
  oecdTopLevelPercent: 11.7,
  source: PIAAC_SOURCE,
};

// 청소년 읽기 (만 15세 PISA 읽기 평균). 2006년이 최고점, 2018년이 최저점이다.
// 그래프는 이 배열로 그린다 — 수치가 바뀌면 여기만 고친다.
export const PISA_READING = {
  series: [
    { year: 2006, score: 556 },
    { year: 2009, score: 539 },
    { year: 2012, score: 536 },
    { year: 2015, score: 517 },
    { year: 2018, score: 514 },
    { year: 2022, score: 515 },
  ],
  source: PISA_SOURCE,
};

// AI 답변의 가독성 — 챗봇 답변이 요구하는 독해 수준과 전문가 권장 눈높이.
// 원문 링크는 확인하지 못해 비워 둔다(출처 문구만 노출).
export const AI_READABILITY = {
  chatbotGrade: 14,
  recommendedGrade: 6,
  note: "Flesch–Kincaid 14.8 · 미국 학년 기준",
  source: {
    label: "챗봇 응답 가독성 연구(ScienceDirect·Nature)",
    date: "2023–2024",
  } satisfies Source,
};

// 실제 문해력 논란 사례 — 온라인에서 벌어진 일. 사례마다 보도 출처를 단다.
export interface LiteracyCase {
  word: string;
  prompt: string;
  reaction: string;
  fact: string;
  source: Source;
}

export const CASES: LiteracyCase[] = [
  {
    word: "사흘",
    prompt: '"사흘 안에 제출해주세요."',
    reaction: '"사(4)+흘이니까 4일이죠?"',
    fact: "사흘은 3일입니다.",
    source: CASE_SIMSIM,
  },
  {
    word: "금일",
    prompt: '"금일 마감입니다."',
    reaction: '"금요일 마감이면 미리 말해줬어야죠."',
    fact: "금일(今日)은 오늘을 뜻합니다.",
    source: CASE_SIMSIM,
  },
  {
    word: "심심한 사과",
    prompt: '"심심한 사과의 말씀을 드립니다."',
    reaction: '"사과가 심심하다고? 성의가 없네요."',
    fact: "심심(甚深)은 '매우 깊다'는 뜻입니다.",
    source: CASE_SIMSIM,
  },
  {
    word: "우천시",
    prompt: '"우천시 장소가 변경됩니다."',
    reaction: '"우천시가 어디 있는 도시죠?"',
    fact: "우천시(雨天時)는 '비가 올 때'입니다.",
    source: CASE_UCHEON,
  },
];

// 출처 한 줄 — 링크가 있으면 링크로, 없으면 글자만.
export function sourceText(s: Source): string {
  return `출처: ${s.label} (${s.date})`;
}
