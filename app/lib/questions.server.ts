import "server-only";

import type { PublicQuestion } from "./quiz";
import type { AnswerKey } from "./scoring";

// 정답을 포함한 서버 전용 문제 형태. 이 모듈은 server-only로 보호되어
// 클라이언트 번들에 포함되지 않는다.
export interface Question extends PublicQuestion {
  answerIndex: number;
}

const questions: Question[] = [
  {
    id: "q1",
    type: "time",
    prompt: "친구가 '사흘 뒤에 보자'고 했다. 사흘 뒤는 언제인가?",
    choices: ["3일 뒤", "4일 뒤", "일주일 뒤", "오늘"],
    answerIndex: 0,
    timeLimitSec: 20,
  },
  {
    id: "q2",
    type: "hanja",
    prompt: "공지에 적힌 '금일(今日)'은 언제를 뜻하는가?",
    choices: ["오늘", "금요일", "이번 주", "다음 날"],
    answerIndex: 0,
    timeLimitSec: 20,
  },
  {
    id: "q3",
    type: "confusable",
    prompt: "'심심(甚深)한 사과 말씀드립니다'에서 '심심한'의 뜻은?",
    choices: ["지루한", "매우 깊은", "간이 싱거운", "별것 아닌"],
    answerIndex: 1,
    timeLimitSec: 20,
  },
  {
    id: "q4",
    type: "notice",
    prompt: "공지: '모집 인원 0명'. 이 공고의 의미로 알맞은 것은?",
    choices: [
      "더 이상 뽑지 않는다",
      "새로 0명을 선발한다",
      "누구나 지원 가능하다",
      "무료로 모집한다",
    ],
    answerIndex: 0,
    timeLimitSec: 20,
  },
  {
    id: "q5",
    type: "hanja",
    prompt: "'무운(武運)을 빈다'는 무슨 뜻인가?",
    choices: [
      "운이 없기를 빈다",
      "싸움에서의 행운을 빈다",
      "아무 일 없기를 빈다",
      "운을 시험한다",
    ],
    answerIndex: 1,
    timeLimitSec: 20,
  },
  {
    id: "q6",
    type: "time",
    prompt: "'모레'는 오늘로부터 며칠 뒤인가?",
    choices: ["1일 뒤", "2일 뒤", "3일 뒤", "4일 뒤"],
    answerIndex: 1,
    timeLimitSec: 20,
  },
  {
    id: "q7",
    type: "confusable",
    prompt: "'물건값을 치러 거래를 끝냄'을 뜻하는 말은?",
    choices: ["결재", "결제", "결정", "결산"],
    answerIndex: 1,
    timeLimitSec: 20,
  },
  {
    id: "q8",
    type: "notice",
    prompt: "공지: '우천 시 행사는 익일로 순연됩니다.' 익일은 언제인가?",
    choices: ["당일", "다음 날", "전날", "주말"],
    answerIndex: 1,
    timeLimitSec: 20,
  },
  {
    id: "q9",
    type: "hanja",
    prompt: "'고지식하다'의 뜻으로 알맞은 것은?",
    choices: [
      "아는 것이 많다",
      "성질이 곧아 융통성이 없다",
      "지위가 높다",
      "교양이 풍부하다",
    ],
    answerIndex: 1,
    timeLimitSec: 20,
  },
  {
    id: "q10",
    type: "confusable",
    prompt: "'사과의 색은 바나나와 ___.' 빈칸에 알맞은 말은?",
    choices: ["틀리다", "다르다", "맞다", "같다고 틀리다"],
    answerIndex: 1,
    timeLimitSec: 20,
  },
];

export function getQuestions(): Question[] {
  return questions;
}

// 채점용 정답키 (questionId -> 유형/정답). 서버에서만 사용한다.
export function getAnswerKey(): AnswerKey {
  const key: AnswerKey = {};
  for (const q of questions) {
    key[q.id] = { type: q.type, answerIndex: q.answerIndex };
  }
  return key;
}

// 정답(answerIndex)을 제거한 형태로만 반환한다.
export function getPublicQuestions(): PublicQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices,
    timeLimitSec: q.timeLimitSec,
  }));
}
