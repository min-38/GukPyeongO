// 이메일 흔적 추적형 시나리오.
// 짧은 회신이 여러 번 오간 스레드를 통째로 놓고 자취를 훑는다.
// 답장 대조형은 mock-email-reply.ts 참고. 공용 타입은 email-scenario.ts.

import { type EmailScenario } from "./email-scenario";

export const MOCK_EMAIL: EmailScenario = {
  id: "mock-email",
  sourceLabel: "메일",
  subject: "Re: Re: [요청] 상반기 사내 교육 교재 견적 회신",
  messages: [
    {
      from: "김하늘",
      address: "ha.kim@nubium.co.kr",
      to: "박도윤",
      cc: "정세라",
      at: "3월 10일 (화) 09:12",
      body: [
        "안녕하세요, 5월 사내 교육 교재 건입니다.",
        "업체에서 부가세 별도 500만원으로 견적을 받았습니다.",
        "우선 초안만 검토 부탁드리고, 최종 승인은 정세라 팀장님 확인 후 진행하겠습니다.",
        "회신은 3월 14일까지 부탁드립니다.",
      ],
    },
    {
      from: "박도윤",
      address: "dy.park@nubium.co.kr",
      to: "김하늘",
      cc: "정세라",
      at: "3월 10일 (화) 14:40",
      body: [
        "확인했습니다. 금액대는 작년과 비슷해 보입니다.",
        "다만 교재 부수는 제 담당이 아닙니다. 물류팀 최은우 대리가 관리하니 그쪽으로 문의 주세요.",
      ],
      quote: [
        "> 업체에서 부가세 별도 500만원으로 견적을 받았습니다.",
        "> 우선 초안만 검토 부탁드리고, 최종 승인은 정세라 팀장님 확인 후 진행하겠습니다.",
      ],
    },
    {
      from: "정세라",
      address: "sr.jung@nubium.co.kr",
      to: "김하늘, 박도윤",
      at: "3월 11일 (수) 08:55",
      body: ["금액은 아직 검토 중입니다. 확정된 것 아니니 발주 넣지 마세요."],
      quote: [
        "> 다만 교재 부수는 제 담당이 아닙니다. 물류팀 최은우 대리가 관리하니",
      ],
    },
    {
      from: "김하늘",
      address: "ha.kim@nubium.co.kr",
      to: "박도윤",
      at: "3월 12일 (목) 17:20",
      body: [
        "팀장님 승인해주셨다고 하니 500만원으로 확정하겠습니다.",
        "3월 4일까지 최종본으로 발주 넣겠습니다.",
        "부수는 박도윤 님께 다시 여쭙겠습니다.",
      ],
      quote: [
        "> 금액은 아직 검토 중입니다. 확정된 것 아니니 발주 넣지 마세요.",
      ],
    },
  ],
  // 흔적 추적형 — 스레드를 통째로 놓고 오간 자취를 훑는다.
  steps: [
    {
      id: "assign",
      type: "귀속",
      prompt: "교재 부수를 실제로 관리하는 사람은?",
      choices: ["물류팀 최은우 대리", "박도윤", "정세라 팀장"],
      answerIndex: 0,
      difficulty: 2,
      timeLimitSec: 30,
    },
    {
      id: "deadline",
      type: "세부정보",
      prompt: "김하늘 님이 처음에 요청한 회신 기한은?",
      choices: ["3월 14일", "3월 4일", "3월 12일"],
      answerIndex: 0,
      difficulty: 1,
      timeLimitSec: 30,
    },
    {
      id: "decision",
      type: "결정",
      prompt: "스레드 전체를 보면, 금액은 지금 어떤 상태인가?",
      choices: [
        "아직 검토 중이며 확정되지 않았다",
        "팀장 승인으로 500만원에 확정됐다",
        "금액이 너무 높아 부결됐다",
      ],
      answerIndex: 0,
      difficulty: 2,
      timeLimitSec: 30,
    },
    {
      id: "recipients",
      type: "수신범위",
      prompt: "마지막 메일의 내용을 정세라 팀장은 알 수 있는가?",
      choices: [
        "참조에서 빠져 있어 받지 못한다",
        "참조로 들어가 있어 받는다",
        "받는사람으로 지정돼 있어 받는다",
      ],
      answerIndex: 0,
      difficulty: 3,
      timeLimitSec: 40,
    },
    {
      id: "misquote",
      type: "오기재",
      prompt: "마지막 메일이 금액 조건을 옮기면서 빠뜨린 것은?",
      choices: [
        "‘부가세 별도’라는 조건을 빼고 500만원으로 확정했다",
        "500만원을 550만원으로 잘못 적었다",
        "금액을 아예 적지 않았다",
      ],
      answerIndex: 0,
      difficulty: 3,
      timeLimitSec: 40,
    },
  ],
};
