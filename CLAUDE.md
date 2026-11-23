# Toolfit AI — Agent 운영 가이드

Claude가 Toolfit 서비스를 자율적으로 운영하기 위한 컨텍스트 문서입니다.
이 파일을 읽은 Claude는 코드 수정, 데이터 수집, 배포, 분석을 스스로 수행합니다.

---

## 서비스 개요

**Toolfit** (`toolfit.io`)은 팀 구성과 예산을 입력하면 최적의 SaaS 툴 스택을 AI가 추천해주는 서비스입니다.

- **프론트엔드**: React + Vite + Ant Design → Cloudflare Pages 배포
- **백엔드**: Cloudflare Worker → Claude Haiku API 호출 → JSON 추천 반환
- **분석**: GA4 (이벤트 기반 퍼널 추적)
- **목표**: 무료 사용자 확보 → Pro 구독 + 어필리에이트 수익화

---

## 프로젝트 구조

```
toolfit/
├── CLAUDE.md                    ← 지금 이 파일
├── toolfit_app/                 ← React 프론트엔드
│   ├── src/
│   │   ├── App.jsx              ← 라우터 (/, /tools, /cloud, /llm, /recommend)
│   │   ├── ToolfitMain.jsx      ← Step 1: 팀 구성 입력
│   │   ├── ToolSelect.jsx       ← Step 2: 현재 툴 선택 + 이메일
│   │   ├── CloudSelect.jsx      ← Step 3: 클라우드 선택
│   │   ├── LLMSelect.jsx        ← Step 4: AI 서비스 선택
│   │   ├── ToolfitResult.jsx    ← 추천 결과 (Worker API 호출)
│   │   └── lib/analytics.js     ← GA4 이벤트 래퍼
│   ├── .env.example             ← 환경변수 예시
│   └── vite.config.js
├── worker/
│   ├── index.js                 ← Cloudflare Worker (Claude API 연동)
│   └── wrangler.toml            ← Worker 설정
└── docs/
    ├── WORKER_DEPLOY.md         ← Worker 배포 가이드
    ├── DEPLOY.md                ← Pages 배포 가이드
    └── CTR_DASHBOARD.md         ← GA4 이벤트 스펙
```

---

## 핵심 데이터 흐름

```
사용자 입력 (4단계 퀴즈)
    ↓
ToolfitResult.jsx
    → POST /recommend to Cloudflare Worker
        → Worker: buildPrompt(팀정보)
        → Claude Haiku API 호출
        → JSON 파싱 후 반환
    ← { greeting, insight, combos, categories, tip }
    → 동적 UI 렌더링
```

---

## 환경변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `VITE_GA_MEASUREMENT_ID` | toolfit_app/.env.local | GA4 측정 ID |
| `VITE_WORKER_URL` | toolfit_app/.env.local | Cloudflare Worker URL |
| `ANTHROPIC_API_KEY` | wrangler secret | Claude API 키 (Worker에서 사용) |

---

## 코드 수정 규칙

1. **프론트엔드 수정** → `toolfit_app/src/` 파일 편집 → `npm run build` → git push
2. **Worker 수정** → `worker/index.js` 편집 → `wrangler deploy`
3. **스타일**: Ant Design 컴포넌트 우선, inline style은 최소화
4. **언어**: UI 텍스트는 한국어, 코드 주석은 한국어 허용
5. **GA4 이벤트**: 새 UI 요소 추가 시 `trackEvent(Events.XXX, {...})` 반드시 추가

---

## GA4 이벤트 목록

```js
QUIZ_STARTED, QUIZ_STEP_COMPLETED, QUIZ_COMPLETED,
RECOMMENDATION_VIEWED, RECOMMENDATION_CLICKED,
SIMULATION_CLICKED, PRO_UPGRADE_CLICKED,
CATEGORY_CARD_CLICKED, TOOL_SELECTED, TOOL_DESELECTED, EMAIL_ENTERED
```

---

## 수익화 모델 (구현 예정)

1. **어필리에이트**: Notion, Slack, Linear 파트너 링크 → 가입 커미션
2. **Pro 플랜**: PDF 리포트, 상세 분석, 히스토리 ($9~29/월)
3. **B2B**: 회사 전체 스택 감사 리포트 ($200/건)

---

## 배포 명령어

```bash
# 프론트엔드 로컬 실행
cd toolfit_app && npm run dev

# 프론트엔드 빌드
cd toolfit_app && npm run build

# Worker 로컬 실행
cd worker && wrangler dev

# Worker 배포
cd worker && wrangler deploy

# git push (Cloudflare Pages 자동 배포)
git add . && git commit -m "feat: ..." && git push origin main
```

---

## Claude가 자율 운영할 때 주의사항

- **API 비용**: Claude Haiku 사용 중 ($0.00025/요청). Sonnet 전환 시 10배 비용 증가 — 반드시 확인
- **CORS**: Worker의 `Access-Control-Allow-Origin`은 운영 시 `https://toolfit.io`로 제한할 것
- **캐싱**: KV 캐시 TTL은 24시간. 툴 가격 변경 시 캐시 무효화 필요
- **에러 처리**: Worker 500 에러 시 프론트에서 재시도 버튼 표시 (이미 구현됨)
- **git**: 자동 push 전 반드시 변경사항 확인. main 브랜치에 직접 push
