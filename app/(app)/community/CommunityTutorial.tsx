"use client";

import TutorialShell from "../play/TutorialShell";

// 커뮤니티 유형 시작 화면. 회사 메신저 튜토리얼과 같은 결이되 소재만 다르다.
export default function CommunityTutorial({
  boardName,
  onStart,
}: {
  boardName: string;
  onStart: () => void;
}) {
  return (
    <TutorialShell
      label={`${boardName} · 실시간 인기글`}
      title="이 글, 읽을 수 있어?"
      subtitle={
        <>
          두서없는 게시물과 댓글 사이에서
          <br />
          진짜 요지를 짚어내면 됩니다.
        </>
      }
      demo={
        <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <p className="text-xs text-muted">익명</p>
          <p className="mt-1 text-[15px] font-bold">회사 단톡 레전드ㅋㅋ …</p>
          <div className="mt-3 flex gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand">
              ㅇ
            </div>
            <div>
              <p className="text-xs text-muted">배고픈너구리</p>
              <p className="text-[15px]">근데 그 회사 어디임? 나도 이직하려는데</p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs font-medium text-muted">
            ↑ 이런 “딴소리 댓글”도 골라내야 해요
          </p>
        </div>
      }
      steps={[
        <>
          원글과 댓글을 <b className="font-medium text-foreground">읽고</b> 문제에 답해요. 스크롤해서 다 봐도 됩니다.
        </>,
        <>
          요지·반어·<b className="font-medium text-foreground">논점 이탈</b>·맞춤법을 가려내는 문제가 나와요.
        </>,
        <>
          문제가 뜨면 <b className="font-medium text-foreground">제한시간</b>이 시작돼요. 틀려도 계속 진행됩니다.
        </>,
      ]}
      startLabel="글 보러가기"
      onStart={onStart}
    />
  );
}
