import React from "react";

/**
 * 재사용 가능한 Quiz 진행률 바.
 *
 * 기존 버그: 각 단계 컴포넌트에 width: 50% 가 하드코딩되어 모든 단계가 50%로 표시됨.
 * 이 컴포넌트는 step / total 로 동적 계산.
 *
 * Props:
 *   step    — 현재 단계 (1-indexed)
 *   total   — 전체 단계 수 (기본 4)
 */
export default function ProgressBar({ step, total = 4 }) {
  const safeStep = Math.max(0, Math.min(total, Number(step) || 0));
  const pct = (safeStep / total) * 100;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={safeStep}
      aria-label={`${total}단계 중 ${safeStep}단계`}
      style={{ position: "relative", width: "100%", height: 6, margin: "16px 0" }}
    >
      {/* 비활성 바 */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: 3,
          backgroundColor: "#e0e0e0",
          borderRadius: 3,
        }}
      />
      {/* 활성 진행 바 */}
      <div
        style={{
          position: "absolute",
          width: `${pct}%`,
          height: 3,
          backgroundColor: "#4c51bf",
          borderRadius: 3,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}
