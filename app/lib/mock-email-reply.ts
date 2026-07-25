// 답장 대조형(toggle) 시나리오.
// 장문 원문 1통으로 먼저 묻고, 이후 답장이 열린다. 둘은 탭으로 갈아끼우며 대조한다.
// 흔적 추적형은 mock-email.ts 참고. 공용 타입은 email-scenario.ts.

import { type EmailScenario } from "./email-scenario";

export const MOCK_EMAIL_REPLY: EmailScenario = {
  id: "mock-email-reply",
  sourceLabel: "메일",
  subject: "[안내] 본사 사옥 이전 관련 협조 요청",
  layout: "toggle",
  messages: [
    {
      from: "이지호",
      address: "jh.lee@nubium.co.kr",
      to: "전직원",
      at: "3월 3일 (화) 10:05",
      body: [
        "총무팀입니다. 본사 사옥 이전 일정 안내드립니다.",
        "3월 25일(화)부터 근무지가 강남 사옥 7층에서 성수 사옥 4층으로 변경됩니다. 이전 당일은 전 직원 재택근무입니다.",
        "3월 24일(월) 18시까지 개인 물품을 지급된 이전 박스에 담아 자리에 두시면 됩니다.",
        "박스는 1인 2개까지 무상 제공됩니다. 추가가 필요하면 3월 18일까지 총무팀으로 신청해주세요. 추가분은 부서 예산에서 차감됩니다.",
        "모니터·키보드 등 회사 비품은 담지 마세요. 별도 업체가 회수합니다. 단, 노트북과 충전기는 반드시 개인이 직접 소지하고 이동해주세요.",
        "성수 사옥에는 지하 주차장이 없습니다. 차량 통근자는 인근 공영주차장을 이용하셔야 하며 주차비는 지원되지 않습니다.",
        "문의는 총무팀 이지호(내선 4021).",
      ],
    },
    {
      from: "강민서",
      address: "ms.kang@nubium.co.kr",
      to: "개발2팀",
      at: "3월 5일 (목) 09:30",
      body: [
        "팀원 여러분, 총무팀 공지 정리해서 공유합니다.",
        "3월 25일 이전이고, 당일은 성수 사옥으로 정상 출근하시면 됩니다.",
        "물품은 3월 25일 18시까지 박스에 담아두세요. 노트북도 같이 넣어두시면 업체가 옮겨줍니다.",
        "박스는 인당 2개 무상이니 부족하면 말씀 주세요.",
        "차 가지고 오시는 분은 지하 주차장 이용하시면 됩니다.",
      ],
    },
  ],
  steps: [
    {
      id: "boxdeadline",
      type: "세부정보",
      prompt: "개인 물품을 박스에 담아 두어야 하는 시점은?",
      choices: ["3월 24일 18시", "3월 25일 18시", "3월 18일 18시"],
      answerIndex: 0,
      difficulty: 1,
      timeLimitSec: 30,
      showUpTo: 1,
    },
    {
      id: "boxextra",
      type: "조건판단",
      prompt: "박스를 3개 쓰려면 어떻게 해야 하나?",
      choices: [
        "3월 18일까지 총무팀에 신청하고, 추가분은 부서 예산에서 차감된다",
        "이전 당일 총무팀에서 무상으로 더 받으면 된다",
        "1인 2개 제한이라 추가로 받을 수 없다",
      ],
      answerIndex: 0,
      difficulty: 2,
      timeLimitSec: 30,
      showUpTo: 1,
    },
    {
      id: "laptop",
      type: "세부정보",
      prompt: "노트북과 충전기는 어떻게 하라고 했나?",
      choices: [
        "개인이 직접 소지하고 이동한다",
        "박스에 담아 자리에 둔다",
        "회사 비품이므로 업체가 회수한다",
      ],
      answerIndex: 0,
      difficulty: 2,
      timeLimitSec: 30,
      showUpTo: 1,
    },
    {
      id: "misquote-work",
      type: "오기재",
      prompt: "답장이 원문과 다르게 안내한 것은?",
      choices: [
        "이전 당일 근무 형태 — 원문은 재택근무다",
        "이전 날짜 — 원문은 3월 26일이다",
        "박스 무상 제공 수량 — 원문은 1개다",
      ],
      answerIndex: 0,
      difficulty: 3,
      timeLimitSec: 40,
      showUpTo: 2,
    },
    {
      id: "misquote-laptop",
      type: "오기재",
      prompt: "답장의 노트북 안내에서 잘못된 부분은?",
      choices: [
        "박스에 담으라고 했다 — 원문은 개인이 직접 소지하라고 했다",
        "반납하라고 했다 — 원문은 그대로 쓰라고 했다",
        "충전기만 챙기라고 했다 — 원문은 둘 다 챙기라고 했다",
      ],
      answerIndex: 0,
      difficulty: 3,
      timeLimitSec: 40,
      showUpTo: 2,
    },
  ],
};
