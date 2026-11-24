// LLM API 월 비용 계산기 (/llm-cost): 요청 수 × 토큰 → 모델별 월 비용. 가격은 src/lib/ai-stack.js 한 곳에서 가져온다.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, InputNumber, Segmented, Slider, Table, Tag } from "antd";
import { PRICES, USE_CASES, effectivePrice, inputRate, priceForPrompt } from "./lib/ai-stack.js";
import { useLanguage } from "./lib/LanguageContext";
import { trackEvent } from "./lib/analytics";

const T = {
  ko: {
    h1: "LLM API 월 비용 계산기",
    sub: "하루 요청 수와 요청당 토큰을 넣으면 주요 모델의 월 비용을 한 번에 비교합니다.",
    preset: "용도 프리셋", perDay: "하루 요청 수", inTok: "요청당 입력 토큰", outTok: "요청당 출력 토큰",
    model: "모델", tier: "등급", price: "가격 (입력/출력, 1M 토큰)", monthly: "월 비용",
    tiers: { economy: "저가", balanced: "균형", premium: "고가" },
    monthlyReq: (n, d) => `= 월 ${n.toLocaleString()}건 · 예: 사용자 ${d.toLocaleString()}명이 하루 1번씩 쓰는 경우`,
    hostFilter: "제공처", hostAll: "전체", hostUs: "미국 업체·미국 리전만",
    hostNote: "같은 오픈 웨이트 모델도 중국 업체 공식 API와 미국 호스팅(Together AI)의 가격이 다를 수 있어 나눠서 보여줍니다. 공식 API의 실제 처리 위치는 확인하지 않았습니다.",
    verdict: (c, b, p) => `이 조건에서 가장 싼 선택은 ${c}예요. 균형 등급 최저가는 ${b}, 고가 등급 최저가는 ${p}예요.`,
    perMonth: (v) => `월 ${v}`, offPeak: "비혼잡 시간",
    toBuild: "이 조건으로 전체 스택 보기 →", copy: "이 조건 링크 복사", copied: "복사했어요",
    cacheTitle: "프롬프트 캐싱", prefix: "입력 중 매번 반복되는 앞부분 (시스템 프롬프트·이전 대화)", expiry: "그중 캐시에 새로 쓰는 비율 (새로 붙은 대화 · 만료돼 다시 쓰는 부분)",
    longCtx: "입력 10만 토큰 초과: Claude Haiku 5.5는 장문 요금으로 계산했습니다. 다른 모델의 장문 구간 요금(예: GPT-6.1 Terra 27.2만 토큰 초과)은 아직 반영하지 않았습니다.", longTag: "장문 요금",
    cacheNote: "기본값은 이 용도의 가정입니다. 캐시 쓰기는 Anthropic만 입력가의 1.25배, OpenAI·Google은 입력가로 계산합니다.", cached: "캐시",
    spread: (x) => `지금 조건에서 가장 비싼 모델은 가장 싼 모델의 ${x}배`,
    note: (d) => `가격 기준일 ${d} · 각 사의 공식 가격 페이지 기준 표준 요금 · Gemini 캐시 저장료·배치 할인 미반영 · 한 달은 30일로 계산`,
    tierNote: "등급은 같은 회사 안의 가격 순서이며 품질 평가가 아닙니다.",
    ctaTitle: "모델만 정하면 끝이 아닙니다",
    ctaDesc: "벡터DB·프레임워크·배포까지 포함한 전체 스택과 월 비용을 받아 보세요.",
    cta: "내 AI 앱 전체 스택 추천받기 →",
  },
  en: {
    h1: "LLM API monthly cost calculator",
    sub: "Enter daily requests and tokens per request to compare the monthly cost of major models.",
    preset: "Preset", perDay: "Requests per day", inTok: "Input tokens / request", outTok: "Output tokens / request",
    model: "Model", tier: "Tier", price: "Price (in/out per 1M tokens)", monthly: "Monthly cost",
    tiers: { economy: "Economy", balanced: "Balanced", premium: "Premium" },
    monthlyReq: (n, d) => `= ${n.toLocaleString()} requests/month · e.g. ${d.toLocaleString()} users, once a day each`,
    hostFilter: "Provider", hostAll: "All", hostUs: "US companies / US regions only",
    hostNote: "Open-weight models are listed twice: the vendor's official API and a US host (Together AI), since prices can differ. We haven't verified where the official APIs process data.",
    verdict: (c, b, p) => `Cheapest at these settings: ${c}. Cheapest balanced-tier: ${b}. Cheapest premium-tier: ${p}.`,
    perMonth: (v) => `${v}/mo`, offPeak: "off-peak",
    toBuild: "See the full stack for these settings →", copy: "Copy link to these settings", copied: "Copied",
    cacheTitle: "Prompt caching", prefix: "Share of input repeated every request (system prompt, prior turns)", expiry: "Share of that written to cache (newly appended turns, or re-written after expiry)",
    longCtx: "Over 100K input tokens: Claude Haiku 5.5 is priced at its long-context rate. Long-context tiers for other models (e.g. GPT-6.1 Terra above 272K) are not applied yet.", longTag: "long-context rate",
    cacheNote: "Defaults are assumptions for this use case. Cache writes: Anthropic at 1.25x input, OpenAI and Google at the input price.", cached: "cached",
    spread: (x) => `At these settings the most expensive model costs ${x}x the cheapest`,
    note: (d) => `Prices as of ${d} · official standard list prices · Gemini cache storage and batch discounts not included · 30-day month`,
    tierNote: "Tiers reflect price order within each provider, not a quality rating.",
    ctaTitle: "Picking a model is only step one",
    ctaDesc: "Get the full stack — vector DB, framework, hosting — with a monthly cost.",
    cta: "Recommend my full AI stack →",
  },
};

const TIER_COLOR = { economy: "green", balanced: "blue", premium: "purple" };
const noteText = (n, ko) => (!n ? "" : typeof n === "string" ? n : n[ko ? "ko" : "en"]);
// /build 로 넘길 때 쓰는 용도별 한 줄 설명 (ai-stack.js 의 classify 키워드에 맞춤)
const BUILD_DESC = {
  chat: { ko: "고객 상담 챗봇", en: "customer support chatbot" },
  rag: { ko: "사내 문서 검색 챗봇", en: "search internal docs and answer questions" },
  agent: { ko: "업무 자동화 에이전트", en: "workflow automation agent" },
  extract: { ko: "영수증 데이터 추출", en: "extract data from receipts" },
  generate: { ko: "마케팅 콘텐츠 생성", en: "generate marketing content" },
};
const MAU_OPTIONS = [100, 1000, 10000, 100000];
// 월 요청 수 ÷ 1인당 월 요청 수 → /build 의 사용자 수 선택지 중 가장 가까운 값(로그 스케일)
const nearestMau = (users) => MAU_OPTIONS.reduce((best, v) =>
  Math.abs(Math.log10(Math.max(users, 1) / v)) < Math.abs(Math.log10(Math.max(users, 1) / best)) ? v : best);
const intParam = (q, k, max) => {
  const n = Number(q.get(k));
  return q.has(k) && Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : null;
};
const usd = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: n < 10 ? 2 : 0 })}`;

export default function LlmCost() {
  const { lang } = useLanguage();
  const ko = lang === "ko";
  const t = T[ko ? "ko" : "en"];
  const [preset, setPreset] = useState("chat");
  const [perDay, setPerDay] = useState(1000);
  const [inTok, setInTok] = useState(USE_CASES.chat.inTok);
  const [outTok, setOutTok] = useState(USE_CASES.chat.outTok);
  const [prefix, setPrefix] = useState(0);
  const [expiry, setExpiry] = useState(0);
  const cacheOn = Boolean(USE_CASES[preset].cache);
  const [hostScope, setHostScope] = useState("all");
  const [urlReady, setUrlReady] = useState(false);
  const [copied, setCopied] = useState(false);

  // 공유 링크(?p=&d=&i=&o=&c=&e=)로 들어오면 그 조건을 복원한다. 프리렌더 HTML과 어긋나지 않게 마운트 후에 읽는다
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get("p");
    if (p && USE_CASES[p]) {
      setPreset(p);
      setInTok(USE_CASES[p].inTok);
      setOutTok(USE_CASES[p].outTok);
      setPrefix(Math.round((USE_CASES[p].cache?.prefix || 0) * 100));
      setExpiry(Math.round((USE_CASES[p].cache?.expiry || 0) * 100));
    }
    const d = intParam(q, "d", 1e9), i = intParam(q, "i", 2e6), o = intParam(q, "o", 2e6), c = intParam(q, "c", 100), e = intParam(q, "e", 100);
    if (d !== null) setPerDay(d);
    if (i !== null) setInTok(i);
    if (o !== null) setOutTok(o);
    if (c !== null) setPrefix(c);
    if (e !== null) setExpiry(e);
    if (q.get("h") === "us") setHostScope("us");
    if (p) trackEvent("llm_cost_shared_open", { preset: p });
    setUrlReady(true);
  }, []);

  // 조건이 바뀔 때마다 주소에 반영 (새 기록을 쌓지 않음)
  useEffect(() => {
    if (!urlReady) return;
    const q = new URLSearchParams({ p: preset, d: perDay || 0, i: inTok || 0, o: outTok || 0 });
    if (cacheOn) { q.set("c", prefix); q.set("e", expiry); }
    if (hostScope === "us") q.set("h", "us");
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${q}`);
  }, [urlReady, preset, perDay, inTok, outTok, cacheOn, prefix, expiry, hostScope]);

  const buildHref = `/build?${new URLSearchParams({
    desc: BUILD_DESC[USE_CASES[preset].buildAs || preset][ko ? "ko" : "en"],
    mau: nearestMau(((perDay || 0) * 30) / USE_CASES[USE_CASES[preset].buildAs || preset].reqPerUser),
    from: "llm-cost",
  })}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("llm_cost_copy_link", { preset });
    } catch { /* 클립보드 권한이 없으면 주소창 복사로 대신한다 */ }
  };

  const applyPreset = (key) => {
    setPreset(key);
    setInTok(USE_CASES[key].inTok);
    setOutTok(USE_CASES[key].outTok);
    setPrefix(Math.round((USE_CASES[key].cache?.prefix || 0) * 100));
    setExpiry(Math.round((USE_CASES[key].cache?.expiry || 0) * 100));
    trackEvent("llm_cost_preset", { preset: key });
  };

  const rows = useMemo(() => {
    const monthlyReq = (perDay || 0) * 30;
    return PRICES.llms
      .filter((m) => hostScope === "all" || (m.region || "us") === "us")
      .map((m) => priceForPrompt(effectivePrice(m), inTok || 0))
      .map((m) => ({
        key: m.id,
        name: m.name,
        vendor: m.vendor,
        host: m.host,
        region: m.region || "us",
        tier: m.tier,
        price: `$${m.input} / $${m.output}`,
        cacheRead: m.cacheRead,
        offPeak: Boolean(m.offPeak),
        longContext: Boolean(m.longContext),
        note: m.note,
        monthly: (monthlyReq * (inTok || 0) / 1e6) * (cacheOn ? inputRate(m, prefix / 100, expiry / 100) : m.input) + (monthlyReq * (outTok || 0) / 1e6) * m.output,
      }))
      .sort((a, b) => a.monthly - b.monthly);
  }, [perDay, inTok, outTok, cacheOn, prefix, expiry, hostScope]);

  // 표 위 결론 한 줄: 전체 최저가(1% 이내 동률 포함), 균형·고가 등급 각각의 최저가. 품질 판단은 하지 않는다
  // 비혼잡 시간 요금처럼 조건이 붙은 가격은 결론 문장에도 그 조건을 함께 적는다 (표만 안 읽고 공유되는 경우 대비)
  const label = (r) => `${r.name}${r.host ? ` · ${r.vendor}` : ""} (${t.perMonth(usd(r.monthly))}${r.offPeak ? `, ${t.offPeak}` : ""})`;
  // 요청 수나 토큰이 0이면 모든 모델이 $0 이라 결론을 내지 않는다
  const hasCost = rows.length > 0 && rows[0].monthly > 0;
  const cheapest = hasCost ? rows.filter((r) => r.monthly <= rows[0].monthly * 1.01) : [];
  const bestOf = (tier) => rows.find((r) => r.tier === tier);
  const verdict = hasCost && bestOf("balanced") && bestOf("premium")
    ? t.verdict(cheapest.map(label).join(" · "), label(bestOf("balanced")), label(bestOf("premium")))
    : null;

  const columns = [
    { title: t.model, dataIndex: "name", render: (v, r) => <div><b>{v}</b><div style={{ fontSize: 12, color: "#888" }}>{r.vendor}{r.host ? ` · ${noteText(r.host, ko)}` : ""}{r.longContext ? ` · ${t.longTag}` : r.note ? ` · ${noteText(r.note, ko)}` : ""}</div></div> },
    { title: t.tier, dataIndex: "tier", render: (v) => <Tag color={TIER_COLOR[v]}>{t.tiers[v]}</Tag> },
    { title: t.price, dataIndex: "price", responsive: ["sm"], render: (v, r) => <div>{v}{r.cacheRead != null && <div style={{ fontSize: 12, color: "#888" }}>{t.cached} ${r.cacheRead}</div>}</div> },
    { title: t.monthly, dataIndex: "monthly", align: "right", render: (v) => <b>{usd(v)}</b> },
  ];

  const field = { fontSize: 13, color: "#555", marginBottom: 4 };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>{t.h1}</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>{t.sub}</p>

      <div style={field}>{t.preset}</div>
      <div style={{ overflowX: "auto" }}>
        <Segmented value={preset} onChange={applyPreset}
          options={Object.entries(USE_CASES).map(([k, v]) => ({ label: v.label[ko ? "ko" : "en"], value: k }))} />
      </div>
      {USE_CASES[preset].source && <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{noteText(USE_CASES[preset].source, ko)}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
        <div><div style={field}>{t.perDay}</div><InputNumber style={{ width: "100%" }} min={0} step={100} value={perDay} onChange={setPerDay} /></div>
        <div><div style={field}>{t.inTok}</div><InputNumber style={{ width: "100%" }} min={0} step={100} value={inTok} onChange={setInTok} /></div>
        <div><div style={field}>{t.outTok}</div><InputNumber style={{ width: "100%" }} min={0} step={100} value={outTok} onChange={setOutTok} /></div>
      </div>

      <div style={{ ...field, marginTop: 16 }}>{t.hostFilter}</div>
      <Segmented value={hostScope} onChange={(v) => { setHostScope(v); trackEvent("llm_cost_host", { scope: v }); }}
        options={[{ label: t.hostAll, value: "all" }, { label: t.hostUs, value: "us" }]} />

      {(inTok || 0) > 100000 && <p style={{ fontSize: 12, color: "#b45309", marginTop: 8 }}>{t.longCtx}</p>}

      <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>{t.monthlyReq((perDay || 0) * 30, perDay || 0)}</p>

      {cacheOn && (
        <div style={{ marginTop: 16, padding: "14px 16px 6px", borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t.cacheTitle}</div>
          <div style={field}>{t.prefix}: <b>{prefix}%</b></div>
          <Slider min={0} max={100} step={10} value={prefix} onChange={setPrefix}
            onChangeComplete={(v) => trackEvent("llm_cost_cache", { preset, prefix: v, expiry })}
            tooltip={{ formatter: (v) => `${v}%` }} />
          <div style={field}>{t.expiry}: <b>{expiry}%</b></div>
          <Slider min={0} max={100} step={10} value={expiry} onChange={setExpiry}
            onChangeComplete={(v) => trackEvent("llm_cost_cache", { preset, prefix, expiry: v })}
            tooltip={{ formatter: (v) => `${v}%` }} />
          <p style={{ fontSize: 12, color: "#888" }}>{t.cacheNote}</p>
        </div>
      )}

      {rows.length > 1 && rows[0].monthly > 0 && (
        <p style={{ marginTop: 8, fontWeight: 600 }}>{t.spread(Math.round(rows[rows.length - 1].monthly / rows[0].monthly))}</p>
      )}

      {verdict && (
        <div style={{ marginTop: 16, padding: "16px 18px", borderRadius: 12, background: "#f5f3ff", border: "1px solid #e4e0ff" }}>
          <div style={{ fontWeight: 600, lineHeight: 1.5 }}>{verdict}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Link to={buildHref} onClick={() => trackEvent("funnel_to_goleu", { from: "llm-cost-verdict", preset })}>
              <Button type="primary">{t.toBuild}</Button>
            </Link>
            <Button onClick={copyLink}>{copied ? t.copied : t.copy}</Button>
          </div>
        </div>
      )}

      <Table style={{ marginTop: 16 }} size="middle" pagination={false} columns={columns} dataSource={rows} />

      <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>{t.note(PRICES.asOf)}</p>
      <p style={{ fontSize: 12, color: "#888" }}>{t.tierNote}</p>
      <p style={{ fontSize: 12, color: "#888" }}>{t.hostNote}</p>

      <div style={{ marginTop: 32, padding: 24, borderRadius: 12, background: "#f5f3ff" }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{t.ctaTitle}</div>
        <p style={{ color: "#555", margin: "6px 0 14px" }}>{t.ctaDesc}</p>
        <Link to={buildHref} onClick={() => trackEvent("funnel_to_goleu", { from: "llm-cost", preset })} style={{ fontWeight: 700 }}>{t.cta}</Link>
      </div>
    </div>
  );
}
