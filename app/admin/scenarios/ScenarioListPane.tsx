"use client";

import { useEffect, useState } from "react";

import { type AdminScenario } from "@/app/lib/scenario-admin";

import ScenarioTab from "../ScenarioTab";

// 문제 목록 화면 (#99). 목록 데이터는 이 화면이 직접 불러온다 —
// 화면마다 주소가 따로 있으니 한 곳에서 다 받아 나눠주던 구조는 필요 없다.
export default function ScenarioListPane() {
  const [scenarios, setScenarios] = useState<AdminScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/scenarios")
      .then((r) => r.json() as Promise<{ scenarios?: AdminScenario[] }>)
      .then((d) => alive && setScenarios(d.scenarios ?? []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;

  return (
    <ScenarioTab
      scenarios={scenarios}
      onDeleted={(id) => setScenarios((prev) => prev.filter((s) => s.id !== id))}
    />
  );
}
