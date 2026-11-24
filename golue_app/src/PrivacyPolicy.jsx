// 개인정보처리방침 (/privacy). 한국어·영어 두 버전을 같은 구조로 둔다.
// 내용을 바꿀 때는 두 언어를 함께 고치고 LAST_UPDATED 를 갱신한다.
import { useNavigate } from "react-router-dom";
import { Button, Layout, Segmented } from "antd";
import { MaterialIcon } from "./components/MaterialIcon";
import { useLanguage } from "./lib/LanguageContext";

const { Content } = Layout;

const SERVICE_NAME = "Goleu AI";
const CONTACT_EMAIL = "arkly.onoff@gmail.com";
const LINK = { color: "#6366f1" };
const ext = (href, label) => <a href={href} target="_blank" rel="noopener noreferrer" style={LINK}>{label}</a>;

const CONTENT = {
  ko: {
    title: "개인정보처리방침",
    updated: "최종 업데이트: 2026년 11월 24일",
    back: "돌아가기",
    terms: "이용약관 보기",
    start: "서비스 시작하기 →",
    sections: [
      {
        h: "1. 수집하는 정보",
        p: [`${SERVICE_NAME}은 서비스 제공과 개선을 위해 다음 정보를 수집합니다.`],
        li: [
          [<b key="b">익명 사용 데이터</b>, ": 페이지 방문, 퀴즈 단계 진행, 버튼 클릭 등의 행동 데이터. Google Analytics 4(GA4)를 통해 수집하며, 모든 데이터는 익명화됩니다."],
          [<b key="b">퀴즈 입력값</b>, ": 팀 구성, 사용 툴, 예산 등 입력한 값은 추천 생성에만 사용되며, 사용자 기기의 브라우저 저장소(localStorage)에만 보관됩니다."],
          [<b key="b">결과 저장 시</b>, ": \"내 결과 저장하기\"를 클릭하면 입력값과 추천 결과가 Cloudflare KV에 30일간 저장됩니다. 이름, 이메일 등 개인 식별 정보는 포함되지 않습니다."],
          [<b key="b">AI 스택 추천 · LLM 비용 계산기 입력값</b>, ": 앱 설명 한 줄, 사용자 수, 요청 수, 토큰 수 등은 추천과 계산에만 쓰이며 서버에 저장하지 않습니다. 계산기 조건은 공유를 위해 페이지 주소(URL)에 담깁니다."],
          [<b key="b">출시 알림 신청 시 (선택)</b>, ": \"가격이 바뀌면 알려드릴까요?\"에서 직접 입력하고 동의한 이메일 주소와 선택한 관심 항목, 화면 언어, 신청 위치, 신청 일시를 수집합니다. 남용 방지를 위해 신청 요청의 IP 주소를 하루 동안 횟수 집계에만 사용하며, 이메일과 함께 저장하지 않습니다."],
        ],
        after: ["출시 알림을 신청하지 않는 한 이메일 주소, 이름, 전화번호 등 개인 식별 정보는 수집하지 않습니다."],
      },
      {
        h: "2. 수집 정보 사용 목적",
        li: [
          ["규칙 기반 AI 스택 추천과 LLM 비용 계산"],
          ["출시 알림 신청자에게 가격 변동 알림 서비스 시작 안내 및 알림 발송 (이메일)"],
          ["서비스 사용 통계 분석 및 품질 개선"],
          ["퀴즈 완료 후 동일 기기에서 결과 복원"],
        ],
      },
      {
        h: "3. 제3자 서비스",
        p: ["서비스 운영을 위해 다음 제3자 서비스를 이용합니다."],
        li: [
          [<b key="b">Google Analytics 4</b>, ": 익명 사용 통계 수집. 사용자 동의 후 활성화됩니다. (", ext("https://policies.google.com/privacy", "Google 개인정보처리방침"), ")"],
          [<b key="b">Vercel Web Analytics</b>, ": 쿠키 없이 페이지 방문 수와 유입 경로를 집계합니다. (", ext("https://vercel.com/legal/privacy-policy", "Vercel 개인정보처리방침"), ")"],
          [<b key="b">Cloudflare Workers / KV</b>, ": API 처리, 규칙 기반 추천 생성, 결과 저장, 출시 알림 이메일 보관 인프라. 외부 AI API를 호출하지 않습니다. (", ext("https://www.cloudflare.com/privacypolicy/", "Cloudflare 개인정보처리방침"), ")"],
        ],
      },
      {
        h: "4. 개인정보의 국외 이전",
        p: ["출시 알림 신청 시 입력한 이메일은 아래와 같이 국외에서 보관됩니다."],
        li: [
          [<b key="b">이전받는 자</b>, ": Cloudflare, Inc. (미국)"],
          [<b key="b">이전 항목</b>, ": 이메일 주소, 관심 항목, 화면 언어, 신청 위치, 신청 일시"],
          [<b key="b">이전 일시 및 방법</b>, ": 신청 시점에 네트워크를 통해 전송"],
          [<b key="b">이용 목적 및 보관 기간</b>, ": 출시 알림 발송을 위한 저장, 알림 서비스 종료 또는 삭제 요청 시까지"],
        ],
        after: ["국외 이전을 원하지 않으면 출시 알림을 신청하지 않으면 되며, 서비스의 다른 기능 이용에는 영향이 없습니다."],
      },
      {
        h: "5. 쿠키 및 로컬 저장소",
        p: ["서비스는 다음 목적으로 브라우저 저장소를 사용합니다."],
        li: [
          [<b key="b">분석 동의 여부</b>, ": 쿠키 동의 선택을 기억합니다."],
          [<b key="b">익명 세션 ID</b>, ": 분석 집계를 위한 무작위 식별자. 개인을 특정할 수 없습니다."],
          [<b key="b">퀴즈 입력값</b>, ": 페이지 새로고침 시 입력값을 복원하기 위해 임시 저장합니다."],
          [<b key="b">언어 · 테마 설정</b>, ": 화면 언어와 라이트/다크 모드 선택을 유지합니다."],
          [<b key="b">Vercel Web Analytics</b>, ": 쿠키를 사용하지 않습니다."],
        ],
        after: ["브라우저 설정에서 언제든지 저장된 데이터를 삭제할 수 있습니다."],
      },
      {
        h: "6. 데이터 보관 기간",
        li: [
          [<b key="b">localStorage 데이터</b>, ": 브라우저를 통해 언제든지 삭제 가능"],
          [<b key="b">저장된 결과 (KV)</b>, ": 생성 후 30일, 이후 자동 만료"],
          [<b key="b">GA4 데이터</b>, ": Google Analytics 기본 보관 정책(14개월) 적용"],
          [<b key="b">출시 알림 이메일 (KV)</b>, ": 알림 서비스 종료 또는 삭제 요청 시까지. 요청을 받으면 지체 없이 삭제합니다."],
        ],
      },
      {
        h: "7. 사용자 권리",
        p: [
          "사용자는 언제든지 쿠키 배너의 \"거부\" 버튼 또는 브라우저 설정을 통해 분석 데이터 수집을 거부할 수 있습니다. 결과 저장 기능은 선택 사항이며, 사용하지 않아도 서비스 이용에 제한이 없습니다.",
          "출시 알림을 신청한 경우 아래 문의처로 이메일 주소의 열람, 정정, 삭제, 처리 정지를 요청할 수 있으며, 동의는 언제든지 철회할 수 있습니다. 발송되는 알림 메일에도 수신 거부 방법을 안내합니다.",
        ],
      },
      { h: "8. 미성년자 보호", p: ["본 서비스는 만 14세 미만을 대상으로 하지 않으며, 해당 연령대의 정보를 의도적으로 수집하지 않습니다."] },
      { h: "9. 방침 변경", p: ["본 방침이 변경될 경우 이 페이지에 공지하며, 중요한 변경 사항은 서비스 내 공지를 통해 안내합니다."] },
      {
        h: "10. 개인정보 보호책임자 및 문의",
        p: [[`개인정보 보호책임자: ${SERVICE_NAME} 운영자. 개인정보 처리에 관한 문의와 삭제 요청은 `, <a key="m" href={`mailto:${CONTACT_EMAIL}`} style={LINK}>{CONTACT_EMAIL}</a>, "로 연락해 주세요."]],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: November 24, 2026",
    back: "Back",
    terms: "Terms of Service",
    start: "Get started →",
    sections: [
      {
        h: "1. Information we collect",
        p: [`${SERVICE_NAME} collects the following to provide and improve the service.`],
        li: [
          [<b key="b">Anonymous usage data</b>, ": page visits, quiz progress and button clicks, collected through Google Analytics 4 (GA4). All of it is anonymized."],
          [<b key="b">Quiz inputs</b>, ": team makeup, current tools, budget and similar inputs are used only to generate a recommendation and are kept only in your browser's local storage."],
          [<b key="b">Saved results</b>, ": if you click \"Save my results\", your inputs and the recommendation are stored in Cloudflare KV for 30 days. They contain no name, email or other identifying information."],
          [<b key="b">AI stack recommender and LLM cost calculator inputs</b>, ": your one-line app description, user counts, request counts and token counts are used only for the recommendation and calculation and are not stored on our servers. Calculator settings are placed in the page URL so you can share them."],
          [<b key="b">Launch alerts (optional)</b>, ": if you sign up under \"Want a heads-up when prices change?\", we collect the email address you enter and agree to share, the options you pick, your interface language, where you signed up, and when. To prevent abuse, the IP address of the sign-up request is used only to count requests for one day and is not stored with your email."],
        ],
        after: ["Unless you sign up for launch alerts, we do not collect email addresses, names, phone numbers or other identifying information."],
      },
      {
        h: "2. How we use it",
        li: [
          ["Rule-based AI stack recommendations and LLM cost calculations"],
          ["Emailing launch-alert subscribers when price-change alerts start, and sending those alerts"],
          ["Usage statistics and service improvement"],
          ["Restoring your quiz results on the same device"],
        ],
      },
      {
        h: "3. Third-party services",
        p: ["We use the following third-party services to run Goleu AI."],
        li: [
          [<b key="b">Google Analytics 4</b>, ": anonymous usage statistics, enabled only after you consent. (", ext("https://policies.google.com/privacy", "Google Privacy Policy"), ")"],
          [<b key="b">Vercel Web Analytics</b>, ": counts page views and referral sources without cookies. (", ext("https://vercel.com/legal/privacy-policy", "Vercel Privacy Policy"), ")"],
          [<b key="b">Cloudflare Workers / KV</b>, ": API handling, rule-based recommendations, saved results and storage of launch-alert emails. We do not call any external AI API. (", ext("https://www.cloudflare.com/privacypolicy/", "Cloudflare Privacy Policy"), ")"],
        ],
      },
      {
        h: "4. International transfer of personal data",
        p: ["Emails submitted for launch alerts are stored outside Korea as follows."],
        li: [
          [<b key="b">Recipient</b>, ": Cloudflare, Inc. (United States)"],
          [<b key="b">Data transferred</b>, ": email address, selected options, interface language, sign-up location, sign-up time"],
          [<b key="b">When and how</b>, ": sent over the network at the moment you sign up"],
          [<b key="b">Purpose and retention</b>, ": storage for sending launch alerts, kept until the alerts end or you ask us to delete it"],
        ],
        after: ["If you don't want your data transferred, simply don't sign up for alerts. Every other feature works without it."],
      },
      {
        h: "5. Cookies and local storage",
        p: ["We use browser storage for the following."],
        li: [
          [<b key="b">Analytics consent</b>, ": remembers your cookie-banner choice."],
          [<b key="b">Anonymous session ID</b>, ": a random identifier for aggregating analytics. It cannot identify you."],
          [<b key="b">Quiz inputs</b>, ": kept temporarily so they survive a page refresh."],
          [<b key="b">Language and theme</b>, ": remembers your interface language and light/dark mode."],
          [<b key="b">Vercel Web Analytics</b>, ": uses no cookies."],
        ],
        after: ["You can clear stored data at any time in your browser settings."],
      },
      {
        h: "6. Retention",
        li: [
          [<b key="b">Local storage</b>, ": you can delete it any time through your browser"],
          [<b key="b">Saved results (KV)</b>, ": 30 days after creation, then automatically expired"],
          [<b key="b">GA4 data</b>, ": Google Analytics' default retention (14 months)"],
          [<b key="b">Launch-alert emails (KV)</b>, ": until the alerts end or you ask us to delete them. We delete them promptly on request."],
        ],
      },
      {
        h: "7. Your rights",
        p: [
          "You can refuse analytics at any time with the \"Decline\" button on the cookie banner or in your browser settings. Saving results is optional and nothing is restricted if you don't use it.",
          "If you signed up for launch alerts, you can ask to access, correct, delete or stop processing your email address by contacting us below, and you can withdraw your consent at any time. Every alert email will also explain how to unsubscribe.",
        ],
      },
      { h: "8. Children", p: ["Goleu AI is not directed at children under 14, and we do not knowingly collect their information."] },
      { h: "9. Changes to this policy", p: ["If this policy changes, we will post the update on this page and announce significant changes within the service."] },
      {
        h: "10. Privacy officer and contact",
        p: [[`Privacy officer: the operator of ${SERVICE_NAME}. For privacy questions or deletion requests, email `, <a key="m" href={`mailto:${CONTACT_EMAIL}`} style={LINK}>{CONTACT_EMAIL}</a>, "."]],
      },
    ],
  },
};

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const c = CONTENT[lang === "ko" ? "ko" : "en"];

  const s = {
    h2: { fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "40px 0 16px" },
    p: { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, margin: "0 0 12px" },
    li: { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 6 },
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Content style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 100px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, gap: 12 }}>
          <Button
            icon={<MaterialIcon name="arrow_back" size={16} color="var(--text-secondary)" />}
            onClick={() => navigate(-1)}
            style={{ border: "none", background: "transparent", color: "var(--text-secondary)", fontWeight: 600, padding: 0 }}
          >
            {c.back}
          </Button>
          <Segmented size="small" value={lang === "ko" ? "ko" : "en"} onChange={setLang}
            options={[{ label: "English", value: "en" }, { label: "한국어", value: "ko" }]} />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", marginBottom: 8 }}>{c.title}</h1>
        <p style={{ ...s.p, color: "var(--text-muted)", marginBottom: 0 }}>{c.updated}</p>

        {c.sections.map((sec) => (
          <section key={sec.h}>
            <h2 style={s.h2}>{sec.h}</h2>
            {(sec.p || []).map((text, i) => <p key={`p${i}`} style={s.p}>{text}</p>)}
            {sec.li && (
              <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
                {sec.li.map((parts, i) => <li key={i} style={s.li}>{parts}</li>)}
              </ul>
            )}
            {(sec.after || []).map((text, i) => <p key={`a${i}`} style={s.p}>{text}</p>)}
          </section>
        ))}

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/terms")} style={{ borderRadius: 8 }}>{c.terms}</Button>
          <Button type="primary" onClick={() => navigate("/")} style={{ borderRadius: 8 }}>{c.start}</Button>
        </div>
      </Content>
    </Layout>
  );
}
