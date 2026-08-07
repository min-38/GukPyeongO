import Link from "next/link";

import { getPublicHistory } from "@/app/lib/history.server";

import Footer from "../Footer";
import PastRounds from "../PastRounds";

// 지난 회차 목록 (#114).
// #113 에서 홈 안에 넣었던 것을 따로 뺐다. 회차는 매주 쌓여 목록이 계속 길어지는데,
// 홈에 두면 마지막 밀기(CTA)를 그만큼 밀어낸다. 주소가 생기니 검색·공유로도 들어온다.
//
// 진행 중인 회차는 열지 않는다 — 등급 분포를 풀기 전에 보면 힌트가 된다(history.server.ts).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "지난 회차",
  description:
    "지금까지 열린 국평오 테스트 회차 기록. 회차마다 지문 수와 문항 수, 등급 분포를 볼 수 있습니다.",
  alternates: { canonical: "/rounds" },
};

export default async function RoundsPage() {
  const history = await getPublicHistory();
  const empty = !history || history.rounds.length === 0;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {empty ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-lg font-bold">아직 마감된 회차가 없어요</p>
            <p className="text-sm text-muted">
              첫 회차가 끝나면 기록이 여기에 쌓입니다.
            </p>
            <Link
              href="/"
              className="mt-4 rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground active:scale-95"
            >
              홈으로
            </Link>
          </div>
        ) : (
          <>
            <PastRounds history={history} />
            <div className="mt-4 flex justify-center">
              <Link
                href="/"
                className="rounded-2xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground active:scale-95"
              >
                홈으로
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
