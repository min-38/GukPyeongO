// 튜토리얼 예시 지문 (#93).
// 실제 표면을 그대로 돌려 보여주므로 진짜 시나리오와 같은 형태여야 한다.
// 문항은 유형마다 하나. timeLimitSec이 0이라 제한시간 없이 눌러볼 수 있다.
//
// 오늘 낼 문제를 쓰지 않고 따로 두는 이유: 예시는 정답을 알려주는 자리라
// 편성된 문제를 쓰면 그날 답을 미리 보게 된다.

import { type ScenarioKind } from "./scenario-admin";

// 예시 문항의 공통값 — 제한시간 없음, 난이도는 표시되지 않으므로 가장 쉬운 값.
const STEP = { difficulty: 1, timeLimitSec: 0 } as const;

export const TUTORIAL_EXAMPLES: Partial<
  Record<ScenarioKind, Record<string, unknown>>
> = {
  notice: {
    id: "tutorial-notice",
    sourceLabel: "공지사항",
    doc: {
      source: "○○기관",
      title: "「예시」 강좌 수강생 모집",
      body: [
        "1. 참가비: 무료 (단, 교재비 20,000원은 본인 부담)",
        "2. 신청: 선착순 20명",
      ],
    },
    steps: [
      {
        ...STEP,
        id: "example",
        type: "낚시조항",
        prompt: "참가자가 실제로 내야 하는 돈은?",
        choices: ["교재비 2만원", "한 푼도 없음"],
        answerIndex: 0,
      },
    ],
  },

  news: {
    id: "tutorial-news",
    sourceLabel: "국평오일보",
    doc: {
      source: "○○일보 · 사회부",
      title: "“시민 절반이 이사 원한다”",
      body: [
        "설문에서 응답자의 51%가 “좋은 조건이면 이사할 의향이 있다”고 답했다.",
        "다만 “1년 안에 실제로 옮길 계획이 있다”고 밝힌 응답자는 6%였다.",
      ],
    },
    steps: [
      {
        ...STEP,
        id: "example",
        type: "제목낚시",
        prompt: "제목을 걷어내면, 이 기사가 실제로 전하는 내용은?",
        choices: [
          "의향은 절반이지만 실제 계획은 6%뿐이다",
          "시민 절반이 곧 이사한다",
        ],
        answerIndex: 0,
      },
    ],
  },

  community: {
    id: "tutorial-community",
    boardName: "국평오 갤러리",
    post: {
      author: "익명",
      title: "이거 내가 예민한 거임?",
      body: [
        "팀장이 회식 전날 저녁 10시에 “내일 다들 참석하지?”라고 단톡에 올림",
      ],
    },
    comments: [
      { nick: "ㅇㅇ", text: "전날 밤 10시에 통보면 참석이 아니라 소집이지" },
      { nick: "지나가던행인", text: "나 어제 점심 뭐 먹었게" },
    ],
    steps: [
      {
        ...STEP,
        id: "example",
        type: "논점이탈",
        prompt: "이 글과 무관한 댓글을 단 유저는?",
        choices: ["지나가던행인", "ㅇㅇ"],
        answerIndex: 0,
      },
    ],
  },

  chat: {
    id: "tutorial-chat",
    roomTitle: "회사 메신저",
    speaker: "김부장",
    steps: [
      {
        ...STEP,
        id: "example",
        type: "화법",
        context: [{ speaker: "김부장", text: "금일 보고는 언제 진행할 건가?" }],
        prompt: "어떻게 답장하지?",
        choices: [
          "네, 오늘 5시에 보고드리겠습니다.",
          "네! 금요일까지 준비하겠습니다!",
        ],
        answerIndex: 0,
        reactCorrect: "그래, 5시에 보자.",
        reactWrong: "금일은 오늘이야.",
        reactTimeout: "답이 없네?",
      },
    ],
  },

  email: {
    id: "tutorial-email",
    sourceLabel: "메일",
    subject: "[요청] 자료 회신 부탁드립니다",
    messages: [
      {
        from: "김하늘",
        address: "ha.kim@example.com",
        to: "박도윤",
        at: "3월 10일 (화) 09:12",
        body: ["회신은 3월 14일까지 부탁드립니다."],
      },
      {
        from: "박도윤",
        address: "dy.park@example.com",
        to: "김하늘",
        at: "3월 10일 (화) 14:40",
        body: ["확인했습니다. 다만 자료는 제 담당이 아닙니다."],
      },
    ],
    steps: [
      {
        ...STEP,
        id: "example",
        type: "세부정보",
        prompt: "김하늘 님이 요청한 회신 기한은?",
        choices: ["3월 14일", "3월 10일"],
        answerIndex: 0,
      },
    ],
  },

  story: {
    id: "tutorial-story",
    sourceLabel: "서사",
    source: "겨울 아침",
    title: "미리 데운 방",
    body: [
      "아버지는 새벽에 먼저 일어나 보일러를 켰다. 내가 일어났을 때 방은 이미 따뜻했다.",
      "아버지는 아무 말도 하지 않았다.",
    ],
    readSec: 8,
    steps: [
      {
        ...STEP,
        id: "example",
        type: "세부정보",
        prompt: "아버지가 실제로 한 일은?",
        choices: ["새벽에 보일러를 켰다", "아침에 방을 청소했다"],
        answerIndex: 0,
      },
    ],
  },
};
