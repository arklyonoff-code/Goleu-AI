# Cloudflare Worker 배포 가이드

Claude API를 연결해 AI 맞춤 추천을 제공하는 Worker 배포 방법입니다.

---

## 구조

```
toolfit/
├── toolfit_app/          # React 프론트엔드 (Cloudflare Pages)
│   └── src/ToolfitResult.jsx  # ← VITE_WORKER_URL로 Worker 호출
└── worker/
    ├── index.js          # Cloudflare Worker (Claude API 호출)
    └── wrangler.toml     # Worker 설정
```

---

## 1. Wrangler CLI 설치 & 로그인

```bash
npm install -g wrangler
wrangler login   # 브라우저에서 Cloudflare 계정 인증
```

---

## 2. Anthropic API 키 등록 (Secret)

```bash
cd toolfit/worker
wrangler secret put ANTHROPIC_API_KEY
# 프롬프트에 API 키 붙여넣기 (https://console.anthropic.com/keys)
```

> **Secret vs Variable**: API 키는 반드시 `secret put`으로 등록해야 합니다.
> Dashboard > Worker > Settings > Variables에서도 등록 가능합니다.

---

## 3. (선택) KV 캐싱 설정

같은 팀 구성 요청을 24시간 캐싱해 Claude API 비용을 절감합니다.

```bash
# KV namespace 생성
wrangler kv namespace create TOOLFIT_KV

# 출력 예시:
# { binding = "TOOLFIT_KV", id = "abc123def456..." }

# wrangler.toml의 kv_namespaces 섹션 주석 해제 후 id 입력
```

---

## 4. 로컬 개발 테스트

```bash
cd toolfit/worker
wrangler dev

# → http://localhost:8787 에서 Worker 실행됨

# 다른 터미널에서 테스트:
curl -X POST http://localhost:8787/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "테스트팀",
    "roles": {"dev": 2, "design": 1, "marketing": 1, "ops": 0},
    "selectedTools": ["slack", "notion"],
    "monthlyBudget": "$500"
  }'
```

프론트엔드 로컬 테스트:
```bash
# toolfit_app/.env.local 파일 생성
echo "VITE_WORKER_URL=http://localhost:8787" > toolfit_app/.env.local

cd toolfit_app
npm run dev
```

---

## 5. Worker 배포

```bash
cd toolfit/worker
wrangler deploy
```

배포 후 출력 예시:
```
✅ Deployed toolfit-api
   https://toolfit-api.YOUR-ACCOUNT.workers.dev
```

---

## 6. 프론트엔드에 Worker URL 연결

### Cloudflare Pages 환경변수 설정
1. Cloudflare Dashboard → Pages → toolfit 프로젝트
2. Settings → Environment variables
3. `VITE_WORKER_URL` = `https://toolfit-api.YOUR-ACCOUNT.workers.dev` 추가
4. Pages 재배포 (git push 또는 수동 Deploy)

### 로컬 .env.local 업데이트
```bash
# toolfit_app/.env.local
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_WORKER_URL=https://toolfit-api.YOUR-ACCOUNT.workers.dev
```

---

## 7. CORS 설정 확인 (도메인 제한 원할 경우)

현재 Worker는 `Access-Control-Allow-Origin: *`로 모든 도메인 허용.
운영 시 도메인을 제한하려면 `worker/index.js`의 `CORS_HEADERS`를 수정:

```js
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://toolfit.io",  // 실제 도메인
  ...
};
```

---

## 비용 추산 (Cloudflare Workers 무료 티어)

| 항목 | 무료 한도 | 예상 사용량 |
|------|-----------|-------------|
| Worker 요청 | 100,000건/일 | 초기: ~수백 건/일 |
| Worker CPU 시간 | 10ms/요청 (무료) | Claude 호출은 subrequest라 별도 |
| Claude API (Haiku) | 유료 | ~$0.00025/추천 1건 |

월 1,000명 사용 기준 Claude API 비용: **약 $0.25** (매우 저렴)

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `500 ANTHROPIC_API_KEY가 설정되지 않았습니다` | Secret 미등록 | `wrangler secret put ANTHROPIC_API_KEY` |
| CORS 오류 | Worker URL 불일치 | VITE_WORKER_URL 확인 |
| `Claude API 오류 (401)` | API 키 오류 | Anthropic Console에서 키 재확인 |
| 응답이 항상 같음 | KV 캐시 HIT | 정상 동작 (24시간 캐싱) |
| JSON 파싱 실패 | Claude 응답 형식 이상 | Worker 로그 확인: `wrangler tail` |
