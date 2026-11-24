import { useNavigate } from "react-router-dom";
import { Button, Layout } from "antd";
import { MaterialIcon } from "./components/MaterialIcon";

const { Content } = Layout;

const LAST_UPDATED = "2026년 6월";
const SERVICE_NAME = "Goleu AI";
const CONTACT_EMAIL = "arkly.onoff@gmail.com";

export default function TermsOfService() {
  const navigate = useNavigate();

  const s = {
    h2: { fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "40px 0 16px" },
    p: { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, margin: "0 0 12px" },
    li: { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 6 },
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Content style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 100px" }}>

        <Button
          icon={<MaterialIcon name="arrow_back" size={16} color="var(--text-secondary)" />}
          onClick={() => navigate(-1)}
          style={{
            marginBottom: 40, border: "none", background: "transparent",
            color: "var(--text-secondary)", fontWeight: 600, padding: 0,
          }}
        >
          돌아가기
        </Button>

        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", marginBottom: 8 }}>
          이용약관
        </h1>
        <p style={{ ...s.p, color: "var(--text-muted)", marginBottom: 0 }}>
          최종 업데이트: {LAST_UPDATED}
        </p>

        <h2 style={s.h2}>1. 서비스 소개</h2>
        <p style={s.p}>
          {SERVICE_NAME}(이하 &quot;서비스&quot;)은 팀 구성, 예산, 현재 사용 툴을 입력하면
          규칙 기반 엔진으로 최적의 SaaS 스택을 추천해주는 무료 서비스입니다.
          서비스를 이용함으로써 본 약관에 동의하는 것으로 간주합니다.
        </p>

        <h2 style={s.h2}>2. 서비스 이용</h2>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}>회원가입 없이 누구나 무료로 이용할 수 있습니다.</li>
          <li style={s.li}>추천 결과는 참고용이며, 실제 도구 선택은 사용자가 직접 판단해야 합니다.</li>
          <li style={s.li}>서비스는 별도 공지 없이 기능이 변경되거나 중단될 수 있습니다.</li>
        </ul>

        <h2 style={s.h2}>3. 추천의 한계</h2>
        <p style={s.p}>
          서비스의 추천은 규칙 기반 엔진과 사전 정의된 툴 데이터베이스를 통해 생성됩니다. 다음 사항을 유의하세요.
        </p>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}>추천은 완벽하지 않으며, 모든 팀 상황을 반영하지 못할 수 있습니다.</li>
          <li style={s.li}>가격 정보는 참고용이며 실제 서비스 가격과 다를 수 있습니다. 최종 가격은 각 SaaS 서비스 공식 사이트에서 확인하세요.</li>
          <li style={s.li}>추천 결과를 기반으로 한 비즈니스 결정에 대해 {SERVICE_NAME}은 책임을 지지 않습니다.</li>
        </ul>

        <h2 style={s.h2}>4. 금지 행위</h2>
        <p style={s.p}>다음 행위는 금지됩니다.</p>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}>서비스를 자동화된 방식으로 대량 호출하는 행위 (스크래핑, 봇 등)</li>
          <li style={s.li}>서비스의 정상적인 운영을 방해하는 행위</li>
          <li style={s.li}>서비스를 통해 생성된 콘텐츠를 {SERVICE_NAME}의 동의 없이 상업적으로 재판매하는 행위</li>
        </ul>

        <h2 style={s.h2}>5. 지식재산권</h2>
        <p style={s.p}>
          서비스의 UI, 브랜드, 코드 등 모든 지식재산권은 {SERVICE_NAME}에 귀속됩니다.
          추천 결과는 개인적·비상업적 용도로 자유롭게 활용할 수 있습니다.
        </p>

        <h2 style={s.h2}>6. 면책 조항</h2>
        <p style={s.p}>
          서비스는 &quot;있는 그대로(as-is)&quot; 제공됩니다. 서비스의 정확성, 완전성, 가용성에 대해
          명시적 또는 묵시적 보증을 하지 않습니다. 서비스 이용으로 발생하는 직접적·간접적
          손해에 대해 {SERVICE_NAME}은 법이 허용하는 최대 범위 내에서 책임을 지지 않습니다.
        </p>

        <h2 style={s.h2}>7. 약관 변경</h2>
        <p style={s.p}>
          약관이 변경될 경우 이 페이지에 공지합니다. 변경 후 서비스를 계속 이용하면
          변경된 약관에 동의한 것으로 봅니다.
        </p>

        <h2 style={s.h2}>8. 준거법</h2>
        <p style={s.p}>
          본 약관은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 관할 법원은 서울중앙지방법원으로 합니다.
        </p>

        <h2 style={s.h2}>9. 문의</h2>
        <p style={s.p}>
          이용약관에 관한 문의는{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#6366f1" }}>{CONTACT_EMAIL}</a>
          로 연락해 주세요.
        </p>

        <div style={{
          marginTop: 60, paddingTop: 24,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          <Button onClick={() => navigate("/privacy")} style={{ borderRadius: 8 }}>
            개인정보처리방침 보기
          </Button>
          <Button type="primary" onClick={() => navigate("/")} style={{ borderRadius: 8 }}>
            서비스 시작하기 →
          </Button>
        </div>
      </Content>
    </Layout>
  );
}
