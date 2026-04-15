# Contributing to docwise

docwise에 기여해 주셔서 감사합니다! 아래 가이드를 참고해 주세요.

## Getting Started

1. 이 저장소를 Fork합니다.
2. Feature branch를 생성합니다: `git checkout -b feat/my-feature`
3. 변경사항을 커밋합니다: `git commit -m "feat: add my feature"`
4. Branch를 Push합니다: `git push origin feat/my-feature`
5. Pull Request를 생성합니다.

## Development Setup

```bash
cd app
npm install
npm run dev
```

## Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.

| Prefix | 용도 |
|--------|------|
| `feat:` | 새로운 기능 |
| `fix:` | 버그 수정 |
| `docs:` | 문서 변경 |
| `style:` | 코드 포맷팅 (기능 변경 없음) |
| `refactor:` | 리팩토링 |
| `test:` | 테스트 추가/수정 |
| `chore:` | 빌드, CI 등 기타 변경 |

## Pull Request Guidelines

- PR 제목은 Conventional Commits 형식을 따릅니다.
- 변경사항에 대한 설명을 포함합니다.
- 관련 Issue가 있다면 연결합니다.
- TypeScript 타입 체크를 통과해야 합니다: `npx tsc --noEmit`
- 린트를 통과해야 합니다: `npm run lint`

## Code Style

- TypeScript strict mode를 사용합니다.
- 컴포넌트는 함수형 컴포넌트로 작성합니다.
- Tailwind CSS를 사용하여 스타일링합니다.

## Reporting Issues

버그 리포트나 기능 요청은 [Issues](https://github.com/asderio-coway/docwise/issues)를 통해 제출해 주세요.

## License

기여하신 코드는 [MIT License](LICENSE) 하에 배포됩니다.
