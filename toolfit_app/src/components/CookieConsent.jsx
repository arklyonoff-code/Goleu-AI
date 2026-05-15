import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { consentDecided, setConsent } from "../lib/analytics";

/**
 * ToolFit Cookie Consent Banner (한국 PIPA 준수)
 * - 익명화된 사용 데이터(페이지 방문, 클릭, Quiz 응답)만 수집함을 고지
 * - 사용자가 결정할 때까지 어떤 GA 이벤트도 발송되지 않음
 * - 동의/거부 모두 localStorage 에 저장되어 재방문 시 재노출되지 않음
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!consentDecided()) setVisible(true);
  }, []);

  if (!visible) return null;

  const handle = (granted) => {
    setConsent(granted);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="toolfit-consent-title"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        maxWidth: 720,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        padding: 20,
        zIndex: 9999,
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      <div style={{ marginBottom: 12, lineHeight: 1.6 }}>
        <div id="toolfit-consent-title" style={{ fontWeight: 700, color: "#222" }}>
          쿠키 사용 동의
        </div>
        <div style={{ color: "#555", marginTop: 6, fontSize: 14 }}>
          ToolFit 은 서비스 개선과 추천 정확도 향상을 위해{" "}
          <strong>익명화된 사용 데이터</strong>(페이지 방문, 클릭, Quiz 응답)를
          수집합니다. 이름·이메일 등 개인을 식별할 수 있는 정보는 별도 입력
          시에만 수집되며, 분석 데이터와 결합되지 않습니다.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <Button onClick={() => handle(false)} style={{ borderRadius: 8 }}>
          거부
        </Button>
        <Button
          type="primary"
          onClick={() => handle(true)}
          style={{ borderRadius: 8 }}
        >
          동의하고 계속
        </Button>
      </div>
    </div>
  );
}
