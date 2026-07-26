// 시나리오를 불러오지 못했을 때의 화면 (#86).
// mock 폴백을 없앤 뒤로 DB가 유일한 출처라, 게시된 시나리오가 없으면 여기로 온다.
// (DB 미설정·시드 미적용·해당 slug 미게시)
export default function ScenarioUnavailable({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-lg font-bold">{label}를 준비 중입니다</p>
      <p className="text-sm text-muted">
        아직 게시된 문제가 없어요. 잠시 후 다시 시도해주세요.
      </p>
    </div>
  );
}
