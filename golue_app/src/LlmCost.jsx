// LLM API 월 비용 계산기 (/llm-cost): 요청 수 × 토큰 → 모델별 월 비용. 가격은 src/lib/ai-stack.js 한 곳에서 가져온다.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { InputNumber, Segmented, Table, Tag } from "antd";
import { PRICES, USE_CASES, effectivePrice } from "./lib/ai-stack.js";
import { useLanguage } from "./lib/LanguageContext";
import { trackEvent } from "./lib/analytics";

const T = {
  ko: {
    h1: "LLM API 월 비용 계산기",
    sub: "하루 요청 수와 요청당 토큰을 넣으면 주요 모델의 월 비용을 한 번에 비교합니다.",
    preset: "용도 프리셋", perDay: "하루 요청 수", inTok: "요청당 입력 토큰", outTok: "요청당 출력 토큰",
    model: "모델", tier: "등급", price: "가격 (입력/출력, 1M 토큰)", monthly: "월 비용",
    tiers: { economy: "저가", balanced: "균형", premium: "고가" },
    note: (d) => `가격 기준일 ${d} · 각 사의 공식 가격 페이지 기준(표준 요금, 캐시·배치 할인 미반영) · 한 달은 30일로 계산`,
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
    note: (d) => `Prices as of ${d} · official list prices (no caching or batch discounts) · 30-day month`,
    tierNote: "Tiers reflect price order within each provider, not a quality rating.",
    ctaTitle: "Picking a model is only step one",
    ctaDesc: "Get the full stack — vector DB, framework, hosting — with a monthly cost.",
    cta: "Recommend my full AI stack →",
  },
};

const TIER_COLOR = { economy: "green", balanced: "blue", premium: "purple" };
const usd = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: n < 10 ? 2 : 0 })}`;

export default function LlmCost() {
  const { lang } = useLanguage();
  const ko = lang === "ko";
  const t = T[ko ? "ko" : "en"];
  const [preset, setPreset] = useState("chat");
  const [perDay, setPerDay] = useState(1000);
  const [inTok, setInTok] = useState(USE_CASES.chat.inTok);
  const [outTok, setOutTok] = useState(USE_CASES.chat.outTok);

  const applyPreset = (key) => {
    setPreset(key);
    setInTok(USE_CASES[key].inTok);
    setOutTok(USE_CASES[key].outTok);
    trackEvent("llm_cost_preset", { preset: key });
  };

  const rows = useMemo(() => {
    const monthlyReq = (perDay || 0) * 30;
    return PRICES.llms
      .map((m) => effectivePrice(m))
      .map((m) => ({
        key: m.id,
        name: m.name,
        vendor: m.vendor,
        tier: m.tier,
        price: `$${m.input} / $${m.output}`,
        note: m.note,
        monthly: (monthlyReq * (inTok || 0) / 1e6) * m.input + (monthlyReq * (outTok || 0) / 1e6) * m.output,
      }))
      .sort((a, b) => a.monthly - b.monthly);
  }, [perDay, inTok, outTok]);

  const columns = [
    { title: t.model, dataIndex: "name", render: (v, r) => <div><b>{v}</b><div style={{ fontSize: 12, color: "#888" }}>{r.vendor}{r.note ? ` · ${r.note}` : ""}</div></div> },
    { title: t.tier, dataIndex: "tier", render: (v) => <Tag color={TIER_COLOR[v]}>{t.tiers[v]}</Tag> },
    { title: t.price, dataIndex: "price", responsive: ["sm"] },
    { title: t.monthly, dataIndex: "monthly", align: "right", render: (v) => <b>{usd(v)}</b> },
  ];

  const field = { fontSize: 13, color: "#555", marginBottom: 4 };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>{t.h1}</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>{t.sub}</p>

      <div style={field}>{t.preset}</div>
      <Segmented block value={preset} onChange={applyPreset}
        options={Object.entries(USE_CASES).map(([k, v]) => ({ label: v.label[ko ? "ko" : "en"], value: k }))} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 16 }}>
        <div><div style={field}>{t.perDay}</div><InputNumber style={{ width: "100%" }} min={0} step={100} value={perDay} onChange={setPerDay} /></div>
        <div><div style={field}>{t.inTok}</div><InputNumber style={{ width: "100%" }} min={0} step={100} value={inTok} onChange={setInTok} /></div>
        <div><div style={field}>{t.outTok}</div><InputNumber style={{ width: "100%" }} min={0} step={100} value={outTok} onChange={setOutTok} /></div>
      </div>

      <Table style={{ marginTop: 24 }} size="middle" pagination={false} columns={columns} dataSource={rows} />

      <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>{t.note(PRICES.asOf)}</p>
      <p style={{ fontSize: 12, color: "#888" }}>{t.tierNote}</p>

      <div style={{ marginTop: 32, padding: 24, borderRadius: 12, background: "#f5f3ff" }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{t.ctaTitle}</div>
        <p style={{ color: "#555", margin: "6px 0 14px" }}>{t.ctaDesc}</p>
        <Link to="/build" onClick={() => trackEvent("funnel_to_goleu", { from: "llm-cost" })} style={{ fontWeight: 700 }}>{t.cta}</Link>
      </div>
    </div>
  );
}
