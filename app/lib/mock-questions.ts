// #67 UI용 mock 시나리오.
// 한 시나리오 = 하나의 대화방. 그 안에서 문제가 여러 개 이어진다
// (답 → 상대 반응 → 다음 맥락 대사 → 다음 문제 … 끊김 없이 한 대화로).
// ERD의 questions.context / react_correct / react_wrong 구조를 그대로 따라,
// 연동 이슈에서 fetch로 교체할 때 형태를 바꾸지 않도록 한다.

import { type ChatScenario } from "./chat-scenario";

// 배점 매핑은 진행 로직과 함께 useScenario에 둔다.
export { POINTS_BY_DIFFICULTY } from "./useScenario";

export const MOCK_SCENARIO: ChatScenario = {
  id: "mock-company",
  roomTitle: "회사 메신저",
  speaker: "김부장",
  steps: [
    {
      id: "geumil",
      type: "어휘",
      context: [
        { speaker: "김부장", text: "오 김대리, 왤케 연락이 안 되나?" },
        { speaker: "김부장", text: "아무튼 금일 보고는 언제 진행할 건가?" },
      ],
      prompt: "뭐라고 답장하지…?",
      choices: [
        "네! 금요일까지 자료 만들어 보고드리겠습니다!",
        "네, 오늘 5시에 보고드리겠습니다.",
      ],
      answerIndex: 1,
      reactCorrect: "그래, 5시에 보지.",
      reactWrong: "금요일…? 김대리, 금일(今日)이 무슨 뜻인지 아는가?",
      reactTimeout: "김대리? 읽었으면 답을 해야 할 것 아닌가.",
      difficulty: 2,
      timeLimitSec: 20,
    },
    {
      id: "apjon",
      type: "문법",
      context: [{ speaker: "김부장", text: "아 그리고, 김 과장은 어디 갔나?" }],
      prompt: "부장님한테 뭐라고 하지…?",
      choices: ["김 과장님은 외근 나가셨습니다.", "김 과장은 외근 나갔습니다."],
      answerIndex: 0,
      reactCorrect: "알겠네. 들어오면 나 좀 보자고 하게.",
      reactWrong: "…자네가 김 과장 상사인가?",
      reactTimeout: "…자네 지금 내 메시지 씹은 건가?",
      difficulty: 3,
      timeLimitSec: 20,
    },
    {
      id: "igil",
      type: "어휘",
      context: [
        { speaker: "김부장", text: "그리고 어제 올린 결재, 반려했네." },
        { speaker: "김부장", text: "익일 오전까지 수정해서 다시 올리게." },
      ],
      prompt: "언제까지 하라는 거지…?",
      choices: [
        "네, 오늘 오전까지 수정하겠습니다.",
        "네, 내일 오전까지 수정하겠습니다.",
        "네, 이번 주 금요일까지 수정하겠습니다.",
      ],
      answerIndex: 1,
      reactCorrect: "그래, 내일 아침에 보지.",
      reactWrong: "익일(翌日)이 언제인지부터 찾아보게.",
      reactTimeout: "대답이 없네. 이런 식으로 일할 텐가?",
      difficulty: 1,
      timeLimitSec: 20,
    },
  ],
};
