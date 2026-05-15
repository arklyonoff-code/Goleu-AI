# ToolFit — H1.2 추천 CTR 측정 가이드

> **목표 가설**: "500명 무료 Quiz → 추천 클릭률(CTR) ≥ 25%"
> **출처**: 전략 페이지 §26 Hypothesis Tree, H1.2

---

## 1. 사전 준비

### 1.1 GA4 프로퍼티 생성
1. <https://analytics.google.com> → **관리** → **+ 만들기 → 속성**
2. 보고 시간대: `(GMT+09:00) 대한민국 표준시`, 통화: KRW
3. 비즈니스 정보: 데이터 흐름 = **웹**, URL은 배포 도메인
4. 생성 후 **데이터 스트림 → 측정 ID** (`G-XXXXXXXXXX`) 복사

### 1.2 `.env.local` 설정
```bash
cd toolfit_app
cp .env.example .env.local
# .env.local 을 열어 VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX 입력
npm run dev
```

### 1.3 동의 배너 확인
- 첫 진입 시 우측 하단에 "쿠키 사용 동의" 배너 노출
- "동의하고 계속" 클릭 시 GA4 활성, "거부" 시 어떤 이벤트도 보내지 않음
- 결정은 `localStorage` 에 저장되어 재방문 시 재노출되지 않음

---

## 2. 발송되는 이벤트 (Event Spec)

| 이벤트 이름 | 발송 시점 | 주요 파라미터 |
| --- | --- | --- |
| `page_view` | 라우트 변경마다 | `page_path`, `page_title` |
| `quiz_started` | `/` 페이지 첫 마운트 | `entry_step` |
| `tool_selected` / `tool_deselected` | Step 2에서 툴 토글 시 | `tool` |
| `quiz_step_completed` | 각 단계의 "다음" 클릭 | `step` (1–4), `step_name` (team\|tools\|cloud\|llm), 단계별 응답 |
| `email_entered` | Step 2에서 이메일 입력 후 다음 | `step` |
| `quiz_completed` | Step 4에서 다음 클릭 (전체 funnel 완료) | `total_tools_selected`, `total_clouds_selected`, `total_llms_selected` |
| `recommendation_viewed` | `/recommend` 첫 노출 (분모) | `productivity_total`, `cost_total`, `existing_tools` |
| `recommendation_clicked` | 추천 조합의 개별 툴 행 클릭 (분자) | `combo` (productivity\|cost), `tool_name`, `tool_price` |
| `simulation_clicked` | "시뮬레이션 보기" 버튼 | `combo` |
| `pro_upgrade_clicked` | 헤더 "Pro 업그레이드" | `source` |
| `category_card_clicked` | 카테고리별 추천 툴 카드 | `category`, `tools` |

모든 이벤트에는 자동으로 `session_id`(30분 sliding) 와 `user_pseudo_id`(영구 UUID) 가 첨부됨.

---

## 3. GA4 대시보드 구성

### 3.1 핵심 KPI 카드 (Realtime + Reports)
- **Quiz 시작 수** = `quiz_started`
- **Quiz 완료 수** = `quiz_completed`
- **추천 노출 수** (CTR 분모) = `recommendation_viewed`
- **추천 클릭 수** (CTR 분자) = `recommendation_clicked` (세션당 1회 카운트 권장)

### 3.2 H1.2 CTR — 탐색(Exploration) 보고서로 만들기

**경로**: GA4 → 탐색 → **빈 보고서** → 기법: "**유입경로 탐색 분석**" (Funnel exploration)

**단계**
1. 단계 1: `quiz_started`
2. 단계 2: `quiz_step_completed` where `step_name = team`
3. 단계 3: `quiz_step_completed` where `step_name = tools`
4. 단계 4: `quiz_step_completed` where `step_name = cloud`
5. 단계 5: `quiz_step_completed` where `step_name = llm`
6. 단계 6: `recommendation_viewed` ← **CTR 분모**
7. 단계 7: `recommendation_clicked` ← **CTR 분자**

**옵션**: "닫힌 funnel" OFF (도중 이탈도 측정), 분석 기간 = 직전 30일

**CTR 계산식**
```
CTR = recommendation_clicked (고유 사용자) / recommendation_viewed (고유 사용자)
```

> 목표: ≥ 25% → H1.2 검증 성공.

### 3.3 추천 조합별 CTR 분리

탐색 → **자유 형식(Free form)** 보고서:
- 행: `combo` (custom dimension — 4.1 참조)
- 값: `recommendation_clicked` 이벤트 수 / `recommendation_viewed` 이벤트 수

**Why**: "생산성 조합" vs "비용 효율 조합" 중 어느 쪽이 더 클릭률이 높은지 확인 → §22 보강 항목 우선순위 결정.

### 3.4 N=500 표본 도달 모니터링

탐색 → 자유 형식:
- 행: 날짜
- 값: `quiz_started` 의 **고유 사용자**
- 누적값이 500 도달 시 분석 시작

---

## 4. 커스텀 디멘션 등록 (필수)

GA4는 이벤트 파라미터를 자동으로 보고서 디멘션으로 노출하지 않음. 다음을 등록:

**경로**: GA4 → 관리 → **맞춤 정의** → 맞춤 측정기준 만들기

| 표시 이름 | 범위 | 이벤트 매개변수 |
| --- | --- | --- |
| Combo | 이벤트 | `combo` |
| Tool Name | 이벤트 | `tool_name` |
| Step Name | 이벤트 | `step_name` |
| User Pseudo ID | 사용자 | `user_pseudo_id` |
| Session ID | 이벤트 | `session_id` |

등록 후 24–48시간 후부터 보고서에서 사용 가능.

---

## 5. 대시보드(섹션) 권장 구성

| 섹션 | 위젯 | 사용 보고서 |
| --- | --- | --- |
| **A. Funnel** | Step-by-step 이탈 | 유입경로 탐색 분석 (3.2) |
| **B. CTR Headline** | 7일 / 30일 CTR % | 자유 형식, `recommendation_clicked` / `viewed` |
| **C. Combo 비교** | 생산성 vs 비용 CTR | 3.3 |
| **D. 표본** | `quiz_started` 누적 | 3.4 |
| **E. 추가 행동** | `simulation_clicked`, `pro_upgrade_clicked`, `category_card_clicked` 빈도 | 자유 형식 |
| **F. 디바이스/소스** | CTR by device, source | 표준 보고서 + 세그먼트 |

---

## 6. 분석 종료 기준 (Stop Rule)

| 조건 | 의미 | 액션 |
| --- | --- | --- |
| `quiz_started` 누적 ≥ 500 **and** CTR ≥ 25% (95% CI 하한도 25% 이상) | **H1.2 성공** | Pro 결제 플로우 검증 단계로 이동 |
| 누적 ≥ 500 **and** CTR < 25% (CI 상한도 25% 미만) | **H1.2 실패** | 추천 디자인 재설계 (reasoning 패널, 시뮬레이션 등 §22 항목 우선 적용) |
| 누적 ≥ 1000 **and** CI 가 25% 를 포함 | 결과 불명확 | 표본 확대 또는 변형 A/B 실험 도입 |

**비율 신뢰구간**: 정규 근사
`CTR ± 1.96 × √(p(1-p) / n)`. n=500, p=0.25 일 때 ±3.8%p.

---

## 7. 로컬 디버그

- `npm run dev` 모드에서는 콘솔에 `[analytics] event: ...` 로그가 찍힘
- 동의 거부 상태에서는 어떤 이벤트도 발송되지 않음을 콘솔에서 확인
- GA4 → **DebugView**: Chrome 확장 "Google Analytics Debugger" 설치 후 실시간 이벤트 확인

---

## 8. 운영 체크리스트

- [ ] GA4 프로퍼티 생성 + 측정 ID 발급
- [ ] `.env.local` 에 측정 ID 입력 + 배포 환경 변수 설정
- [ ] 5개 커스텀 디멘션 등록 (Combo, Tool Name, Step Name, User Pseudo ID, Session ID)
- [ ] §3.2 funnel 탐색 보고서 생성
- [ ] §3.3 combo 비교 보고서 생성
- [ ] §3.4 표본 모니터링 보고서 생성
- [ ] 개인정보처리방침 페이지에 GA4 사용 고지 (한국 PIPA)
- [ ] 동의 거부 시 이벤트 미발송 — 프로덕션에서 한번 직접 검증
