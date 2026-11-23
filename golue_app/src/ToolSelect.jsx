import { useState } from "react";
import { Input, Tag, Button } from "antd";
import { useNavigate } from "react-router-dom";
import QuizLayout from "./components/QuizLayout";
import { MaterialIcon } from "./components/MaterialIcon";
import { SlackMark, GithubMark } from "./icons/BrandIcons";
import figmaLogo from "./assets/Figma.svg";
import notionLogo from "./assets/Notion.svg";
import trelloLogo from "./assets/trello.svg";
import { trackEvent, Events } from "./lib/analytics";
import { useLanguage } from "./lib/LanguageContext";

const LOGO_STYLE = {
  width: 22, height: 22, objectFit: "contain",
  background: "#fff", borderRadius: 4, padding: 2,
};

const ROLE_LABELS = {
  product: "Product",
  engineering: "Engineering",
  design: "Design",
  data: "Data",
  marketing: "Marketing",
  sales: "Sales",
  cs: "CS/Support",
  operations: "Operations",
};

const ALL_TOOLS = [
  {
    key: "jira",
    name: "Jira",
    desc: "Issue & project tracking",
    roles: ["product", "engineering"],
    badge: "J", badgeColor: "#0052CC",
  },
  {
    key: "notion",
    name: "Notion",
    desc: "Docs, wiki & knowledge base",
    roles: ["product", "design", "operations"],
    logo: notionLogo,
  },
  {
    key: "linear",
    name: "Linear",
    desc: "Modern issue tracking",
    roles: ["product", "engineering"],
    badge: "L", badgeColor: "#5E6AD2",
  },
  {
    key: "github",
    name: "GitHub",
    desc: "Code & version control",
    roles: ["engineering"],
    icon: <GithubMark size={22} style={{ color: "#24292e" }} />,
    color: "#24292e",
  },
  {
    key: "slack",
    name: "Slack",
    desc: "Team communication",
    roles: ["engineering", "operations", "cs"],
    icon: <SlackMark size={22} style={{ color: "#4a154b" }} />,
    color: "#4a154b",
  },
  {
    key: "vercel",
    name: "Vercel",
    desc: "Frontend deployment",
    roles: ["engineering"],
    badge: "▲", badgeColor: "#000000",
  },
  {
    key: "figma",
    name: "Figma",
    desc: "UI/UX design & prototyping",
    roles: ["design"],
    logo: figmaLogo,
    color: "#a259ff",
  },
  {
    key: "miro",
    name: "Miro",
    desc: "Visual collaboration board",
    roles: ["design", "product"],
    badge: "M", badgeColor: "#FFD02F",
  },
  {
    key: "zeplin",
    name: "Zeplin",
    desc: "Design handoff to dev",
    roles: ["design", "engineering"],
    badge: "Z", badgeColor: "#FBBF24",
  },
  {
    key: "ga4",
    name: "Google Analytics",
    desc: "Web & app analytics",
    roles: ["data", "marketing"],
    badge: "GA", badgeColor: "#E37400",
  },
  {
    key: "mixpanel",
    name: "Mixpanel",
    desc: "Product analytics",
    roles: ["data", "product"],
    badge: "MP", badgeColor: "#7856FF",
  },
  {
    key: "amplitude",
    name: "Amplitude",
    desc: "Digital analytics platform",
    roles: ["data", "product"],
    badge: "A", badgeColor: "#1654F0",
  },
  {
    key: "hubspot",
    name: "HubSpot",
    desc: "CRM & marketing platform",
    roles: ["marketing", "sales"],
    badge: "H", badgeColor: "#FF7A59",
  },
  {
    key: "mailchimp",
    name: "Mailchimp",
    desc: "Email marketing",
    roles: ["marketing"],
    badge: "MC", badgeColor: "#FFE01B",
  },
  {
    key: "semrush",
    name: "Semrush",
    desc: "SEO & content marketing",
    roles: ["marketing"],
    badge: "SR", badgeColor: "#FF642D",
  },
  {
    key: "salesforce",
    name: "Salesforce",
    desc: "Enterprise CRM",
    roles: ["sales"],
    badge: "SF", badgeColor: "#00A1E0",
  },
  {
    key: "apollo",
    name: "Apollo.io",
    desc: "Sales engagement & leads",
    roles: ["sales"],
    badge: "Ap", badgeColor: "#5C4EFF",
  },
  {
    key: "outreach",
    name: "Outreach",
    desc: "Sales execution platform",
    roles: ["sales"],
    badge: "O", badgeColor: "#5951E5",
  },
  {
    key: "zendesk",
    name: "Zendesk",
    desc: "Customer support platform",
    roles: ["cs"],
    badge: "Z", badgeColor: "#03363D",
  },
  {
    key: "intercom",
    name: "Intercom",
    desc: "Customer messaging & CS",
    roles: ["cs", "marketing"],
    badge: "I", badgeColor: "#1F8DED",
  },
  {
    key: "gainsight",
    name: "Gainsight",
    desc: "Customer success platform",
    roles: ["cs"],
    badge: "G", badgeColor: "#FF6600",
  },
  {
    key: "gsuite",
    name: "Google Workspace",
    desc: "Docs, Drive & Gmail",
    roles: ["operations"],
    badge: "G", badgeColor: "#4285F4",
  },
  {
    key: "ms365",
    name: "Microsoft 365",
    desc: "Office, OneDrive & Teams",
    roles: ["operations", "engineering"],
    badge: "M", badgeColor: "#D83B01",
  },
  {
    key: "trello",
    name: "Trello",
    desc: "Kanban board",
    roles: ["operations", "product"],
    logo: trelloLogo,
    color: "#0079bf",
  },
];

function ToolIcon({ tool, selected }) {
  if (tool.logo) {
    return (
      <img src={tool.logo} alt={tool.name} style={{
        ...LOGO_STYLE,
        filter: selected ? "none" : "grayscale(20%)",
      }} />
    );
  }
  if (tool.icon) {
    return <span style={{ display: "inline-flex", alignItems: "center" }}>{tool.icon}</span>;
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: selected ? (tool.badgeColor + "20") : "var(--bg-surface)",
      border: `1.5px solid ${selected ? tool.badgeColor : "var(--border-subtle)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: 10,
      color: selected ? tool.badgeColor : "var(--text-muted)",
      letterSpacing: -0.5,
      transition: "all 0.15s",
    }}>
      {tool.badge}
    </div>
  );
}

export default function ToolSelect({ selectedTools, setSelectedTools, roles }) {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTools, setCustomTools] = useState([]);

  const selectedRoles = Object.keys(roles || {}).filter((k) => (roles[k] || 0) > 0);

  const filteredTools = selectedRoles.length > 0
    ? ALL_TOOLS.filter((t) => t.roles.some((r) => selectedRoles.includes(r)))
    : ALL_TOOLS;

  const toggle = (key) => {
    setSelectedTools((prev) => {
      const selected = prev.includes(key);
      trackEvent(selected ? Events.TOOL_DESELECTED : Events.TOOL_SELECTED, { tool: key });
      return selected ? prev.filter((k) => k !== key) : [...prev, key];
    });
  };

  const addCustomTool = () => {
    const name = customInput.trim();
    if (!name) return;
    const key = "custom_" + name.toLowerCase().replace(/\s+/g, "_");
    if (!customTools.find((t) => t.key === key) && !selectedTools.includes(key)) {
      const newTool = { key, name, desc: "Custom tool", roles: selectedRoles, custom: true };
      setCustomTools((prev) => [...prev, newTool]);
      setSelectedTools((prev) => [...prev, key]);
      trackEvent(Events.TOOL_SELECTED, { tool: key, custom: true });
    }
    setCustomInput("");
    setShowCustomInput(false);
  };

  const removeCustomTool = (key) => {
    setCustomTools((prev) => prev.filter((t) => t.key !== key));
    setSelectedTools((prev) => prev.filter((k) => k !== key));
  };

  const handleNext = () => {
    trackEvent(Events.QUIZ_STEP_COMPLETED, {
      step: 2, step_name: "tools",
      selected_count: selectedTools.length,
      selected_tools: selectedTools.join(","),
      custom_tools: customTools.map((t) => t.name).join(","),
    });
    navigate("/cloud");
  };

  const sidePanel = (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 16, padding: "28px",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        color: "var(--accent-indigo)", letterSpacing: 1, marginBottom: 20,
      }}>
        STEP 2 / 4
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
        {t("s2SideTitle")}
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
        {t("s2SideDesc")}
      </p>

      {selectedTools.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...filteredTools, ...customTools]
            .filter((t) => selectedTools.includes(t.key))
            .map((t) => (
              <div key={t.key} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 14px", background: "var(--bg-surface)", borderRadius: 10,
              }}>
                <MaterialIcon name="check_circle" size={14} color="#6366f1" fill={1} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {t.name}
                </span>
              </div>
            ))}
          <div style={{
            marginTop: 4, padding: "8px 14px",
            background: "rgba(99,102,241,0.1)", borderRadius: 10,
            fontSize: 12, color: "#6366f1", fontWeight: 700,
          }}>
            {selectedTools.length}{t("s2SelectedCount")}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          {lang === "ko" ? <>툴을 선택하면<br />여기에 표시됩니다</> : <>Select tools to<br />see them here</>}
        </p>
      )}
    </div>
  );

  return (
    <QuizLayout
      step={2}
      title={t("s2Title")}
      subtitle={t("s2Subtitle")}
      onNext={handleNext}
      onBack={() => navigate("/quiz")}
      nextLabel={t("btnNext")}
      side={sidePanel}
    >
      {selectedRoles.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          marginBottom: 20, padding: "12px 16px",
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 10,
          alignItems: "center",
        }}>
          <MaterialIcon name="filter_list" size={15} color="#6366f1" fill={1} />
          <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginRight: 4 }}>
            {t("s2FilterLabel")}
          </span>
          {selectedRoles.map((r) => (
            <Tag key={r} style={{
              background: "rgba(99,102,241,0.15)",
              border: "none", color: "#6366f1",
              borderRadius: 6, fontSize: 12, fontWeight: 600,
              padding: "2px 8px",
            }}>
              {ROLE_LABELS[r] || r}
            </Tag>
          ))}
        </div>
      )}

      <div
        className="tool-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {filteredTools.map((tool) => {
          const selected = selectedTools.includes(tool.key);
          const relevantRoles = tool.roles.filter((r) => selectedRoles.includes(r));

          return (
            <div
              key={tool.key}
              onClick={() => toggle(tool.key)}
              style={{
                position: "relative",
                display: "flex", flexDirection: "column",
                padding: "14px 14px 12px",
                borderRadius: 14,
                border: `2px solid ${selected ? "#6366f1" : "var(--border-subtle)"}`,
                background: selected ? "rgba(99,102,241,0.07)" : "var(--bg-elevated)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {selected && (
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#6366f1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MaterialIcon name="check" size={12} color="#fff" />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <ToolIcon tool={tool} selected={selected} />
                <span style={{
                  fontWeight: 700, fontSize: 13,
                  color: selected ? "#6366f1" : "var(--text-primary)",
                  lineHeight: 1.3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {tool.name}
                </span>
              </div>

              <div style={{
                fontSize: 11, color: "var(--text-muted)",
                lineHeight: 1.4, marginBottom: 8,
              }}>
                {tool.desc}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}>
                {(selectedRoles.length > 0 ? relevantRoles : tool.roles).map((r) => (
                  <span key={r} style={{
                    fontSize: 10, fontWeight: 600,
                    color: selected ? "#6366f1" : "var(--text-muted)",
                    background: selected ? "rgba(99,102,241,0.12)" : "var(--bg-surface)",
                    padding: "2px 6px", borderRadius: 4,
                  }}>
                    {ROLE_LABELS[r] || r}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTools.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px",
          background: "rgba(99,102,241,0.08)",
          borderRadius: 10, marginBottom: 20,
          fontSize: 13, color: "#6366f1", fontWeight: 600,
        }}>
          <MaterialIcon name="check_circle" size={16} color="#6366f1" fill={1} />
          {selectedTools.length}{t("s2SelectedCount")}
        </div>
      )}

      <div style={{
        border: "1px dashed var(--border-subtle)",
        borderRadius: 14, padding: "16px 18px",
      }}>
        <div style={{
          fontWeight: 700, fontSize: 13,
          color: "var(--text-secondary)", marginBottom: 10,
        }}>
          {t("s2CustomTitle")}
        </div>

        {customTools.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {customTools.map((t) => (
              <div key={t.key} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                background: "rgba(99,102,241,0.1)",
                border: "1.5px solid rgba(99,102,241,0.4)",
                borderRadius: 20, fontSize: 13, fontWeight: 600,
                color: "#6366f1",
              }}>
                {t.name}
                <span
                  onClick={(e) => { e.stopPropagation(); removeCustomTool(t.key); }}
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  <MaterialIcon name="close" size={14} color="#6366f1" />
                </span>
              </div>
            ))}
          </div>
        )}

        {showCustomInput ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Input
              autoFocus
              size="middle"
              placeholder={t("s2CustomPlaceholder")}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomTool();
                if (e.key === "Escape") setShowCustomInput(false);
              }}
              style={{
                flex: 1, minWidth: 180, borderRadius: 8,
                background: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
            <Button
              type="primary"
              onClick={addCustomTool}
              disabled={!customInput.trim()}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              {t("btnAdd")}
            </Button>
            <Button
              onClick={() => { setShowCustomInput(false); setCustomInput(""); }}
              style={{ borderRadius: 8 }}
            >
              {t("btnCancel")}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              border: "1.5px dashed var(--border-default)",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#6366f1";
              e.currentTarget.style.color = "#6366f1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <MaterialIcon name="add" size={16} color="currentColor" />
            {t("s2CustomBtn")}
          </button>
        )}
      </div>
    </QuizLayout>
  );
}
