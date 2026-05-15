# ToolFit — GitHub Pages 무료 배포 가이드

> **목표**: `https://arklyonoff-code.github.io/toolfit/` 에 무료 서브도메인으로 배포.
> **비용**: $0 (GitHub Pages 무료, GA4 무료).
> **소요 시간**: 약 10–15분 (계정 있다는 가정).
> **사전 조건**: 이미 `github.com/arklyonoff-code/toolfit` 레포가 생성되어 로컬 `/Users/lee/projects/toolfit/toolfit/` 에 clone 되어 있음.

---

## 0. 한눈에 보기

| 단계 | 내용 | 소요 |
| --- | --- | --- |
| 1 | GA4 측정 ID 발급 | 3분 |
| 2 | 로컬에서 `git add → commit → push` | 2분 |
| 3 | Repo Secret 등록 (`VITE_GA_MEASUREMENT_ID`) | 1분 |
| 4 | GitHub Pages 활성화 (Source = GitHub Actions) | 1분 |
| 5 | Actions 자동 빌드·배포 대기 | 2–3분 |
| 6 | 배포 URL 접속 & 동의 배너 확인 | 1분 |
| 7 | GA4 DebugView 에서 이벤트 흐름 확인 | 2분 |

> Step 1, 3, 4, 6, 7 은 **사용자가 직접** 해야 합니다. Step 2 명령은 아래에, Step 5 는 자동입니다.

---

## 1. GA4 측정 ID 발급 (무료)

1. <https://analytics.google.com> 접속 → **관리** → **+ 만들기 → 속성**
2. 속성 이름: `ToolFit` / 시간대: 대한민국 / 통화: KRW
3. 비즈니스 정보 입력 후 **데이터 스트림 → 웹** 선택
4. URL 은 일단 `https://YOUR_GITHUB_USERNAME.github.io` 로 입력 (나중에 변경 가능)
5. 생성된 **측정 ID** (`G-XXXXXXXXXX` 형식) 복사 → 4단계에서 사용

**무료 한도 확인**
- 월 이벤트 10M (테스트에는 차고 넘침)
- 데이터 보관 기본 2개월 → 14개월로 무료 연장: 관리 → 데이터 설정 → 데이터 보관 → "14개월" 선택

---

## 2. 로컬 git 커밋 & push

레포는 이미 `/Users/lee/projects/toolfit/toolfit/` 에 clone 되어 있고, 이 가이드에서 만든 파일들도 이미 그 안에 배치되어 있습니다. 다음 명령을 그대로 복사·실행:

```bash
cd /Users/lee/projects/toolfit/toolfit

# (선택) stale 빌드 산출물 정리 — toolfit_app/dist 가 있을 경우
rm -rf toolfit_app/dist

# 첫 커밋
git add .
git status   # 추가될 파일 확인 (.github/, .gitignore, docs/, toolfit_app/)
git commit -m "feat: ToolFit MVP + GA4 analytics + GitHub Pages 배포 구성"
git push origin main
```

push 직후 Actions 가 자동으로 시작됩니다. 단, Secret 등록 전에는 GA4 가 작동하지 않으므로 다음 단계에서 Secret 등록 후 재실행이 필요합니다.

---

## 3. Repo Secret 등록

1. <https://github.com/arklyonoff-code/toolfit/settings/secrets/actions>
2. **New repository secret** 클릭
3. Name: `VITE_GA_MEASUREMENT_ID`
4. Value: §1에서 복사한 `G-XXXXXXXXXX`
5. **Add secret**

> 이 값이 비어있어도 사이트는 동작하지만 GA4 이벤트가 전송되지 않습니다.

**(옵션) repo 이름을 바꾼다면**
- Settings → Secrets and variables → Actions → **Variables 탭** → New repository variable
- Name: `VITE_BASE_PATH`, Value: `/your-repo-name/`
- 현 설정상 자동으로 `/{repo-name}/` 가 사용되므로 보통 건드릴 필요 없음.

---

## 4. GitHub Pages 활성화

1. <https://github.com/arklyonoff-code/toolfit/settings/pages>
2. **Source**: `GitHub Actions` 선택 (Branch 선택 X)
3. 저장 — 별도 입력 없이 워크플로가 알아서 배포 채널을 만듭니다.

---

## 5. Actions 빌드·배포 대기 + Secret 적용 위해 재실행

1. <https://github.com/arklyonoff-code/toolfit/actions>
2. "Deploy ToolFit to GitHub Pages" 워크플로의 최근 실행을 확인
3. Secret 등록 전에 이미 한 번 돌았다면 GA 이벤트가 비활성 상태이므로 재실행 필요:
   - 최근 실행 클릭 → 오른쪽 위 **Re-run all jobs**
   - 또는 빈 커밋: `git commit --allow-empty -m "trigger redeploy" && git push`
4. 2–3분 후 ✅ 표시되면 완료

---

## 6. 배포 URL 접속 확인

<https://arklyonoff-code.github.io/toolfit/> 접속.

체크리스트:
- [ ] ToolFit 메인 페이지가 정상 표시 (1단계 quiz)
- [ ] 우측 하단에 **쿠키 사용 동의 배너** 노출
- [ ] "동의하고 계속" 클릭 후 quiz 진행
- [ ] 각 단계에서 진행률 바가 **25% → 50% → 75% → 100%** 로 증가 (이전 버그 fix 확인)
- [ ] URL 이 `/#/tools`, `/#/cloud`, `/#/llm`, `/#/recommend` 로 변하는지 확인 (HashRouter)

---

## 7. GA4 DebugView 로 이벤트 흐름 확인

1. Chrome 확장 [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) 설치 & ON
2. 배포된 사이트 새로고침 → 동의 후 quiz 진행
3. GA4 → 관리 → **DebugView** 에서 실시간으로 다음 이벤트가 흐르는지 확인:
   - `page_view`, `quiz_started`, `quiz_step_completed`, `quiz_completed`
   - `recommendation_viewed`, `recommendation_clicked`, `simulation_clicked`

DebugView 에서 이벤트가 보이면 **데이터 수집 완료** — 이후 누적되는 데이터는 24시간 안에 정규 보고서에 반영됩니다.

---

## 8. (선택) 커스텀 도메인 연결

서브도메인으로 충분하다면 건너뛰세요. 이후 자체 도메인 연결을 원하면:

1. 도메인 등록처 DNS 에 CNAME 레코드 추가: `toolfit.your-domain.com` → `<username>.github.io`
2. 레포 Settings → Pages → Custom domain 에 입력
3. HTTPS 강제(Enforce HTTPS) 체크 (Let's Encrypt 자동 발급)
4. `VITE_BASE_PATH` 를 `/` 로 변경 (커스텀 도메인은 서브경로 없음) → Variable 업데이트 후 재배포
5. (선택) §App.jsx 의 `HashRouter` 를 `BrowserRouter` 로 되돌리고 `public/404.html` SPA 폴백 추가

---

## 9. 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| 404 페이지만 나옴 | Pages Source 가 Branch 로 설정됨 | Settings → Pages → Source = "GitHub Actions" |
| 화면 흰 페이지 | base path 불일치 | repo 이름 확인 + `VITE_BASE_PATH` Variable 확인 |
| 이벤트 GA4 에 안 보임 | Secret 미등록 / 동의 거부 / 확인 시점 늦음 | Secret 등록 → Re-run → DebugView |
| Actions 빌드 실패 | package-lock.json 변경 미푸시 | `git add toolfit_app/package-lock.json && git commit && git push` |
| Quiz 진행 중 새로고침 후 404 | BrowserRouter 사용 중 | HashRouter 유지 (이미 적용됨) |

---

## 10. 무료 한도 요약

| 항목 | 무료 한도 | 우리 테스트 부하 | 여유 |
| --- | --- | --- | --- |
| GitHub Pages 트래픽 | 100GB/월 (soft) | < 1GB | 100x |
| GitHub Pages 빌드 분 | 무제한 (public repo) | — | ∞ |
| GitHub Actions 분 | 무제한 (public repo) | < 10분/일 | ∞ |
| GA4 이벤트 | 10M/월 | < 50K (500명 × 100이벤트) | 200x |
| GA4 데이터 보관 | 14개월 (설정 변경 시) | 1–2개월 사용 | OK |

**결론**: 테스트 단계에서 추가 비용은 0원. PMF 검증 후 트래픽이 폭발해도 한참 여유.
