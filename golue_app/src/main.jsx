// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./styles/buttons.css";
import "./styles/responsive.css";
import { hasConsent, initAnalytics } from "./lib/analytics";

// 동의가 이전 방문에 이미 granted 였다면 즉시 GA4 초기화
if (hasConsent()) {
  initAnalytics();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
