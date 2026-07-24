// #70 공지 읽기 유형 mock.
// 가상 기관·가상 공고로 창작(실제 공고 금지). 낚시 조항·함정 표현을 촘촘히 심는다.
// 받아쓰기·순수 맞춤법 등 국어 지식형은 제외 — 실용문 정보 파악(문해력)만.

import { type DocScenario } from "./doc-scenario";

export const MOCK_NOTICE: DocScenario = {
  id: "mock-notice",
  sourceLabel: "공지사항",
  doc: {
    source: "국평오시청 청년정책과",
    title: "「청년 문해력 향상 지원사업」 참가자 모집 공고",
    body: [
      "1. 신청기간: 공고일 ~ 금일 18:00까지 (기간 엄수)",
      "2. 모집인원: 0명 (예산 소진으로 이번 회차 신규 선발 없음, 대기 등록만 접수)",
      "3. 대상: 국평오시에 주민등록을 둔 만 19~34세 청년",
      "4. 참가비: 무료 (단, 교재비 50,000원은 참가자 본인 부담)",
      "5. 지원금: 수료 시 최대 300,000원 지급 (출석률·과제 평가에 따라 차등)",
      "6. 오리엔테이션: 신청자 전원 필참 (미참석 시 자동 탈락)",
    ],
  },
  steps: [
    {
      id: "deadline",
      type: "세부정보",
      prompt: "신청은 언제까지 해야 하나?",
      choices: ["오늘 오후 6시까지", "이번 주 금요일까지", "다음 달 1일까지"],
      answerIndex: 0,
      difficulty: 1,
      timeLimitSec: 30,
    },
    {
      id: "quota",
      type: "낚시조항",
      prompt: "“모집인원 0명”은 무슨 뜻인가?",
      choices: [
        "이번 회차에는 신규로 뽑지 않는다",
        "인원 제한 없이 누구나 받는다",
        "0순위로 먼저 뽑는다",
      ],
      answerIndex: 0,
      difficulty: 3,
      timeLimitSec: 30,
    },
    {
      id: "cost",
      type: "낚시조항",
      prompt: "참가자가 실제로 내야 하는 돈은?",
      choices: ["교재비 5만원", "한 푼도 없음", "지원금 30만원"],
      answerIndex: 0,
      difficulty: 2,
      timeLimitSec: 30,
    },
    {
      id: "eligible",
      type: "조건판단",
      prompt: "옆 도시에 사는 만 30세는 지원할 수 있나?",
      choices: [
        "안 된다 — 국평오시 주민등록이 있어야 한다",
        "된다 — 나이 조건만 맞으면 된다",
        "된다 — 대기 등록으로 가능하다",
      ],
      answerIndex: 0,
      difficulty: 2,
      timeLimitSec: 30,
    },
  ],
};
