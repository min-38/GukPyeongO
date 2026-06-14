import Link from "next/link";

export default function TestPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-base text-muted">테스트 화면은 준비 중입니다.</p>
      <Link href="/" className="text-sm font-medium text-brand active:opacity-80">
        처음으로
      </Link>
    </main>
  );
}
