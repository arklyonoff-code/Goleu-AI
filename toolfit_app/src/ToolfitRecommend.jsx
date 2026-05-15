import React from "react";

function ToolfitRecommend({ teamName, roles }) {
  return (
    <div style={{ padding: 32 }}>
      <h2>추천 결과 (임시)</h2>
      <div>팀 이름: {teamName}</div>
      <div>
        <h4>직군별 인원</h4>
        <ul>
          {Object.entries(roles).map(([role, count]) => (
            <li key={role}>{role}: {count}명</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24 }}>
        <a href="/">처음으로</a>
      </div>
    </div>
  );
}

export default ToolfitRecommend; 