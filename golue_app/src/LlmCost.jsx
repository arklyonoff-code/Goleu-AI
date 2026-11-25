// LLM API 월 비용 계산기 (/llm-cost): 작업(요청) 수 × 토큰 × 캐시 → 모델별 월 비용.
// 계산은 src/lib/ai-stack.js 의 taskCost 한 곳에서 한다. 가격도 그 파일에만 둔다.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Collapse, InputNumber, Segmented, Slider, Table, Tag } from "antd";
import { PRICES, USE_CASES, effectivePrice, taskCost } from "./lib/ai-stack.js";
import { useLanguage } from "./lib/LanguageContext";
import { trackEvent } from "./lib/analytics";
import Waitlist from "./components/Waitlist";

const T = {
  ko: {
    h1: "LLM API 월 비용 계산기",
    sub: "용도를 고르면 캐시까지 반영한 주요 모델의 월 비용을 한 번에 비교합니다. 세부 값은 고급 설정에서 바꿀 수 있어요.",
    preset: "용도 프리셋", perDayReq: "하루 요청 수", perDayTask: "하루 작업 수",
    model: "모델", tier: "등급", price: "가격 (입력/출력, 1M 토큰)", monthly: "월 비용",
    perReq: "요청당", perTask: "작업당", cacheShareCol: "캐시 비중",
    tiers: { economy: "저가", balanced: "균형", premium: "고가" },
    advanced: "고급 설정 (토큰 · 캐시)",
    turns: "작업당 턴(요청) 수", start: "시작 컨텍스트 (매 요청 앞의 시스템 프롬프트·도구 정의)", perTurn: "턴당 새 입력 (사용자 메시지·도구 결과·검색 문서)",
    hit: "캐시 적중률 (이미 보낸 부분이 캐시에서 읽히는 비율)", out: "턴당 출력 토큰",
    summaryReq: (inp, g, d) => `요청당 입력 ${inp.toLocaleString()} 토큰 (그중 새 입력 ${g.toLocaleString()}) · 하루 ${d.toLocaleString()}건 = 월 ${(d * 30).toLocaleString()}건 · 예: 사용자 ${d.toLocaleString()}명이 하루 1번씩`,
    summaryTask: (n, g, avg, req) => `작업 1건 = ${n.toLocaleString()}턴 · 턴당 새 입력 ${g.toLocaleString()} 토큰 · 요청당 평균 입력 ${avg.toLocaleString()} 토큰 → 하루 요청 ${req.toLocaleString()}건`,
    cacheNote: "이미 보낸 부분은 적중률만큼 캐시 읽기 단가, 나머지는 캐시 쓰기 단가로 계산해요. 여러 턴 작업의 새 입력은 다음 턴에 다시 쓰이므로 캐시 쓰기 단가, 1턴 작업의 새 입력은 입력 단가예요. 쓰기 할증이 없는 제공자는 입력 단가로, 적중률 0은 캐시를 쓰지 않는 것으로 계산해요. 기본값은 가정이에요.",
    noCache: "캐시 없음", cachedRead: "캐시 읽기",
    hostFilter: "제공처", hostAll: "전체", hostUs: "미국 업체·미국 리전만",
    hostNote: "같은 오픈 웨이트 모델도 중국 업체 공식 API와 미국 호스팅(Together AI)의 가격이 다를 수 있어 나눠서 보여줍니다. 공식 API의 실제 처리 위치는 확인하지 않았습니다.",
    verdict: (c, b, p) => `이 조건에서 가장 싼 선택은 ${c}예요. 균형 등급 최저가는 ${b}, 고가 등급 최저가는 ${p}예요.`,
    perMonth: (v) => `월 ${v}`, offPeak: "비혼잡 시간",
    toBuild: "이 조건으로 전체 스택 보기 →", copy: "이 조건 링크 복사", copied: "복사했어요",
    resTitle: "데이터를 미국에서 처리하면 얼마 더 드나",
    resModel: "모델", resOfficial: "공식 API", resUs: "미국 처리", resPremium: "추가 비용",
    resSameRegion: "공식 API가 미국 리전 제공", resNote: "같은 모델을 중국 업체 공식 API와 미국 호스팅(Together AI)으로 썼을 때의 월 비용 차이입니다. 지금 입력한 조건 기준이며, 공식 API의 실제 처리 위치는 확인하지 않았습니다.",
    longCtx: "입력 10만 토큰 초과: Claude Haiku 5.5는 장문 요금으로 계산했습니다. 다른 모델의 장문 구간 요금(예: GPT-6.1 Terra 27.2만 토큰 초과)은 아직 반영하지 않았습니다.", longTag: "장문 요금",
    spread: (x) => `지금 조건에서 가장 비싼 모델은 가장 싼 모델의 ${x}배`,
    note: (d) => `가격 기준일 ${d} · 각 사의 공식 가격 페이지 기준 표준 요금 · Gemini 캐시 저장료·배치 할인 미반영 · 한 달은 30일로 계산`,
    tierNote: "등급은 같은 회사 안의 가격 순서이며 품질 평가가 아닙니다.",
    ctaTitle: "모델만 정하면 끝이 아닙니다",
    ctaDesc: "벡터DB·프레임워크·배포까지 포함한 전체 스택과 월 비용을 받아 보세요.",
    cta: "내 AI 앱 전체 스택 추천받기 →",
  },
  en: {
    h1: "LLM API monthly cost calculator",
    sub: "Pick a use case to compare the monthly cost of major models, caching included. Fine-tune the details under Advanced.",
    preset: "Preset", perDayReq: "Requests per day", perDayTask: "Tasks per day",
    model: "Model", tier: "Tier", price: "Price (in/out per 1M tokens)", monthly: "Monthly cost",
    perReq: "Per request", perTask: "Per task", cacheShareCol: "Cache share",
    tiers: { economy: "Economy", balanced: "Balanced", premium: "Premium" },
    advanced: "Advanced (tokens · caching)",
    turns: "Turns (requests) per task", start: "Starting context (system prompt, tool definitions sent every request)", perTurn: "New input per turn (user message, tool results, retrieved docs)",
    hit: "Cache hit rate (share of already-sent context read from cache)", out: "Output tokens per turn",
    summaryReq: (inp, g, d) => `${inp.toLocaleString()} input tokens per request (${g.toLocaleString()} new) · ${d.toLocaleString()}/day = ${(d * 30).toLocaleString()}/month · e.g. ${d.toLocaleString()} users, once a day each`,
    summaryTask: (n, g, avg, req) => `1 task = ${n.toLocaleString()} turns · ${g.toLocaleString()} new input tokens per turn · ${avg.toLocaleString()} avg input per request → ${req.toLocaleString()} requests/day`,
    cacheNote: "Already-sent context is billed at the cache-read rate for the hit share and at the cache-write rate for the rest. New input in multi-turn tasks is re-sent next turn, so it's billed as a cache write; in single-turn tasks it's billed as normal input. Providers without a write premium use the input rate, and a 0% hit rate means no caching. Defaults are assumptions.",
    noCache: "no caching", cachedRead: "cache read",
    hostFilter: "Provider", hostAll: "All", hostUs: "US companies / US regions only",
    hostNote: "Open-weight models are listed twice: the vendor's official API and a US host (Together AI), since prices can differ. We haven't verified where the official APIs process data.",
    verdict: (c, b, p) => `Cheapest at these settings: ${c}. Cheapest balanced-tier: ${b}. Cheapest premium-tier: ${p}.`,
    perMonth: (v) => `${v}/mo`, offPeak: "off-peak",
    toBuild: "See the full stack for these settings →", copy: "Copy link to these settings", copied: "Copied",
    resTitle: "What does keeping data in the US cost?",
    resModel: "Model", resOfficial: "Official API", resUs: "US path", resPremium: "Premium",
    resSameRegion: "official API offers a US region", resNote: "Monthly cost of the same model via the vendor's official API vs a US host (Together AI), at your current settings. We haven't verified where the official APIs process data.",
    longCtx: "Over 100K input tokens: Claude Haiku 5.5 is priced at its long-context rate. Long-context tiers for other models (e.g. GPT-6.1 Terra above 272K) are not applied yet.", longTag: "long-context rate",
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
  const [calc, setCalc] = useState(USE_CASES.chat.calc);
  const [hostScope, setHostScope] = useState("all");
  const [urlReady, setUrlReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (k) => (v) => setCalc((c) => ({ ...c, [k]: v ?? 0 }));
  const multiTurn = (calc.turns || 1) > 1;
  const requestsPerDay = Math.round((calc.tasksPerDay || 0) * (calc.turns || 1));

  // 공유 링크(?p=&d=&n=&s=&g=&c=&o=&h=)로 들어오면 그 조건을 복원한다. 프리렌더 HTML과 어긋나지 않게 마운트 후에 읽는다
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get("p");
    const base = p && USE_CASES[p] ? USE_CASES[p].calc : USE_CASES.chat.calc;
    if (p && USE_CASES[p]) setPreset(p);
    const d = intParam(q, "d", 1e9), n = intParam(q, "n", 10000), st = intParam(q, "s", 2e6), g = intParam(q, "g", 2e6), c = intParam(q, "c", 100), o = intParam(q, "o", 2e6);
    setCalc({
      tasksPerDay: d ?? base.tasksPerDay, turns: n ?? base.turns, start: st ?? base.start,
      perTurn: g ?? base.perTurn, hit: c != null ? c / 100 : base.hit, out: o ?? base.out,
    });
    if (q.get("h") === "us") setHostScope("us");
    if (p) trackEvent("llm_cost_shared_open", { preset: p });
    setUrlReady(true);
  }, []);

  // 조건이 바뀔 때마다 주소에 반영 (새 기록을 쌓지 않음)
  useEffect(() => {
    if (!urlReady) return;
    const q = new URLSearchParams({
      p: preset, d: calc.tasksPerDay || 0, n: calc.turns || 1, s: calc.start || 0,
      g: calc.perTurn || 0, c: Math.round((calc.hit || 0) * 100), o: calc.out || 0,
    });
    if (hostScope === "us") q.set("h", "us");
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${q}`);
  }, [urlReady, preset, calc, hostScope]);

  const buildAs = USE_CASES[preset].buildAs || preset;
  const buildHref = `/build?${new URLSearchParams({
    desc: BUILD_DESC[buildAs][ko ? "ko" : "en"],
    mau: nearestMau((requestsPerDay * 30) / USE_CASES[buildAs].reqPerUser),
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
    setCalc(USE_CASES[key].calc);
    trackEvent("llm_cost_preset", { preset: key });
  };

  // 필터 전 전체 행: 본 표와 "미국 처리 추가 비용" 표가 같은 계산을 쓴다
  const allRows = useMemo(() => {
    const perMonth = (calc.tasksPerDay || 0) * 30;
    return PRICES.llms
      .map((m) => effectivePrice(m))
      .map((m) => {
        const c = taskCost(m, calc);
        return {
          key: m.id,
          name: m.name,
          vendor: m.vendor,
          host: m.host,
          region: m.region || "us",
          tier: m.tier,
          price: `$${m.input} / $${m.output}`,
          cacheRead: m.cacheRead,
          offPeak: Boolean(m.offPeak),
          longContext: c.longContext,
          usRegionOfficial: Boolean(m.usRegionOfficial),
          note: m.note,
          unit: c.total,
          cacheShare: c.cacheShare,
          avgInput: c.avgInput,
          maxInput: c.maxInput,
          monthly: c.total * perMonth,
        };
      })
      .sort((a, b) => a.monthly - b.monthly);
  }, [calc]);
  const rows = allRows.filter((r) => hostScope === "all" || r.region === "us");
  const avgInput = Math.round(allRows[0]?.avgInput || 0);
  const maxInput = allRows[0]?.maxInput || 0;

  // 같은 모델의 공식(중국 업체) 경로와 미국 경로를 한 줄로 묶어 추가 비용(%)을 보여준다
  const residency = PRICES.llms
    .filter((m) => m.region === "cn" || m.usRegionOfficial)
    .map((m) => m.name)
    .filter((name, i, a) => a.indexOf(name) === i)
    .map((name) => {
      const cn = allRows.find((r) => r.name === name && r.region === "cn");
      const us = allRows.find((r) => r.name === name && r.region === "us");
      const premium = cn && us && cn.monthly > 0 ? Math.round((us.monthly / cn.monthly - 1) * 100) : us?.usRegionOfficial ? 0 : null;
      return { key: name, name, cn, us, premium };
    });

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
    { title: t.tier, dataIndex: "tier", responsive: ["md"], render: (v) => <Tag color={TIER_COLOR[v]}>{t.tiers[v]}</Tag> },
    { title: t.price, dataIndex: "price", responsive: ["lg"], render: (v, r) => <div>{v}<div style={{ fontSize: 12, color: "#888" }}>{r.cacheRead != null ? `${t.cachedRead} $${r.cacheRead}` : t.noCache}</div></div> },
    { title: multiTurn ? t.perTask : t.perReq, dataIndex: "unit", align: "right", responsive: ["sm"], render: (v) => usd(v) },
    { title: t.cacheShareCol, dataIndex: "cacheShare", align: "right", responsive: ["sm"], render: (v) => (v > 0 ? `${Math.round(v * 100)}%` : "—") },
    { title: t.monthly, dataIndex: "monthly", align: "right", render: (v) => <b>{usd(v)}</b> },
  ];

  const field = { fontSize: 13, color: "#555", marginBottom: 4 };
  const num = (k, lbl, step) => (
    <div key={k}><div style={field}>{lbl}</div>
      <InputNumber style={{ width: "100%" }} min={k === "turns" ? 1 : 0} step={step} value={calc[k]} onChange={set(k)} /></div>
  );

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
        {num("tasksPerDay", multiTurn ? t.perDayTask : t.perDayReq, multiTurn ? 1 : 100)}
        <div>
          <div style={field}>{t.hostFilter}</div>
          <Segmented value={hostScope} onChange={(v) => { setHostScope(v); trackEvent("llm_cost_host", { scope: v }); }}
            options={[{ label: t.hostAll, value: "all" }, { label: t.hostUs, value: "us" }]} />
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
        {multiTurn
          ? t.summaryTask(calc.turns || 1, calc.perTurn || 0, avgInput, requestsPerDay)
          : t.summaryReq((calc.start || 0) + (calc.perTurn || 0), calc.perTurn || 0, calc.tasksPerDay || 0)}
      </p>

      <Collapse size="small" style={{ marginTop: 8 }} onChange={(k) => k.length && trackEvent("llm_cost_advanced_open", { preset })} items={[{
        key: "adv",
        label: t.advanced,
        children: (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {num("turns", t.turns, 1)}
              {num("start", t.start, 500)}
              {num("perTurn", t.perTurn, 100)}
              {num("out", t.out, 100)}
            </div>
            <div style={{ ...field, marginTop: 12 }}>{t.hit}: <b>{Math.round((calc.hit || 0) * 100)}%</b></div>
            <Slider min={0} max={100} step={1} value={Math.round((calc.hit || 0) * 100)} onChange={(v) => set("hit")(v / 100)}
              onChangeComplete={(v) => trackEvent("llm_cost_cache", { preset, hit: v })}
              tooltip={{ formatter: (v) => `${v}%` }} />
            <p style={{ fontSize: 12, color: "#888" }}>{t.cacheNote}</p>
          </div>
        ),
      }]} />

      {maxInput > 100000 && <p style={{ fontSize: 12, color: "#b45309", marginTop: 8 }}>{t.longCtx}</p>}

      {rows.length > 1 && rows[0].monthly > 0 && (
        <p style={{ marginTop: 12, fontWeight: 600 }}>{t.spread(Math.round(rows[rows.length - 1].monthly / rows[0].monthly))}</p>
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

      {hasCost && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t.resTitle}</div>
          <Table size="small" pagination={false} dataSource={residency} columns={[
            { title: t.resModel, dataIndex: "name", render: (v) => <b>{v}</b> },
            { title: t.resOfficial, dataIndex: "cn", align: "right", render: (v, r) => v ? `${usd(v.monthly)}${v.offPeak ? ` (${t.offPeak})` : ""}` : (r.us?.usRegionOfficial ? t.resSameRegion : "—") },
            { title: t.resUs, dataIndex: "us", align: "right", render: (v) => v ? usd(v.monthly) : "—" },
            { title: t.resPremium, dataIndex: "premium", align: "right", render: (v) => v == null ? "—" : <b style={{ color: v > 0 ? "#b45309" : "#15803d" }}>{v > 0 ? `+${v}%` : `${v}%`}</b> },
          ]} />
          <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{t.resNote}</p>
        </div>
      )}

      <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>{t.note(PRICES.asOf)}</p>
      <p style={{ fontSize: 12, color: "#888" }}>{t.tierNote}</p>
      <p style={{ fontSize: 12, color: "#888" }}>{t.hostNote}</p>

      <Waitlist from="llm-cost" />

      <div style={{ marginTop: 32, padding: 24, borderRadius: 12, background: "#f5f3ff" }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{t.ctaTitle}</div>
        <p style={{ color: "#555", margin: "6px 0 14px" }}>{t.ctaDesc}</p>
        <Link to={buildHref} onClick={() => trackEvent("funnel_to_goleu", { from: "llm-cost", preset })} style={{ fontWeight: 700 }}>{t.cta}</Link>
      </div>
    </div>
  );
}
