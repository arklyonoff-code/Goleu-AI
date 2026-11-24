// AI 빌더 스택 추천 (/build): 한 줄 설명 + 규모 + 우선순위 → Worker /ai-stack
import { useEffect, useState } from "react";
import { Button, Input, Segmented, Card, Alert, Tag } from "antd";
import { useLanguage } from "./lib/LanguageContext";
import { trackEvent } from "./lib/analytics";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
function resolveWorkerUrl() {
  const configured = WORKER_URL?.trim();
  if (configured && !configured.includes("YOUR-ACCOUNT")) return configured.replace(/\/$/, "");
  if (!import.meta.env.PROD) return "http://localhost:8787";
  return null;
}

const T = {
  ko: {
    title: "만들 AI 앱을 한 줄로 설명하세요",
    sub: "LLM·프레임워크·벡터DB·배포 조합과 예상 월 비용을 바로 알려드립니다.",
    placeholder: "예: 사내 규정 PDF를 검색해서 답해주는 슬랙 챗봇",
    mau: "월 활성 사용자", priority: "우선순위", language: "주 개발 언어",
    cost: "비용 최소", balanced: "균형", quality: "품질 우선",
    go: "스택 추천받기", loading: "계산 중…",
    total: "예상 월 비용", llm: "LLM", alt: "대안", framework: "프레임워크", vector: "벡터 DB", hosting: "배포",
    assumptions: (a) => `가정: 사용자 ${a.mau.toLocaleString()}명 × 월 ${a.requestsPerUser}회 = ${a.requests.toLocaleString()}회 요청, 요청당 입력 ${a.inputTokens.toLocaleString()} / 출력 ${a.outputTokens.toLocaleString()} 토큰`,
    asOf: (d) => `가격 기준일 ${d} · 공식 가격 페이지 기준 · 실제 청구액은 사용량에 따라 다릅니다`,
    affiliate: "일부 링크는 제휴 링크입니다. 추천 순서는 제휴 여부와 무관합니다.",
    error: "추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    empty: "설명을 한 줄 입력해 주세요.",
  },
  en: {
    title: "Describe the AI app you want to build in one line",
    sub: "Get an LLM, framework, vector DB and hosting stack with an estimated monthly cost.",
    placeholder: "e.g. A Slack bot that answers questions from our policy PDFs",
    mau: "Monthly active users", priority: "Priority", language: "Main language",
    cost: "Lowest cost", balanced: "Balanced", quality: "Best quality",
    go: "Recommend my stack", loading: "Calculating…",
    total: "Estimated monthly cost", llm: "LLM", alt: "Alternative", framework: "Framework", vector: "Vector DB", hosting: "Hosting",
    assumptions: (a) => `Assumes ${a.mau.toLocaleString()} users × ${a.requestsPerUser} requests/month = ${a.requests.toLocaleString()} requests, ${a.inputTokens.toLocaleString()} input / ${a.outputTokens.toLocaleString()} output tokens each`,
    asOf: (d) => `Prices as of ${d} from official pricing pages · actual bills depend on usage`,
    affiliate: "Some links are affiliate links. Rankings are not affected by affiliate status.",
    error: "Couldn't load a recommendation. Please try again.",
    empty: "Please describe your app in one line.",
  },
};

const noteText = (n, ko) => (!n ? "" : typeof n === "string" ? n : n[ko ? "ko" : "en"]);
const usd = (n) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function Row({ label, name, value, note, href, onLinkClick }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div>
        <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
        <div style={{ fontWeight: 600 }}>{href ? <a href={href} target="_blank" rel="noopener sponsored" onClick={onLinkClick}>{name}</a> : name}</div>
        {note && <div style={{ fontSize: 12, color: "#888" }}>{note}</div>}
      </div>
      {value !== undefined && <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{usd(value)}</div>}
    </div>
  );
}

export default function BuildStack() {
  const { lang } = useLanguage();
  const t = T[lang === "ko" ? "ko" : "en"];
  const [description, setDescription] = useState("");
  const [mau, setMau] = useState(1000);
  const [priority, setPriority] = useState("balanced");
  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // over: 상태 갱신을 기다리지 않고 바로 보낼 값 (링크로 들어온 경우)
  async function submit(over = {}) {
    const v = { description, mau, priority, language, ...over };
    if (!v.description.trim()) { setError(t.empty); return; }
    const base = resolveWorkerUrl();
    if (!base) { setError(t.error); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${base}/ai-stack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: v.description, mau: v.mau, priority: v.priority, language: v.language, lang: lang === "ko" ? "ko" : "en" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setResult(data);
      trackEvent("ai_stack_recommended", { use_case: data.useCase.id, mau: v.mau, priority: v.priority, language: v.language, total_usd: data.cost.total, from: over.from || "" });
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  // 계산기 등에서 ?desc=&mau=&from= 으로 넘어오면 채워 넣고 바로 추천을 받는다
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const desc = (q.get("desc") || "").slice(0, 300);
    if (!desc.trim()) return;
    const m = Number(q.get("mau"));
    const v = { description: desc, from: q.get("from") || "link" };
    if ([100, 1000, 10000, 100000].includes(m)) v.mau = m;
    setDescription(v.description);
    if (v.mau) setMau(v.mau);
    submit(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const link = (item) => item?.affiliate || null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>{t.title}</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>{t.sub}</p>

      <Input.TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.placeholder} autoSize={{ minRows: 2, maxRows: 4 }} maxLength={300} />

      <div style={{ marginTop: 16, fontSize: 13, color: "#555" }}>{t.mau}</div>
      <Segmented block value={mau} onChange={setMau} options={[100, 1000, 10000, 100000].map((v) => ({ label: v.toLocaleString(), value: v }))} />

      <div style={{ marginTop: 12, fontSize: 13, color: "#555" }}>{t.priority}</div>
      <Segmented block value={priority} onChange={setPriority} options={[{ label: t.cost, value: "cost" }, { label: t.balanced, value: "balanced" }, { label: t.quality, value: "quality" }]} />

      <div style={{ marginTop: 12, fontSize: 13, color: "#555" }}>{t.language}</div>
      <Segmented block value={language} onChange={setLanguage} options={[{ label: "Python", value: "python" }, { label: "TypeScript", value: "typescript" }]} />

      <Button type="primary" size="large" block style={{ marginTop: 20 }} loading={loading} onClick={() => submit()}>{loading ? t.loading : t.go}</Button>

      {error && <Alert style={{ marginTop: 16 }} type="error" message={error} showIcon />}

      {result && (
        <Card style={{ marginTop: 24 }}>
          <Tag color="purple">{result.useCase.label}</Tag>
          <div style={{ margin: "12px 0 4px", fontSize: 13, color: "#888" }}>{t.total}</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{usd(result.cost.total)}<span style={{ fontSize: 14, color: "#888" }}> / mo</span></div>

          <Row label={t.llm} name={`${result.llm.name} (${result.llm.vendor})`} value={result.cost.llm} note={`$${result.llm.input} / $${result.llm.output} per 1M tokens${result.llm.note ? ` · ${noteText(result.llm.note, lang === "ko")}` : ""}`} href={link(result.llm)} />
          {result.alternativeLlm && <Row label={t.alt} name={`${result.alternativeLlm.name} (${result.alternativeLlm.vendor})`} value={result.alternativeLlm.monthly} href={link(result.alternativeLlm)} />}
          <Row label={t.framework} name={result.framework} />
          {result.vectorDb && <Row label={t.vector} name={result.vectorDb.name} value={result.cost.vectorDb} note={noteText(result.vectorDb.note, lang === "ko")} href={link(result.vectorDb)} />}
          <Row label={t.hosting} name={result.hosting.name} value={result.cost.hosting} note={noteText(result.hosting.note, lang === "ko")} href={link(result.hosting)} onLinkClick={() => trackEvent("affiliate_click", { item: result.hosting.name, from: "build" })} />

          <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>{t.assumptions(result.assumptions)}</p>
          <p style={{ fontSize: 12, color: "#888" }}>{t.asOf(result.asOf)}</p>
          {result.hasAffiliate && <p style={{ fontSize: 12, color: "#888" }}>{t.affiliate}</p>}
        </Card>
      )}
    </div>
  );
}
