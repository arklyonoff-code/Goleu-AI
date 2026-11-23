import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Skeleton, Alert, Button, Layout } from "antd";
import GoleuResult from "./GoleuResult";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
const { Content } = Layout;

export default function SavedResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const workerBase = WORKER_URL?.trim().replace(/\/$/, "");
    if (!workerBase || workerBase.includes("YOUR-ACCOUNT")) {
      setError("서비스 설정이 완료되지 않았습니다.");
      setLoading(false);
      return;
    }
    fetch(`${workerBase}/result/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", padding: "60px 24px" }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: "100vh", padding: "60px 24px" }}>
        <Content style={{ maxWidth: 600, margin: "0 auto" }}>
          <Alert
            type="error"
            message="결과를 불러올 수 없습니다"
            description={`${error} — 링크가 만료되었거나 잘못된 URL입니다.`}
            showIcon
          />
          <Button style={{ marginTop: 20 }} onClick={() => navigate("/")}>홈으로</Button>
        </Content>
      </Layout>
    );
  }

  return (
    <GoleuResult
      {...data.inputs}
      savedRecommendation={data.recommendation}
      savedAt={data.createdAt}
      isSharedView={true}
    />
  );
}
