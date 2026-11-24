// 출시 알림 대기자 등록 (유료 기능 수요 테스트). Worker /waitlist 로 이메일을 보낸다.
import { useState } from "react";
import { Alert, Button, Checkbox, Input } from "antd";
import { useLanguage } from "../lib/LanguageContext";
import { trackEvent } from "../lib/analytics";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
function workerBase() {
  const configured = WORKER_URL?.trim();
  if (configured && !configured.includes("YOUR-ACCOUNT")) return configured.replace(/\/$/, "");
  if (!import.meta.env.PROD) return "http://localhost:8787";
  return null;
}

const T = {
  ko: {
    title: "가격이 바뀌면 알려드릴까요?",
    desc: "모델 가격은 자주 바뀌어요. 할인 종료, 혼잡 시간 요금, 새 모델 출시 같은 변화가 생기면 이메일로 알려드려요.",
    priceAlert: "가격 변동 알림 (준비 중이에요. 시작하면 첫 메일로 알려드려요)",
    teamReport: "팀용 비용 · 데이터 위치 리포트에도 관심 있어요 (출시 예정)",
    placeholder: "you@example.com",
    consent: "알림 발송에만 이메일을 사용하는 데 동의해요. 수집 항목: 이메일 · 보관: 알림 서비스 종료 또는 삭제 요청 시까지",
    submit: "알림 받기",
    done: "등록됐어요. 알림을 시작하면 이 이메일로 먼저 알려드릴게요.",
    invalid: "이메일 주소를 확인해 주세요.",
    needConsent: "이메일 사용 동의가 필요해요.",
    needInterest: "받고 싶은 항목을 하나 이상 골라 주세요.",
    error: "등록하지 못했어요. 잠시 후 다시 시도해 주세요.",
  },
  en: {
    title: "Want a heads-up when prices change?",
    desc: "Model prices change often: promos ending, peak-hour rates, new models. Leave your email and we'll tell you when it matters.",
    priceAlert: "Price change alerts (coming soon; your first email will be the launch)",
    teamReport: "I'm also interested in a team cost & data-residency report (planned)",
    placeholder: "you@example.com",
    consent: "I agree to my email being used only for these alerts. Collected: email · Kept until the alerts end or I ask for deletion",
    submit: "Notify me",
    done: "You're on the list. We'll email you first when alerts go live.",
    invalid: "Please check your email address.",
    needConsent: "Please agree to the email use first.",
    needInterest: "Pick at least one option.",
    error: "Couldn't sign you up. Please try again in a moment.",
  },
};

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export default function Waitlist({ from }) {
  const { lang } = useLanguage();
  const ko = lang === "ko";
  const t = T[ko ? "ko" : "en"];
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState(["price_alert"]);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState({ status: "idle", msg: "" });

  async function submit() {
    if (!EMAIL_RE.test(email.trim())) return setState({ status: "error", msg: t.invalid });
    if (!interests.length) return setState({ status: "error", msg: t.needInterest });
    if (!consent) return setState({ status: "error", msg: t.needConsent });
    const base = workerBase();
    if (!base) return setState({ status: "error", msg: t.error });
    setState({ status: "loading", msg: "" });
    try {
      const res = await fetch(`${base}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), interests, consent: true, lang: ko ? "ko" : "en", from }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState({ status: "done", msg: t.done });
      trackEvent("waitlist_submit", { from, interests: interests.join(",") });
    } catch {
      setState({ status: "error", msg: t.error });
    }
  }

  return (
    <div style={{ marginTop: 32, padding: 24, borderRadius: 12, border: "1px solid #e4e0ff" }}>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{t.title}</div>
      <p style={{ color: "#555", margin: "6px 0 12px" }}>{t.desc}</p>
      {state.status === "done" ? (
        <Alert type="success" showIcon message={state.msg} />
      ) : (
        <>
          <Checkbox.Group value={interests} onChange={setInterests} style={{ display: "flex", flexDirection: "column", gap: 6 }}
            options={[{ label: t.priceAlert, value: "price_alert" }, { label: t.teamReport, value: "team_report" }]} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Input type="email" style={{ flex: "1 1 220px" }} placeholder={t.placeholder} value={email} onChange={(e) => setEmail(e.target.value)} onPressEnter={submit} />
            <Button type="primary" loading={state.status === "loading"} onClick={submit}>{t.submit}</Button>
          </div>
          <Checkbox style={{ marginTop: 10, fontSize: 12, color: "#666" }} checked={consent} onChange={(e) => setConsent(e.target.checked)}>{t.consent}</Checkbox>
          {state.status === "error" && <Alert style={{ marginTop: 10 }} type="error" showIcon message={state.msg} />}
        </>
      )}
    </div>
  );
}
