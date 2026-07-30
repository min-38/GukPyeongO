// 어드민의 시작·마감 일시 입력을 KST로 못 박는다 (#100).
//
// <input type="datetime-local"> 값("2026-07-30T09:00")에는 시간대가 없다.
// new Date(value) 로 읽으면 브라우저 로컬 시간으로 해석되므로, 운영자 노트북이
// UTC로 맞춰져 있으면 회차 창이 통째로 아홉 시간 밀린다. 그래서 여기서 +09:00을 직접 붙인다.
// 한국은 서머타임이 없어 오프셋이 고정이다.

const KST = "+09:00";

// "2026-07-30T09:00" (KST로 읽는다) → ISO 문자열
export function kstLocalToIso(value: string): string {
  // 초가 붙어 오는 브라우저도 있다("...T09:00:00").
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}${KST}`).toISOString();
}

// ISO 문자열 → "2026-07-30T09:00" (KST 벽시계)
export function isoToKstLocal(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

// "일주일" 버튼 — 입력값에 날짜를 더한 같은 형식의 문자열.
export function plusDaysKstLocal(value: string, days: number): string {
  const iso = new Date(
    Date.parse(kstLocalToIso(value)) + days * 24 * 60 * 60 * 1000,
  ).toISOString();
  return isoToKstLocal(iso);
}
