import { useNavigate } from "react-router-dom";
import { Button, Layout } from "antd";
import { MaterialIcon } from "./components/MaterialIcon";

const { Content } = Layout;

const LAST_UPDATED = "2026년 6월";
const SERVICE_NAME = "Goleu AI";
const CONTACT_EMAIL = "privacy@goleu.ai";

export default function PrivacyPolicy() {
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
          개인정보처리방침
        </h1>
        <p style={{ ...s.p, color: "var(--text-muted)", marginBottom: 0 }}>
          최종 업데이트: {LAST_UPDATED}
        </p>

        <h2 style={s.h2}>1. 수집하는 정보</h2>
        <p style={s.p}>
          {SERVICE_NAME}은 서비스 개선을 위해 다음과 같은 익명 데이터를 수집합니다.
        </p>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}><b>익명 사용 데이터</b>: 페이지 방문, 퀴즈 단계 진행, 버튼 클릭 등의 행동 데이터. Google Analytics 4(GA4)를 통해 수집하며, 모든 데이터는 익명화됩니다.</li>
          <li style={s.li}><b>퀴즈 입력값</b>: 팀 구성, 사용 툴, 예산 등 입력한 값은 추천 생성에만 사용되며, 사용자 기기의 브라우저 저장소(localStorage)에만 보관됩니다.</li>
          <li style={s.li}><b>결과 저장 시</b>: &quot;내 결과 저장하기&quot;를 클릭하면 입력값과 추천 결과가 Cloudflare KV에 30일간 저장됩니다. 이름, 이메일 등 개인 식별 정보는 수집하지 않습니다.</li>
        </ul>
        <p style={s.p}>
          <b>이메일 주소, 이름, 전화번호 등 개인 식별 정보는 수집하지 않습니다.</b>
        </p>

        <h2 style={s.h2}>2. 수집 정보 사용 목적</h2>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}>규칙 기반 SaaS 툴 추천 생성</li>
          <li style={s.li}>서비스 사용 통계 분석 및 품질 개선</li>
          <li style={s.li}>퀴즈 완료 후 동일 기기에서 결과 복원</li>
        </ul>

        <h2 style={s.h2}>3. 제3자 서비스</h2>
        <p style={s.p}>서비스 운영을 위해 다음 제3자 서비스를 이용합니다.</p>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}><b>Google Analytics 4</b>: 익명 사용 통계 수집. 사용자 동의 후 활성화됩니다. (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>Google 개인정보처리방침</a>)</li>
          <li style={s.li}><b>Cloudflare Workers / KV</b>: API 처리, 규칙 기반 추천 생성, 결과 저장 인프라. 외부 AI API를 호출하지 않습니다. (<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>Cloudflare 개인정보처리방침</a>)</li>
        </ul>

        <h2 style={s.h2}>4. 쿠키 및 로컬 저장소</h2>
        <p style={s.p}>서비스는 다음 목적으로 브라우저 저장소를 사용합니다.</p>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}><b>분석 동의 여부</b>: 쿠키 동의 선택을 기억합니다.</li>
          <li style={s.li}><b>익명 세션 ID</b>: 분석 집계를 위한 무작위 식별자. 개인을 특정할 수 없습니다.</li>
          <li style={s.li}><b>퀴즈 입력값</b>: 페이지 새로고침 시 입력값을 복원하기 위해 임시 저장합니다.</li>
          <li style={s.li}><b>테마 설정</b>: 라이트/다크 모드 선택을 유지합니다.</li>
        </ul>
        <p style={s.p}>브라우저 설정에서 언제든지 저장된 데이터를 삭제할 수 있습니다.</p>

        <h2 style={s.h2}>5. 데이터 보관 기간</h2>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={s.li}><b>localStorage 데이터</b>: 브라우저를 통해 언제든지 삭제 가능</li>
          <li style={s.li}><b>저장된 결과 (KV)</b>: 생성 후 30일, 이후 자동 만료</li>
          <li style={s.li}><b>GA4 데이터</b>: Google Analytics 기본 보관 정책(14개월) 적용</li>
        </ul>

        <h2 style={s.h2}>6. 사용자 권리</h2>
        <p style={s.p}>
          사용자는 언제든지 쿠키 배너의 &quot;거부&quot; 버튼 또는 브라우저 설정을 통해 분석 데이터 수집을 거부할 수 있습니다.
          결과 저장 기능은 선택 사항이며, 사용하지 않아도 서비스 이용에 제한이 없습니다.
        </p>

        <h2 style={s.h2}>7. 미성년자 보호</h2>
        <p style={s.p}>
          본 서비스는 만 14세 미만을 대상으로 하지 않으며, 해당 연령대의 정보를 의도적으로 수집하지 않습니다.
        </p>

        <h2 style={s.h2}>8. 방침 변경</h2>
        <p style={s.p}>
          본 방침이 변경될 경우 이 페이지에 공지하며, 중요한 변경 사항은 서비스 내 공지를 통해 안내합니다.
        </p>

        <h2 style={s.h2}>9. 문의</h2>
        <p style={s.p}>
          개인정보 처리에 관한 문의는{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#6366f1" }}>{CONTACT_EMAIL}</a>
          로 연락해 주세요.
        </p>

        <div style={{
          marginTop: 60, paddingTop: 24,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          <Button onClick={() => navigate("/terms")} style={{ borderRadius: 8 }}>
            이용약관 보기
          </Button>
          <Button type="primary" onClick={() => navigate("/")} style={{ borderRadius: 8 }}>
            서비스 시작하기 →
          </Button>
        </div>
      </Content>
    </Layout>
  );
}
