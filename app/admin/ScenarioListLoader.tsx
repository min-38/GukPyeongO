"use client";

import { useEffect, useState, type ReactNode } from "react";

import { type AdminScenario } from "@/app/lib/scenario-admin";

// 문제 목록이 있어야 그릴 수 있는 화면(유형·편성)이 쓰는 로더 (#99).
export default function ScenarioListLoader({
  children,
}: {
  children: (scenarios: AdminScenario[]) => ReactNode;
}) {
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
  return <>{children(scenarios)}</>;
}
