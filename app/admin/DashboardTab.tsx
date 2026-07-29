"use client";

import { useEffect, useState } from "react";

// 운영 대시보드 (#91). 오늘 지표와 최근 추이를 본다.

import PageHeader from "./PageHeader";
import { CARD, FIGURE, LABEL } from "./ui";

interface DayMetrics {
  date: string;
  started: number;
  finished: number;
  avgScore: number | null;
}

interface HardStep {
  title: string;
  prompt: string;
  attempts: number;
  correctRate: number;
}

interface DashboardData {
  today: DayMetrics & { gradeDist: { grade: number; count: number }[] };
  recent: DayMetrics[];
  hardSteps: HardStep[];
}

function rate(finished: number, started: number): string {
  if (started === 0) return "—";
  return `${Math.round((finished / started) * 100)}%`;
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={`${CARD} p-5`}>
      <p className={LABEL}>{label}</p>
      <p className={`mt-2 ${FIGURE}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function DashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/dashboard")
      .then((r) => r.json() as Promise<DashboardData>)
      .then((d) => {
        if (!active) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted">불러오는 중…</p>;
  }
  if (!data) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        지표를 불러오지 못했습니다.
      </p>
    );
  }

  const { today, recent, hardSteps } = data;

  return (
    <section>
      <PageHeader
        title="대시보드"
        desc={`${today.date} 기준. 시작만 하고 나간 사람도 함께 셉니다.`}
      />

      <div className="grid grid-cols-4 gap-3">
        <Stat label="시작" value={`${today.started}명`} />
        <Stat label="완주" value={`${today.finished}명`} />
        <Stat
          label="완주율"
          value={rate(today.finished, today.started)}
          hint="완주 ÷ 시작"
        />
        <Stat
          label="평균 점수"
          value={today.avgScore === null ? "—" : `${today.avgScore}점`}
          hint="완주한 사람만"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold">오늘 등급 분포</h3>
          {today.gradeDist.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              아직 완주한 사람이 없습니다.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {today.gradeDist.map(({ grade, count }) => (
                <li key={grade} className="flex items-center gap-2 text-sm">
                  <span className="w-12 shrink-0 font-bold">{grade}등급</span>
                  <span
                    className="h-4 rounded bg-brand/70"
                    style={{
                      width: `${(count / today.finished) * 100}%`,
                      minWidth: "0.5rem",
                    }}
                  />
                  <span className="text-muted">{count}명</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-bold">최근 추이</h3>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-muted">기록이 없습니다.</p>
          ) : (
            <table className="mt-2 w-full whitespace-nowrap text-sm">
              <thead className="text-xs text-muted">
                <tr className="text-left">
                  <th className="py-1 font-medium">날짜</th>
                  <th className="py-1 font-medium">시작</th>
                  <th className="py-1 font-medium">완주</th>
                  <th className="py-1 font-medium">완주율</th>
                  <th className="py-1 font-medium">평균</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((d) => (
                  <tr key={d.date} className="border-t border-border">
                    <td className="py-1.5">{d.date}</td>
                    <td>{d.started}</td>
                    <td>{d.finished}</td>
                    <td>{rate(d.finished, d.started)}</td>
                    <td>{d.avgScore === null ? "—" : `${d.avgScore}점`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-bold">많이 틀린 문항</h3>
        <p className="mt-0.5 text-xs text-muted">
          누적 기준입니다. 5회 이상 풀린 문항만 봅니다.
        </p>
        {hardSteps.length === 0 ? (
          <p className="mt-2 text-sm text-muted">아직 표본이 모자랍니다.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {hardSteps.map((s, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span className="w-12 shrink-0 font-bold">
                  {s.correctRate}%
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-muted">{s.title}</span> {s.prompt}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {s.attempts}회
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
