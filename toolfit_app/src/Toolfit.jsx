import React, { useState } from "react";
import { Button, Col, Input, Progress, Row, Typography } from "antd";import ToolfitBackground from "./ToolfitBackground";  // 배경 컴포넌트 임포트

const { Title, Text } = Typography;

const rolesInitial = {
  developer: 2,
  designer: 1,
  marketing: 1,
  management: 1,
};

const ToolfitMain = () => {
  const [teamName, setTeamName] = useState("");
  const [roles, setRoles] = useState(rolesInitial);

  const changeCount = (role, delta) => {
    setRoles((prev) => {
      const newCount = Math.max(0, (prev[role] || 0) + delta);
      return { ...prev, [role]: newCount };
    });
  };

  return (
    <>
      <ToolfitBackground /> {/* 여기에 배경 컴포넌트 넣기 */}

      <Row
        justify="center"
        align="middle"
        style={{ minHeight: "100vh", backgroundColor: "transparent" }} 
      >
        <Col
          xs={24}
          sm={20}
          md={16}
          lg={12}
          xl={8}
          style={{
            padding: "2rem",
            backgroundColor: "#fff",
            borderRadius: "20px",
            boxShadow:
              "0px 8px 10px -6px rgba(0, 0, 0, 0.1), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* (기존 컴포넌트 내용 동일) */}
          {/* ...생략... */}
        </Col>
      </Row>
    </>
  );
};

export default ToolfitMain;
