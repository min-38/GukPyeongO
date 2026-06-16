# GukPyeongO

국평오 테스트는 로그인 없이 10문제 문해력 테스트를 풀고, 1등급부터 9등급까지의 결과를 공유하는 모바일 웹 MVP이다.

핵심 문장:

> 검색 없이 10문제. 당신의 문해력은 몇 등급?

## 개발 방향

- 모바일 우선 Next.js 웹서비스
- 일반 사용자는 비로그인
- 관리자는 별도 인증
- 문제 정답과 채점 기준은 서버에서만 처리
- 빠른 MVP 검증을 위해 기능은 이슈 단위로 작게 추가

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 연다.

## 검증

```bash
npm run lint
npm run build
```

## 문서

- [INTRODUCE.md](./INTRODUCE.md): 서비스 소개와 톤앤매너
- [CODEX.md](./CODEX.md): Codex 개발 지침
- [rules/branch.md](./rules/branch.md): 브랜치 규칙
- [rules/commit.md](./rules/commit.md): 커밋 규칙
- [rules/development.md](./rules/development.md): 개발 규칙
- [rules/security.md](./rules/security.md): 보안 규칙
- [rules/content.md](./rules/content.md): 콘텐츠 규칙
- [rules/ui.md](./rules/ui.md): UI 규칙
