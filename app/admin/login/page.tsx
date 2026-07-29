"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // 어드민의 첫 화면. 안쪽 편성실과 같은 잉크색 판을 써서 여기서부터 운영 화면임을 알린다(#99).
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm rounded-[2rem] bg-foreground p-8 text-surface">
        <p className="font-display text-2xl leading-none">편성실</p>
        <p className="mt-1 text-[11px] tracking-[0.14em] text-surface/50">
          국평오 운영
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <label className="text-[11px] font-bold tracking-[0.14em] text-surface/50">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="mt-2 h-12 w-full rounded-2xl border border-surface/15 bg-surface/10 px-4 text-base font-medium text-surface outline-none placeholder:text-surface/30 focus:border-surface/40"
            />
          </label>
          {/* 무엇이 잘못됐는지만 말한다. 사과하지 않는다. */}
          {error && (
            <p className="text-sm font-medium text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || password.length === 0}
            className="mt-1 h-12 rounded-2xl bg-surface text-base font-bold text-foreground transition-opacity active:opacity-80 disabled:opacity-30"
          >
            {loading ? "확인 중…" : "들어가기"}
          </button>
        </form>
      </div>
    </main>
  );
}
