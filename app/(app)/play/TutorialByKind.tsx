"use client";

import CommunityTutorial from "../community/CommunityTutorial";
import EmailTutorial from "../email/EmailTutorial";
import NewsTutorial from "../news/NewsTutorial";
import NoticeTutorial from "../notice/NoticeTutorial";
import StoryTutorial from "../story/StoryTutorial";
import { type ScenarioKind } from "@/app/lib/scenario-admin";

import ChatTutorial from "./Tutorial";

// 유형에 맞는 시작 화면을 고른다 (#93).
// 오늘의 문제는 유형이 섞여 나오므로(#87) 문제마다 그 유형의 읽는 법을 먼저 보여준다.
// 유형 페이지(/notice 등)는 각자 자기 튜토리얼을 직접 쓴다 — 여기는 섞여 나오는 쪽 전용.
export default function TutorialByKind({
  kind,
  scenario,
  onStart,
}: {
  kind: ScenarioKind;
  // 방 제목·게시판 이름처럼 튜토리얼 문구에 들어가는 값만 꺼내 쓴다.
  scenario: Record<string, unknown>;
  onStart: () => void;
}) {
  switch (kind) {
    case "notice":
      return <NoticeTutorial onStart={onStart} />;
    case "news":
      return <NewsTutorial onStart={onStart} />;
    case "community":
      return (
        <CommunityTutorial
          boardName={(scenario.boardName as string) ?? "커뮤니티"}
          onStart={onStart}
        />
      );
    case "chat":
      return (
        <ChatTutorial
          roomTitle={(scenario.roomTitle as string) ?? "회사 메신저"}
          onStart={onStart}
        />
      );
    case "email":
      return <EmailTutorial onStart={onStart} />;
    case "story":
      return <StoryTutorial onStart={onStart} />;
    default:
      // 튜토리얼이 없는 유형은 그냥 문제로 넘어간다.
      onStart();
      return null;
  }
}
