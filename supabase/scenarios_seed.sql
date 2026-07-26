-- 국평오 테스트: 시나리오 초기 데이터 (#86)
-- 실행 전제: scenarios.sql → scenario_steps_extra.sql 을 먼저 실행해 테이블이 있어야 합니다.
--
-- 원래 app/lib/mock-*.ts 에서 생성하던 파일인데, mock을 지우면서(#86) 이 파일이 원본이 됐다.
-- 새 DB를 채울 때 이걸 실행한다. 내용 수정은 어드민에서 하고, 여기 손대지 않는다.
-- (여러 번 실행해도 안전 — slug / (scenario_id, step_key) 로 upsert 한다)

-- community
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  ('community', 'community', '국평오 갤러리', '{"id":"mock-community","boardName":"국평오 갤러리","post":{"author":"익명","title":"이거 내가 예민한거임??? 회사 단톡 레전드ㅋㅋ","body":["아 진짜 어의없어서 글쓴다","오늘 부장이 단톡에 “금일 오후까지 다들 취합해서 제출바람” 이래놓고","정작 자기는 사흘째 자료 안올림;;","근데 내가 “언제 올려주실까요?” 했더니","“김대리 성격 참 급하네~ 천천히 좀 하지” 이러는거 실화냐고","나만 이상한거야?? 판단좀"]},"comments":[{"nick":"ㅇㅇ","text":"금일이면 오늘인데 왜 사흘째 얘기가 나옴? 글을 정리해서 써라"},{"nick":"지나가던행인","text":"ㄴ 부장이 3일째 안 올렸단 거잖아 이걸 못 읽네ㅋㅋ","reply":true},{"nick":"팩트폭격기","text":"부장이 “천천히 하지”랬다는 거 보면 답 나왔지"},{"nick":"헬창2호","text":"3일이나 자료 안 올린 거면 부장 잘못 맞지"},{"nick":"배고픈너구리","text":"근데 그 회사 어디임? 나도 이직하려는데 정보좀"},{"nick":"맞춤법지키미","text":"글은 잘 썼는데 첫 줄에 틀린 거 하나 있음. 그거부터 고치셈"}]}'::jsonb, 'published', 1)
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
  ('community', 'gist', '요지', '글쓴이가 억울해하는 핵심은?', '["부장이 본인은 안 지키면서 재촉하고 비꼬아서","부장이 자료를 너무 빨리 내라고 해서","동료들이 취합을 안 도와줘서"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 1),
  ('community', 'irony', '반어', '부장의 “천천히 좀 하지”의 진짜 의미는?', '["여유 있으니 편히 하라는 배려","빨리 좀 하라는 비꼼","일을 그만두라는 경고"]'::jsonb, 1, 3, 30, null, '{}'::jsonb, 2),
  ('community', 'offtopic', '논점이탈', '이 논쟁(부장이 잘못했나)과 무관한 말을 한 유저는?', '["헬창2호","배고픈너구리","팩트폭격기"]'::jsonb, 1, 2, 30, null, '{}'::jsonb, 3),
  ('community', 'spelling', '맞춤법', '원글에서 맞춤법이 틀린 부분은?', '["어의없어서 → 어이없어서","취합해서 → 취합해써","올려주실까요 → 올려주실가요"]'::jsonb, 0, 1, 30, null, '{}'::jsonb, 4)
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;

-- notice
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  ('notice', 'doc', '공지사항', '{"id":"mock-notice","sourceLabel":"공지사항","doc":{"source":"국평오시청 청년정책과","title":"「청년 문해력 향상 지원사업」 참가자 모집 공고","body":["1. 신청기간: 공고일 ~ 금일 18:00까지 (기간 엄수)","2. 모집인원: 0명 (예산 소진으로 이번 회차 신규 선발 없음, 대기 등록만 접수)","3. 대상: 국평오시에 주민등록을 둔 만 19~34세 청년","4. 참가비: 무료 (단, 교재비 50,000원은 참가자 본인 부담)","5. 지원금: 수료 시 최대 300,000원 지급 (출석률·과제 평가에 따라 차등)","6. 오리엔테이션: 신청자 전원 필참 (미참석 시 자동 탈락)"]}}'::jsonb, 'published', 2)
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
  ('notice', 'deadline', '세부정보', '신청은 언제까지 해야 하나?', '["오늘 오후 6시까지","이번 주 금요일까지","다음 달 1일까지"]'::jsonb, 0, 1, 30, null, '{}'::jsonb, 1),
  ('notice', 'quota', '낚시조항', '“모집인원 0명”은 무슨 뜻인가?', '["이번 회차에는 신규로 뽑지 않는다","인원 제한 없이 누구나 받는다","0순위로 먼저 뽑는다"]'::jsonb, 0, 3, 30, null, '{}'::jsonb, 2),
  ('notice', 'cost', '낚시조항', '참가자가 실제로 내야 하는 돈은?', '["교재비 5만원","한 푼도 없음","지원금 30만원"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 3),
  ('notice', 'eligible', '조건판단', '옆 도시에 사는 만 30세는 지원할 수 있나?', '["안 된다 — 국평오시 주민등록이 있어야 한다","된다 — 나이 조건만 맞으면 된다","된다 — 대기 등록으로 가능하다"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 4)
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;

-- news
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  ('news', 'doc', '국평오일보', '{"id":"mock-news","sourceLabel":"국평오일보","doc":{"source":"국평오일보 · 사회부","title":"청년 절반 “국평오 뜬다”… 도시 소멸 초읽기","body":["국평오시가 지난달 시에 거주하는 만 19~39세 청년 1,000명을 대상으로 실시한 설문에서, 응답자의 52%가 “좋은 기회가 있으면 다른 도시로 이직할 의향이 있다”고 답했다. 이 수치는 지난해 같은 조사(47%)보다 5%포인트 오른 것이다.","다만 “1년 안에 실제로 전출할 구체적인 계획이 있다”고 밝힌 응답자는 8%에 그쳤다. 나머지 대부분은 “여건이 되면 고려해 보겠다”는 정도의 막연한 의향이었다.","이직을 고려하는 이유로는 ‘문화·여가 시설 부족’(38%)이 가장 많이 꼽혔고, ‘낮은 임금’(29%), ‘주거비 부담’(21%)이 뒤를 이었다. 전문가들은 임금이나 주거보다 여가 인프라가 청년의 체감 만족도를 더 크게 좌우한 것으로 분석했다.","시 관계자는 “의향과 실제 이탈은 다른 만큼, 청년들의 정주 여건이 아주 나쁘지는 않다는 뜻으로 보인다”고 말했다. 반면 한 청년단체는 “막연한 의향이라도 절반을 넘겼다는 건 경고 신호”라며 다른 해석을 내놓았다.","시는 이번 결과를 바탕으로 다음 달 청년 정책 토론회를 열고, 문화·여가 분야 예산 확대를 검토할 예정이다."]}}'::jsonb, 'published', 3)
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
  ('news', 'gist', '주제', '제목을 걷어내면, 이 기사가 실제로 전하는 내용은?', '["이직 “의향”은 절반이지만 실제 전출 계획은 8%뿐이다","청년 절반이 곧 도시를 떠난다","국평오시는 이미 소멸했다"]'::jsonb, 0, 3, 30, null, '{}'::jsonb, 1),
  ('news', 'headline', '제목', '이 기사에 가장 어울리는 제목은?', '["이직 ‘의향’ 절반 넘었지만… 실제 전출은 8%","청년 절반 국평오 탈출 러시","국평오 청년, 임금 불만에 짐 싼다"]'::jsonb, 0, 3, 30, null, '{}'::jsonb, 2),
  ('news', 'detail', '세부정보', '1년 안에 실제로 전출할 계획이 있다고 답한 비율은?', '["8%","52%","38%"]'::jsonb, 0, 1, 30, null, '{}'::jsonb, 3),
  ('news', 'fact-vs-guess', '사실판단', '“정주 여건이 나쁘지 않다”는 시 관계자의 말은?', '["확정된 사실이 아니라 관계자의 해석이다","공식 통계로 확정된 사실이다","청년단체도 동의한 결론이다"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 4),
  ('news', 'inference', '추론', '설문 결과가 시 정책에 주는 시사점으로 가장 타당한 것은?', '["임금 인상보다 문화·여가 확충이 청년 만족도에 더 효과적일 수 있다","청년이 곧 절반이나 떠나므로 즉시 전출을 막아야 한다","주거비가 가장 시급한 최우선 과제다"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 5)
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;

-- email
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  ('email', 'email', '메일', '{"id":"mock-email","sourceLabel":"메일","subject":"Re: Re: [요청] 상반기 사내 교육 교재 견적 회신","messages":[{"from":"김하늘","address":"ha.kim@nubium.co.kr","to":"박도윤","cc":"정세라","at":"3월 10일 (화) 09:12","body":["안녕하세요, 5월 사내 교육 교재 건입니다.","업체에서 부가세 별도 500만원으로 견적을 받았습니다.","우선 초안만 검토 부탁드리고, 최종 승인은 정세라 팀장님 확인 후 진행하겠습니다.","회신은 3월 14일까지 부탁드립니다."]},{"from":"박도윤","address":"dy.park@nubium.co.kr","to":"김하늘","cc":"정세라","at":"3월 10일 (화) 14:40","body":["확인했습니다. 금액대는 작년과 비슷해 보입니다.","다만 교재 부수는 제 담당이 아닙니다. 물류팀 최은우 대리가 관리하니 그쪽으로 문의 주세요."],"quote":["> 업체에서 부가세 별도 500만원으로 견적을 받았습니다.","> 우선 초안만 검토 부탁드리고, 최종 승인은 정세라 팀장님 확인 후 진행하겠습니다."]},{"from":"정세라","address":"sr.jung@nubium.co.kr","to":"김하늘, 박도윤","at":"3월 11일 (수) 08:55","body":["금액은 아직 검토 중입니다. 확정된 것 아니니 발주 넣지 마세요."],"quote":["> 다만 교재 부수는 제 담당이 아닙니다. 물류팀 최은우 대리가 관리하니"]},{"from":"김하늘","address":"ha.kim@nubium.co.kr","to":"박도윤","at":"3월 12일 (목) 17:20","body":["팀장님 승인해주셨다고 하니 500만원으로 확정하겠습니다.","3월 4일까지 최종본으로 발주 넣겠습니다.","부수는 박도윤 님께 다시 여쭙겠습니다."],"quote":["> 금액은 아직 검토 중입니다. 확정된 것 아니니 발주 넣지 마세요."]}]}'::jsonb, 'published', 4)
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
  ('email', 'assign', '귀속', '교재 부수를 실제로 관리하는 사람은?', '["물류팀 최은우 대리","박도윤","정세라 팀장"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 1),
  ('email', 'deadline', '세부정보', '김하늘 님이 처음에 요청한 회신 기한은?', '["3월 14일","3월 4일","3월 12일"]'::jsonb, 0, 1, 30, null, '{}'::jsonb, 2),
  ('email', 'decision', '결정', '스레드 전체를 보면, 금액은 지금 어떤 상태인가?', '["아직 검토 중이며 확정되지 않았다","팀장 승인으로 500만원에 확정됐다","금액이 너무 높아 부결됐다"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 3),
  ('email', 'recipients', '수신범위', '마지막 메일의 내용을 정세라 팀장은 알 수 있는가?', '["참조에서 빠져 있어 받지 못한다","참조로 들어가 있어 받는다","받는사람으로 지정돼 있어 받는다"]'::jsonb, 0, 3, 40, null, '{}'::jsonb, 4),
  ('email', 'misquote', '오기재', '마지막 메일이 금액 조건을 옮기면서 빠뜨린 것은?', '["‘부가세 별도’라는 조건을 빼고 500만원으로 확정했다","500만원을 550만원으로 잘못 적었다","금액을 아예 적지 않았다"]'::jsonb, 0, 3, 40, null, '{}'::jsonb, 5)
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;

-- email-reply
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  ('email-reply', 'email', '메일', '{"id":"mock-email-reply","sourceLabel":"메일","subject":"[안내] 본사 사옥 이전 관련 협조 요청","layout":"toggle","messages":[{"from":"이지호","address":"jh.lee@nubium.co.kr","to":"전직원","at":"3월 3일 (화) 10:05","body":["총무팀입니다. 본사 사옥 이전 일정 안내드립니다.","3월 25일(화)부터 근무지가 강남 사옥 7층에서 성수 사옥 4층으로 변경됩니다. 이전 당일은 전 직원 재택근무입니다.","3월 24일(월) 18시까지 개인 물품을 지급된 이전 박스에 담아 자리에 두시면 됩니다.","박스는 1인 2개까지 무상 제공됩니다. 추가가 필요하면 3월 18일까지 총무팀으로 신청해주세요. 추가분은 부서 예산에서 차감됩니다.","모니터·키보드 등 회사 비품은 담지 마세요. 별도 업체가 회수합니다. 단, 노트북과 충전기는 반드시 개인이 직접 소지하고 이동해주세요.","성수 사옥에는 지하 주차장이 없습니다. 차량 통근자는 인근 공영주차장을 이용하셔야 하며 주차비는 지원되지 않습니다.","문의는 총무팀 이지호(내선 4021)."]},{"from":"강민서","address":"ms.kang@nubium.co.kr","to":"개발2팀","at":"3월 5일 (목) 09:30","body":["팀원 여러분, 총무팀 공지 정리해서 공유합니다.","3월 25일 이전이고, 당일은 성수 사옥으로 정상 출근하시면 됩니다.","물품은 3월 25일 18시까지 박스에 담아두세요. 노트북도 같이 넣어두시면 업체가 옮겨줍니다.","박스는 인당 2개 무상이니 부족하면 말씀 주세요.","차 가지고 오시는 분은 지하 주차장 이용하시면 됩니다."]}]}'::jsonb, 'published', 5)
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
  ('email-reply', 'boxdeadline', '세부정보', '개인 물품을 박스에 담아 두어야 하는 시점은?', '["3월 24일 18시","3월 25일 18시","3월 18일 18시"]'::jsonb, 0, 1, 30, 1, '{}'::jsonb, 1),
  ('email-reply', 'boxextra', '조건판단', '박스를 3개 쓰려면 어떻게 해야 하나?', '["3월 18일까지 총무팀에 신청하고, 추가분은 부서 예산에서 차감된다","이전 당일 총무팀에서 무상으로 더 받으면 된다","1인 2개 제한이라 추가로 받을 수 없다"]'::jsonb, 0, 2, 30, 1, '{}'::jsonb, 2),
  ('email-reply', 'laptop', '세부정보', '노트북과 충전기는 어떻게 하라고 했나?', '["개인이 직접 소지하고 이동한다","박스에 담아 자리에 둔다","회사 비품이므로 업체가 회수한다"]'::jsonb, 0, 2, 30, 1, '{}'::jsonb, 3),
  ('email-reply', 'misquote-work', '오기재', '답장이 원문과 다르게 안내한 것은?', '["이전 당일 근무 형태 — 원문은 재택근무다","이전 날짜 — 원문은 3월 26일이다","박스 무상 제공 수량 — 원문은 1개다"]'::jsonb, 0, 3, 40, 2, '{}'::jsonb, 4),
  ('email-reply', 'misquote-laptop', '오기재', '답장의 노트북 안내에서 잘못된 부분은?', '["박스에 담으라고 했다 — 원문은 개인이 직접 소지하라고 했다","반납하라고 했다 — 원문은 그대로 쓰라고 했다","충전기만 챙기라고 했다 — 원문은 둘 다 챙기라고 했다"]'::jsonb, 0, 3, 40, 2, '{}'::jsonb, 5)
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;

-- story
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  ('story', 'story', '이야기', '{"id":"mock-story","sourceLabel":"이야기","source":"명절 전날","title":"미리 데운 방","readSec":100,"body":["아버지는 내가 오는 걸 반가워하지 않는다. 스무 해째 그렇다.","버스에서 내려 십 분을 걸었다. 대문은 열려 있었다. 마당에 들어서니 개가 짖다 말았다.","아버지는 평상에 앉아 라디오를 듣고 있었다. 왔냐, 하고는 다시 라디오 쪽으로 고개를 돌렸다. 그게 다였다.","나는 신발을 벗었다. 툇마루에 먼지가 없었다. 아버지는 원래 마루를 잘 닦지 않는다.","방문을 여니 아랫목이 뜨거웠다. 아침부터 불을 땐 모양이었다.","이불은 새로 빨아 각을 잡아 개어 두었고, 머리맡에 수건 두 장이 놓여 있었다. 하나는 아직 포장을 뜯지 않은 것이었다.","부엌에 들어가 보니 도라지무침이 있었다. 나는 도라지를 좋아하고, 형은 손도 대지 않는다.","형이 온다니까 저러는 거겠지. 나는 가방을 내려놓았다.","상은 이미 차려져 있었다. 수저는 두 벌이었다. 아버지 것과 하나 더.","밤에 물을 마시러 나왔다가 아버지를 봤다. 아궁이 앞에 쪼그려 앉아 장작을 밀어 넣고 있었다.","이 시간에 왜 저러나 싶었다. 형 방까지 데우려는가 보다, 하고 나는 다시 누웠다.","아침에 일어나니 등이 뜨끈했다. 건넌방 문을 열어 보았다. 그쪽은 냉골이었다.","아버지는 벌써 나가고 없었다. 부엌 벽에 걸린 달력의 9월 칸에 동그라미가 하나 쳐져 있었다.","어제 날짜였다."]}'::jsonb, 'published', 6)
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
  ('story', 'arrive', '세부정보', '화자가 마당에 들어섰을 때 아버지는 무엇을 하고 있었나?', '["평상에 앉아 라디오를 듣고 있었다","아궁이에 장작을 넣고 있었다","툇마루를 닦고 있었다"]'::jsonb, 0, 1, 25, null, '{}'::jsonb, 1),
  ('story', 'warm', '세부정보', '아버지가 아침부터 해 둔 일은?', '["방에 불을 땠다","장을 보러 갔다","달력을 새로 걸었다"]'::jsonb, 0, 1, 25, null, '{}'::jsonb, 2),
  ('story', 'compare', '인물 비교', '도라지무침에 대해 본문이 확정하는 것은?', '["화자는 좋아하고, 형은 먹지 않는다","형이 좋아해서 아버지가 자주 만든다","둘 다 좋아해서 명절마다 올라온다"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 3),
  ('story', 'grounds', '근거 판단', '“형이 온다니까 저러는 거겠지”를 본문은 어떻게 반박하나?', '["상에 놓인 수저가 두 벌뿐이다","아버지가 라디오 쪽으로 고개를 돌렸다","개가 짖다 말았다"]'::jsonb, 0, 3, 40, null, '{}'::jsonb, 4),
  ('story', 'omitted', '생략된 정보', '달력에 동그라미가 쳐진 날은 무슨 날인가?', '["화자가 집에 오기로 한 날","형이 집에 오기로 한 날","아버지의 생일"]'::jsonb, 0, 2, 30, null, '{}'::jsonb, 5),
  ('story', 'narrator', '서술자 신뢰성', '화자의 첫 문장을 가장 강하게 반박하는 본문 속 사실은?', '["밤에 더 땐 아궁이의 열이 화자 방에만 닿았다","아버지가 아침에 먼저 나가고 없었다","대문이 열려 있었다"]'::jsonb, 0, 3, 40, null, '{}'::jsonb, 6)
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;

-- chat
insert into public.scenarios (slug, kind, source_label, payload, status, sort_order) values
  ('chat', 'chat', '회사 메신저', '{"id":"mock-company","roomTitle":"회사 메신저","speaker":"김부장","sourceLabel":"회사 메신저"}'::jsonb, 'published', 7)
on conflict (slug) do update set
  kind = excluded.kind,
  source_label = excluded.source_label,
  payload = excluded.payload,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.scenario_steps
  (scenario_id, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
-- values 리터럴은 타입 추론이 text로 붙으므로 컬럼 타입을 명시한다.
select s.id, v.step_key, v.type, v.prompt, v.choices::jsonb, v.answer_index::int,
       v.difficulty::int, v.time_limit_sec::int, v.show_up_to::int, v.extra::jsonb, v.sort_order::int
from (values
  ('chat', 'geumil', '어휘', '뭐라고 답장하지…?', '["네! 금요일까지 자료 만들어 보고드리겠습니다!","네, 오늘 5시에 보고드리겠습니다."]'::jsonb, 1, 2, 20, null, '{"context":[{"speaker":"김부장","text":"오 김대리, 왤케 연락이 안 되나?"},{"speaker":"김부장","text":"아무튼 금일 보고는 언제 진행할 건가?"}],"reactCorrect":"그래, 5시에 보지.","reactWrong":"금요일…? 김대리, 금일(今日)이 무슨 뜻인지 아는가?","reactTimeout":"김대리? 읽었으면 답을 해야 할 것 아닌가."}'::jsonb, 1),
  ('chat', 'apjon', '문법', '부장님한테 뭐라고 하지…?', '["김 과장님은 외근 나가셨습니다.","김 과장은 외근 나갔습니다."]'::jsonb, 0, 3, 20, null, '{"context":[{"speaker":"김부장","text":"아 그리고, 김 과장은 어디 갔나?"}],"reactCorrect":"알겠네. 들어오면 나 좀 보자고 하게.","reactWrong":"…자네가 김 과장 상사인가?","reactTimeout":"…자네 지금 내 메시지 씹은 건가?"}'::jsonb, 2),
  ('chat', 'igil', '어휘', '언제까지 하라는 거지…?', '["네, 오늘 오전까지 수정하겠습니다.","네, 내일 오전까지 수정하겠습니다.","네, 이번 주 금요일까지 수정하겠습니다."]'::jsonb, 1, 1, 20, null, '{"context":[{"speaker":"김부장","text":"그리고 어제 올린 결재, 반려했네."},{"speaker":"김부장","text":"익일 오전까지 수정해서 다시 올리게."}],"reactCorrect":"그래, 내일 아침에 보지.","reactWrong":"익일(翌日)이 언제인지부터 찾아보게.","reactTimeout":"대답이 없네. 이런 식으로 일할 텐가?"}'::jsonb, 3)
) as v(slug, step_key, type, prompt, choices, answer_index, difficulty, time_limit_sec, show_up_to, extra, sort_order)
join public.scenarios s on s.slug = v.slug
on conflict (scenario_id, step_key) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  choices = excluded.choices,
  answer_index = excluded.answer_index,
  difficulty = excluded.difficulty,
  time_limit_sec = excluded.time_limit_sec,
  show_up_to = excluded.show_up_to,
  extra = excluded.extra,
  sort_order = excluded.sort_order;
