# Toolfit AI Agent — MCP 실행 프롬프트 모음

이 파일의 프롬프트를 Claude Cowork(또는 Claude Code)에 그대로 붙여넣으면
Claude가 해당 태스크를 자율적으로 실행합니다.

각 프롬프트는 독립적으로 실행 가능합니다.

---

## 📋 프롬프트 목록

| # | 프롬프트 | 실행 주기 | 소요 시간 |
|---|---------|----------|---------|
| 1 | 툴 데이터 최신화 | 주 1회 | ~10분 |
| 2 | Worker 프롬프트 품질 개선 | 월 1회 | ~15분 |
| 3 | 서비스 퍼널 분석 & 개선 | 주 1회 | ~20분 |
| 4 | 어필리에이트 링크 추가 | 1회성 | ~10분 |
| 5 | Pro 플랜 게이트 추가 | 1회성 | ~30분 |
| 6 | 전체 서비스 헬스체크 | 일 1회 | ~5분 |

---

## 1. 툴 데이터 최신화 프롬프트

> **목적**: Worker의 추천 프롬프트에 최신 SaaS 가격·기능을 반영
> **실행 주기**: 주 1회 (월요일 권장)

```
/Users/lee/projects/toolfit/toolfit 폴더의 CLAUDE.md를 읽어서 프로젝트 컨텍스트를 파악해.

그 다음 아래 작업을 순서대로 실행해:

1. 웹 검색으로 아래 SaaS 툴들의 2025년 현재 가격을 조사해:
   - Notion (Free / Plus / Business)
   - Slack (Free / Pro / Business+)
   - Linear (Free / Standard / Plus)
   - Figma (Starter / Professional / Organization)
   - GitHub (Free / Team / Enterprise)
   - Asana (Personal / Starter / Advanced)
   - Discord (Free / Nitro)
   - Trello (Free / Standard / Premium)
   - Vercel (Hobby / Pro / Enterprise)
   - Loom (Starter / Business / Enterprise)

2. 현재 worker/index.js의 buildPrompt() 함수를 읽어.

3. buildPrompt() 안에 각 툴의 최신 가격 정보를 참고 데이터로 추가해.
   아래 형식으로 프롬프트 상단에 삽입:
   
   ## 2025년 주요 SaaS 가격 참고 (인당/월, USD)
   - Notion Plus: $10, Business: $18
   - Slack Pro: $7.25, Business+: $12.50
   - (조사한 내용으로 채우기)

4. worker/index.js 파일을 수정 저장해.

5. 변경된 내용을 git diff로 확인하고 요약해줘.

6. git commit -m "data: SaaS 가격 데이터 최신화 (YYYY-MM-DD)" 실행해.

완료 후 업데이트된 가격 목록과 주요 변경사항을 표로 정리해서 알려줘.
```

---

## 2. Worker 프롬프트 품질 개선 프롬프트

> **목적**: Claude 추천 품질 테스트 & 프롬프트 개선
> **실행 주기**: 월 1회

```
/Users/lee/projects/toolfit/toolfit 폴더의 CLAUDE.md를 먼저 읽어.

다음 작업을 실행해:

1. worker/index.js의 buildPrompt() 함수를 읽어.

2. 아래 3가지 팀 시나리오로 Worker를 테스트해.
   Worker가 로컬에서 실행 중이 아니면, buildPrompt() 함수의 출력(프롬프트 텍스트)만 생성해서 평가해도 돼:
   
   시나리오 A: { teamName:"스타트업A", roles:{dev:3,design:1,marketing:1,ops:0}, selectedTools:["slack"], monthlyBudget:"$200" }
   시나리오 B: { teamName:"에이전시B", roles:{dev:0,design:5,marketing:2,ops:1}, selectedTools:["figma","notion"], monthlyBudget:"$500" }
   시나리오 C: { teamName:"솔로C", roles:{dev:1,design:0,marketing:0,ops:0}, selectedTools:[], monthlyBudget:"$50" }

3. 각 시나리오의 buildPrompt() 출력을 분석해서 개선점을 찾아:
   - 팀 특성을 충분히 반영하는가?
   - 현재 사용 툴과 중복 추천하지 않는가?
   - 예산 제한을 실제로 반영하는가?
   - JSON 형식 지시가 명확한가?

4. 개선된 buildPrompt() 함수를 작성해서 worker/index.js를 업데이트해.

5. git commit -m "improve: Worker 추천 프롬프트 품질 개선" 실행해.

개선 전/후 프롬프트의 주요 차이점을 설명해줘.
```

---

## 3. 서비스 퍼널 분석 & 개선 프롬프트

> **목적**: 코드 기반으로 이탈 지점 파악 후 UX 개선
> **실행 주기**: 주 1회

```
/Users/lee/projects/toolfit/toolfit 폴더의 CLAUDE.md를 읽어.

다음 작업을 실행해:

1. toolfit_app/src/ 아래 모든 Step 파일을 읽어:
   - ToolfitMain.jsx (Step 1)
   - ToolSelect.jsx (Step 2)
   - CloudSelect.jsx (Step 3)
   - LLMSelect.jsx (Step 4)
   - ToolfitResult.jsx (결과)

2. 각 단계를 UX 관점에서 분석해:
   - 이탈 가능성이 높은 요소가 있는가?
   - 입력 필드가 너무 많거나 복잡한가?
   - 진행 상황 표시가 명확한가?
   - 모바일에서 불편한 요소가 있는가?
   - CTA(다음 버튼) 위치와 강조가 적절한가?

3. 분석 결과를 바탕으로 우선순위 높은 개선 3가지를 선택해서 실제로 코드 수정해.
   수정 시:
   - 기존 기능을 깨지 않도록 주의
   - GA4 이벤트는 유지
   - 스타일은 기존 패턴 유지 (Ant Design + inline style)

4. 수정된 파일들을 git add하고 commit:
   git commit -m "ux: 퍼널 이탈률 개선 - [변경 내용 요약]"

분석 결과 표와 수정 내용 요약을 알려줘.
```

---

## 4. 어필리에이트 링크 추가 프롬프트

> **목적**: 추천 결과에 어필리에이트 링크 삽입해 수익화 시작
> **실행 주기**: 1회성 (수익화 시작 시점)

```
/Users/lee/projects/toolfit/toolfit 폴더의 CLAUDE.md를 읽어.

다음 작업을 실행해:

1. 웹 검색으로 아래 툴들의 어필리에이트/파트너 프로그램을 조사해:
   - Notion: 파트너 프로그램 URL과 커미션율
   - Slack: 리셀러/파트너 프로그램
   - Linear: 파트너 프로그램
   - Figma: 공식 파트너 또는 대안
   각 툴의 가입 URL, 커미션 조건을 정리해.

2. toolfit_app/src/ToolfitResult.jsx를 읽어.

3. ComboCard 컴포넌트의 각 툴 항목에 어필리에이트 링크 버튼을 추가해:
   - "무료로 시작하기 →" 버튼 (작고 눈에 띄지 않게)
   - 클릭 시 어필리에이트 링크로 새 탭 오픈
   - GA4 이벤트 추가: trackEvent('affiliate_click', { tool_name, combo_type })
   
   어필리에이트 URL이 없는 툴은 공식 홈페이지 링크 사용.

4. toolfit_app/src/lib/analytics.js의 Events 객체에 AFFILIATE_CLICKED 추가.

5. git commit -m "feat: 어필리에이트 링크 추가 (수익화 v1)"

추가된 어필리에이트 링크 목록과 예상 수익 계산식을 알려줘.
```

---

## 5. Pro 플랜 게이트 추가 프롬프트

> **목적**: 추천 결과 일부를 Pro 전용으로 만들어 업그레이드 유도
> **실행 주기**: 1회성 (Pro 플랜 출시 시점)

```
/Users/lee/projects/toolfit/toolfit 폴더의 CLAUDE.md를 읽어.

다음 작업을 실행해:

1. toolfit_app/src/ToolfitResult.jsx를 읽어.

2. 아래 기능을 "Pro 전용"으로 게이팅해:
   - "팁" 섹션 (recommendation.tip): 첫 50자만 보여주고 나머지는 블러 처리
   - 두 번째 콤보 카드(cost 조합): 카드 전체를 블러 + "Pro에서 보기" 오버레이

3. Pro 게이트 UI 구현:
   - 블러: CSS filter: blur(4px), pointer-events: none
   - 오버레이: 반투명 배경 + "🔒 Pro 플랜에서 확인하세요" 텍스트 + 업그레이드 버튼
   - 업그레이드 버튼 클릭: trackEvent(Events.PRO_UPGRADE_CLICKED, { source: 'result_gate' })
   - 버튼 링크: /pro (나중에 결제 페이지 연결)

4. 상태 관리:
   - isPro 변수를 추가 (지금은 항상 false — 실제 결제 연동 전 테스트용)
   - isPro가 true면 블러 해제

5. git commit -m "feat: Pro 플랜 게이트 UI 추가 (결제 연동 전 뼈대)"

구현된 게이트 UI의 동작 방식을 설명해줘.
```

---

## 6. 전체 서비스 헬스체크 프롬프트

> **목적**: 서비스 전반의 상태를 빠르게 점검
> **실행 주기**: 일 1회 (스케줄 실행 권장)

```
/Users/lee/projects/toolfit/toolfit 폴더의 CLAUDE.md를 읽어.

다음 항목을 순서대로 점검하고 결과를 표로 정리해줘:

1. 코드 품질 체크
   - toolfit_app/src/*.jsx 파일에 console.error / TODO / FIXME / 하드코딩된 URL이 있는지 grep
   - worker/index.js에 에러 핸들링이 빠진 fetch 호출이 있는지 확인

2. 환경변수 체크
   - toolfit_app/.env.example에 정의된 변수가 모두 있는지
   - worker/wrangler.toml에 주석 처리된 미완성 설정이 있는지

3. 의존성 체크
   - toolfit_app/package.json의 dependencies 중 major 버전이 크게 뒤처진 패키지 확인
   - (npm outdated 실행)

4. 빌드 체크
   - cd toolfit_app && npm run build 실행
   - 빌드 성공 여부와 번들 크기 확인

5. Worker 코드 체크
   - worker/index.js의 buildPrompt() 함수가 모든 입력 필드를 활용하는지 확인
   - CLAUDE_MODEL 상수가 최신 모델인지 확인 (현재: claude-haiku-4-5-20251001)

점검 결과를 아래 형식으로 정리해줘:
- ✅ 정상 항목
- ⚠️ 주의 항목 (즉각 수정 불필요)
- ❌ 문제 항목 (수정 필요)

문제 항목이 있으면 즉시 수정하고 git commit해줘.
```

---

## 스케줄 자동 실행 설정 방법

Claude Cowork의 스케줄 기능을 사용해 위 프롬프트를 자동 실행할 수 있습니다.

예시: 매주 월요일 오전 9시 헬스체크 자동 실행
> "매주 월요일 오전 9시에 Toolfit 서비스 헬스체크 프롬프트(AGENT_PROMPTS.md의 #6)를 실행해줘"

예시: 매주 수요일 오전 10시 툴 데이터 최신화
> "매주 수요일 오전 10시에 Toolfit 툴 데이터 최신화 프롬프트(AGENT_PROMPTS.md의 #1)를 실행해줘"
