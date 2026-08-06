"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { type DashboardData } from "@/app/lib/dashboard.server";
import { gradeTheme } from "@/app/lib/quiz";

import PageHeader from "./PageHeader";
import { CARD, FIGURE, LABEL } from "./ui";

// 운영 대시보드 (#91, #103). 이번 회차 지표와 회차별 추이, 문항 품질, 내보낼 준비 상태를 본다.
// 집계는 서버(dashboard.server.ts)가 끝내 놓는다 — 여기서는 그리기만 한다.

const AXIS = { fontSize: 11, fill: "var(--muted)" };

// 그래프 위에 커서를 올렸을 때 뜨는 말풍선. recharts 기본 스타일이 앱과 겉돌아 카드 모양을 맞춘다.
// 글자색을 안 정하면 Recharts 가 선 색을 그대로 글자에 쓴다 — 옅은 색 계열은 배경에 묻힌다.
// 값과 이름은 항상 본문색으로, 축 이름만 흐리게 둔다.
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--muted)", marginBottom: "0.25rem" },
  itemStyle: { color: "var(--foreground)", padding: 0 },
} as const;

// 막대 위에 커서를 올릴 때 깔리는 판. 기본값은 너무 진해 막대를 덮어버린다.
// 선/영역 차트에는 주지 않는다 — 거기 커서는 세로선이라 fill 을 넣으면 선이 사라진다.
const BAR_CURSOR = { fill: "var(--border)", fillOpacity: 0.35 } as const;

function rate(finished: number, started: number): string {
  if (started === 0) return "—";
  return `${Math.round((finished / started) * 100)}%`;
}

function duration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
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

function Panel({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${CARD} p-5`}>
      <h3 className="font-bold">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function DashboardTab({ data }: { data: DashboardData | null }) {
  if (!data) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        지표를 불러오지 못했습니다.
      </p>
    );
  }

  const {
    rounds,
    current,
    hours,
    visitors,
    types,
    typesTotal,
    typesAttempts,
    difficulty,
    hardSteps,
    readiness,
  } = data;

  const trend = rounds.map((r) => ({
    label: r.label,
    시작: r.started,
    완주: r.finished,
    완주율: r.started > 0 ? Math.round((r.finished / r.started) * 100) : 0,
    평균점수: r.avgScore ?? 0,
  }));

  const gradeData = (current?.gradeDist ?? []).map((count, i) => ({
    grade: `${i + 1}`,
    count,
    color: gradeTheme(i + 1).color,
  }));

  return (
    <section>
      <PageHeader
        title="대시보드"
        desc={
          current
            ? `${current.label} 회차 기준. 시작만 하고 나간 사람도 함께 셉니다.`
            : "아직 회차 기록이 없습니다."
        }
      />

      <div className="grid grid-cols-4 gap-3">
        <Stat label="시작" value={`${current?.started ?? 0}명`} />
        <Stat label="완주" value={`${current?.finished ?? 0}명`} />
        <Stat
          label="완주율"
          value={rate(current?.finished ?? 0, current?.started ?? 0)}
          hint="완주 ÷ 시작"
        />
        <Stat
          label="평균 점수"
          value={current?.avgScore == null ? "—" : `${current.avgScore}점`}
          hint="완주한 사람만"
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        <Stat
          label="평균 완주 소요"
          value={duration(current?.avgSeconds ?? null)}
          hint="시작부터 채점까지"
        />
        <Stat label="누적 응시자" value={`${visitors.visitors}명`} />
        <Stat
          label="다시 온 사람"
          value={
            visitors.visitors === 0
              ? "—"
              : `${Math.round((visitors.repeatVisitors / visitors.visitors) * 100)}%`
          }
          hint={`${visitors.repeatVisitors}명 · 두 회차 이상`}
        />
        <Stat
          label="편성 남은 회차"
          value={`${readiness.upcomingRounds}개`}
          hint={
            readiness.lastEndsAt
              ? `${new Date(readiness.lastEndsAt).toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}까지`
              : "편성 없음"
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Panel title="회차별 시작·완주" desc="최근 12회차">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={28} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="시작"
                unit="명"
                stroke="var(--brand)"
                fill="var(--brand)"
                fillOpacity={0.15}
              />
              <Area
                type="monotone"
                dataKey="완주"
                unit="명"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="완주율·평균 점수" desc="회차 만점은 늘 100점이라 나란히 볼 수 있다">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={28}
                domain={[0, 100]}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="완주율"
                unit="%"
                stroke="#10b981"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="평균점수"
                unit="점"
                stroke="var(--brand)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="이번 회차 등급 분포">
          {current && current.finished > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={gradeData}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="grade" tick={AXIS} tickLine={false} />
                <YAxis
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip {...TOOLTIP_STYLE} cursor={BAR_CURSOR} />
                <Bar dataKey="count" name="인원" unit="명" radius={[4, 4, 0, 0]}>
                  {gradeData.map((d) => (
                    <Cell key={d.grade} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              아직 완주한 사람이 없습니다.
            </p>
          )}
        </Panel>

        <Panel title="시간대별 시작" desc="KST 기준 누적">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hours}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="hour" tick={AXIS} tickLine={false} interval={2} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={28} />
              <Tooltip {...TOOLTIP_STYLE} cursor={BAR_CURSOR} />
              <Bar
                dataKey="started"
                name="시작"
                unit="명"
                fill="var(--brand)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="분류별 정답률"
          desc={`낮은 순 ${types.length}개${typesTotal > types.length ? ` · 전체 ${typesTotal}개 분류 중` : ""}`}
        >
          {types.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              아직 표본이 모자랍니다.
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(180, types.length * 26)}
            >
              <BarChart data={types} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={AXIS}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="key"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip {...TOOLTIP_STYLE} cursor={BAR_CURSOR} />
                <Bar
                  dataKey="rate"
                  name="정답률"
                  unit="%"
                  fill="var(--brand)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel
          title="난이도 눈금 점검"
          desc="난이도가 올라갈수록 정답률이 떨어져야 맞다"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={difficulty}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="key" tick={AXIS} tickLine={false} />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={28}
                domain={[0, 100]}
              />
              <Tooltip {...TOOLTIP_STYLE} cursor={BAR_CURSOR} />
              <Bar
                dataKey="rate"
                name="정답률"
                unit="%"
                fill="var(--brand)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat
          label="미처리 항의"
          value={`${readiness.openReports}건`}
          hint="항의·평가 탭에서 처리"
        />
        <Stat
          label="아직 안 쓴 게시 문제"
          value={`${readiness.unscheduledPublished}편`}
          hint="어느 회차에도 편성되지 않음"
        />
        <Stat
          label="문항 표본"
          value={`${typesAttempts}회`}
          hint="누적 시도 수"
        />
      </div>

      <div className="mt-6">
        <h3 className="font-bold">손볼 문항</h3>
        <p className="mt-0.5 text-xs text-muted">
          정답률 낮은 순. 5회 이상 풀린 문항만 봅니다. 별점과 항의를 나란히 두면
          어려운 문항과 잘못된 문항을 가를 수 있습니다.
        </p>
        {hardSteps.length === 0 ? (
          <p className="mt-2 text-sm text-muted">아직 표본이 모자랍니다.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-xs text-muted">
              <tr className="text-left">
                <th className="py-1 font-medium">문항</th>
                <th className="py-1 font-medium">분류</th>
                <th className="py-1 font-medium">난이도</th>
                <th className="py-1 font-medium">정답률</th>
                <th className="py-1 font-medium">시도</th>
                <th className="py-1 font-medium">별점</th>
                <th className="py-1 font-medium">항의</th>
              </tr>
            </thead>
            <tbody>
              {hardSteps.map((s) => (
                <tr key={s.stepId} className="border-t border-border align-top">
                  <td className="max-w-xs py-2">
                    <span className="block truncate font-medium">
                      {s.prompt}
                    </span>
                    <span className="text-xs text-muted">
                      {s.scenarioTitle}
                    </span>
                  </td>
                  <td className="py-2 text-xs">{s.type}</td>
                  <td className="py-2 tabular-nums">{s.difficulty}</td>
                  <td className="py-2 font-bold tabular-nums">
                    {s.correctRate}%
                  </td>
                  <td className="py-2 tabular-nums text-muted">{s.attempts}</td>
                  <td className="py-2 tabular-nums">
                    {s.avgStars === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <>
                        ★ {s.avgStars}
                        <span className="text-xs text-muted">
                          {" "}
                          ({s.ratingCount})
                        </span>
                      </>
                    )}
                  </td>
                  <td className="py-2 tabular-nums">
                    {s.openReports > 0 ? (
                      <span className="font-bold text-red-500">
                        {s.openReports}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
