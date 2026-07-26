// #69 커뮤니티 유형 mock.
// 한 게시물 = 시나리오 1개. 원글 위에서 문제가 여러 개 이어진다.
// 각 스텝이 자기 앞에 새로 등장할 콘텐츠(원글 or 댓글 묶음)를 가진다.
// 댓글은 "이미 달려 있는" 글이다 — 정답/오답에 따라 새로 달리지 않는다.
// 실제 커뮤니티 글을 긁지 않고 가상 인물·가상 상황으로 창작(저작권·명예훼손 회피).

import { type CommunityScenario } from "./community-scenario";

export const MOCK_COMMUNITY: CommunityScenario = {
  id: "mock-community",
  boardName: "국평오 갤러리",
  post: {
    author: "익명",
    title: "이거 내가 예민한거임??? 회사 단톡 레전드ㅋㅋ",
    body: [
      "아 진짜 어의없어서 글쓴다",
      "오늘 부장이 단톡에 “금일 오후까지 다들 취합해서 제출바람” 이래놓고",
      "정작 자기는 사흘째 자료 안올림;;",
      "근데 내가 “언제 올려주실까요?” 했더니",
      "“김대리 성격 참 급하네~ 천천히 좀 하지” 이러는거 실화냐고",
      "나만 이상한거야?? 판단좀",
    ],
  },
  comments: [
    {
      nick: "ㅇㅇ",
      text: "금일이면 오늘인데 왜 사흘째 얘기가 나옴? 글을 정리해서 써라",
    },
    {
      nick: "지나가던행인",
      text: "ㄴ 부장이 3일째 안 올렸단 거잖아 이걸 못 읽네ㅋㅋ",
      reply: true,
    },
    {
      nick: "팩트폭격기",
      text: "부장이 “천천히 하지”랬다는 거 보면 답 나왔지",
    },
    { nick: "헬창2호", text: "3일이나 자료 안 올린 거면 부장 잘못 맞지" },
    {
      nick: "배고픈너구리",
      text: "근데 그 회사 어디임? 나도 이직하려는데 정보좀",
    },
    {
      nick: "맞춤법지키미",
      text: "글은 잘 썼는데 첫 줄에 틀린 거 하나 있음. 그거부터 고치셈",
    },
  ],
  steps: [
    {
      id: "gist",
      type: "요지",
      prompt: "글쓴이가 억울해하는 핵심은?",
      choices: [
        "부장이 본인은 안 지키면서 재촉하고 비꼬아서",
        "부장이 자료를 너무 빨리 내라고 해서",
        "동료들이 취합을 안 도와줘서",
      ],
      answerIndex: 0,
      difficulty: 2,
      timeLimitSec: 30,
    },
    {
      id: "irony",
      type: "반어",
      prompt: "부장의 “천천히 좀 하지”의 진짜 의미는?",
      choices: [
        "여유 있으니 편히 하라는 배려",
        "빨리 좀 하라는 비꼼",
        "일을 그만두라는 경고",
      ],
      answerIndex: 1,
      difficulty: 3,
      timeLimitSec: 30,
    },
    {
      id: "offtopic",
      type: "논점이탈",
      prompt: "이 논쟁(부장이 잘못했나)과 무관한 말을 한 유저는?",
      choices: ["헬창2호", "배고픈너구리", "팩트폭격기"],
      answerIndex: 1,
      difficulty: 2,
      timeLimitSec: 30,
    },
    {
      id: "spelling",
      type: "맞춤법",
      prompt: "원글에서 맞춤법이 틀린 부분은?",
      choices: [
        "어의없어서 → 어이없어서",
        "취합해서 → 취합해써",
        "올려주실까요 → 올려주실가요",
      ],
      answerIndex: 0,
      difficulty: 1,
      timeLimitSec: 30,
    },
  ],
};
