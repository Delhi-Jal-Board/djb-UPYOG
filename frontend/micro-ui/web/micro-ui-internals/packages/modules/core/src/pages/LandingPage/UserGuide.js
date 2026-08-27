import React, { useState } from "react";
import HeaderBar from "./HeaderBar";
import Footer from "./footer";
import { useTranslation } from "react-i18next";
import { Loader, ButtonSelector, Card, Dropdown } from "@djb25/digit-ui-react-components";
import {
  heroConfig,
  filterHeaderConfig,
  ekycGuides,
  pdfServices,
  moduleOptions,
  liveGuideCards,
  faqs,
  ekycRoleCards,
  ocrPipelineSteps,
  ocrRoleTasks,
  podPipelineSteps,
  podRelationshipSteps,
  nirikshanPipelineSteps,
  nirikshanAppEcosystem,
  nirikshanTroubleshooting,
  pdfGuideText,
} from "./configs/UserGuideConfig";

const CardIcon = ({ type }) => {
  switch (type) {
    case "water":
      return (
        <span className="card-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </span>
      );
    case "tanker":
      return (
        <span className="card-header-icon" style={{ backgroundColor: "#e0f7fa", color: "#00838f" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </span>
      );
    case "ekyc":
      return (
        <span className="card-header-icon" style={{ backgroundColor: "#d1fae5", color: "#047857" }}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </span>
      );
    case "ocr":
      return (
        <span className="card-header-icon" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      );
    case "pod":
      return (
        <span className="card-header-icon" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </span>
      );
    case "nirikshan":
      return (
        <span className="card-header-icon" style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </span>
      );
    default:
      return null;
  }
};

const UserGuide = (props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("live");
  const [pdfLoading, setPdfLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedEkycGuide, setSelectedEkycGuide] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedPdfService, setSelectedPdfService] = useState("ekyc");

  const openManual = (url) => {
    if (!url) return;
    const targetUrl = url.startsWith("/digit-ui") ? url : `/digit-ui${url}`;
    window.open(targetUrl, "_blank");
  };

  const handleEkycSelect = (option) => {
    const url = option?.url || (typeof option === "string" ? option : option?.target?.value);
    if (url) {
      openManual(url);
      setSelectedEkycGuide("");
    }
  };

  const currentPdfService = pdfServices.find((s) => s.id === selectedPdfService) || pdfServices[0];

  const handleModuleChange = (option) => {
    const mod = option?.value || (typeof option === "string" ? option : option?.target?.value);
    if (mod) {
      setSelectedModule(mod);
      if (mod !== "all") {
        setSelectedPdfService(mod);
        setPdfLoading(true);
      }
    }
  };

  const handleActionClick = (btn) => {
    if (btn.type === "url") {
      openManual(btn.url);
    } else if (btn.type === "scroll") {
      const element = document.getElementById(btn.targetId);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <React.Fragment>
      <HeaderBar {...props} />
      <div className="user-guide-page-wrapper">
        {/* ── HERO BANNER ── */}
        <div className="contact-hero-banner">
          <div className="contact-hero-overlay"></div>
          <div className="contact-hero-content">
            <span className="contact-hero-badge">{t(heroConfig.badge)}</span>
            <h1>{t(heroConfig.title)}</h1>
            <p>{t(heroConfig.description)}</p>
          </div>
        </div>

        {/* ── MAIN CONTAINER ── */}
        <div className="contact-page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>
          {/* ── CONTROL SECTION: TABS & MODULE FILTER BAR ── */}
          <div style={{ marginBottom: "36px" }}>
            {/* Centered Tab Switcher */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <div
                className="collapsible-card-tabs"
                style={{
                  display: "flex",
                  width: "100%",
                  maxWidth: "400px",
                  borderRadius: "9999px",
                  backgroundColor: "#e2e8f0",
                  padding: "4px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("live")}
                  className={`collapsible-card-tab-button ${activeTab === "live" ? "active" : ""}`}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: "600",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: activeTab === "live" ? "#1f5fa8" : "transparent",
                    color: activeTab === "live" ? "#ffffff" : "#475569",
                    boxShadow: activeTab === "live" ? "0 4px 12px rgba(31, 95, 168, 0.3)" : "none",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {t("Live Guide")}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("pdf")}
                  className={`collapsible-card-tab-button ${activeTab === "pdf" ? "active" : ""}`}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: "600",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: activeTab === "pdf" ? "#1f5fa8" : "transparent",
                    color: activeTab === "pdf" ? "#ffffff" : "#475569",
                    boxShadow: activeTab === "pdf" ? "0 4px 12px rgba(31, 95, 168, 0.3)" : "none",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  {t("PDF Guide")}
                </button>
              </div>
            </div>

            {/* Executive Module Filter Bar using Card & Dropdown from @djb25/digit-ui-react-components */}
            <Card
              className="user-guide-filter-card"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "16px 24px",
                margin: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    backgroundColor: "#e0f2fe",
                    color: "#0369a1",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </span>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t(filterHeaderConfig.title)}</h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, marginTop: "2px" }}>{t(filterHeaderConfig.subtitle)}</p>
                </div>
              </div>

              {/* Dropdown Selector Component from @djb25/digit-ui-react-components */}
              <div style={{ minWidth: "280px", flex: "0 1 360px" }}>
                <Dropdown
                  option={moduleOptions}
                  optionKey="label"
                  selected={moduleOptions.find((opt) => opt.value === selectedModule)}
                  select={(val) => handleModuleChange(val)}
                  t={t}
                  style={{ width: "100%", margin: 0 }}
                />
              </div>
            </Card>
          </div>

          {/* ── TAB 1: LIVE GUIDE CONTENT ── */}
          {activeTab === "live" && (
            <div className="live-guide-content">
              {/* Feature Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                  marginBottom: "40px",
                }}
              >
                {liveGuideCards
                  .filter((card) => selectedModule === "all" || selectedModule === card.id)
                  .map((card) => (
                    <Card
                      key={card.id}
                      className="contact-card"
                      style={{
                        padding: "24px",
                        margin: 0,
                        borderTop: `4px solid ${card.borderColor}`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        background: "#ffffff",
                        borderRadius: "14px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            marginBottom: "16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "12px",
                            width: "100%",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0, flex: 1 }}>
                            <CardIcon type={card.iconType} />
                            <h3
                              style={{
                                fontSize: "17px",
                                fontWeight: "700",
                                color: "#0f172a",
                                margin: 0,
                                lineHeight: "1.35",
                                wordBreak: "break-word",
                              }}
                            >
                              {t(card.title)}
                            </h3>
                          </div>
                          {card.badge && (
                            <span
                              style={{
                                backgroundColor: "#fef3c7",
                                color: "#d97706",
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                whiteSpace: "nowrap",
                                letterSpacing: "0.5px",
                                border: "1px solid #fde68a",
                                flexShrink: 0,
                                marginTop: "2px",
                              }}
                            >
                              {t(card.badge)}
                            </span>
                          )}
                        </div>
                        <ul style={{ paddingLeft: "20px", color: "#475569", lineHeight: "1.8", fontSize: "14px" }}>
                          {card.items.map((item, idx) => (
                            <li key={idx}>
                              {item.bold && (
                                <strong style={{ color: "#0f172a", fontWeight: "700" }}>
                                  {t(item.bold, { nsSeparator: false })}
                                </strong>
                              )}{" "}
                              {t(item.text, { nsSeparator: false })}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {card.actionBtn && (
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                          {card.actionBtn.type === "coming_soon" ? (
                            <button
                              type="button"
                              disabled
                              style={{
                                width: "100%",
                                padding: "12px 18px",
                                backgroundColor: card.actionBtn.bgColor || "#f1f5f9",
                                color: card.actionBtn.color || "#64748b",
                                border: `1px dashed ${card.actionBtn.borderColor || "#cbd5e1"}`,
                                borderRadius: "8px",
                                fontWeight: "600",
                                fontSize: "14px",
                                cursor: "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {t(card.actionBtn.text)}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActionClick(card.actionBtn)}
                              style={{
                                width: "100%",
                                padding: "12px 18px",
                                backgroundColor: card.actionBtn.color,
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "600",
                                fontSize: "14px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                boxShadow: `0 4px 12px ${card.actionBtn.shadowColor}`,
                                transition: "all 0.2s ease",
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {card.actionBtn.type === "url" ? (
                                  <React.Fragment>
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </React.Fragment>
                                ) : (
                                  <React.Fragment>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </React.Fragment>
                                )}
                              </svg>
                              {t(card.actionBtn.text)}
                            </button>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
              </div>

              {/* ── DEDICATED eKYC INTERACTIVE USER MANUAL HUB SECTION ── */}
              {(selectedModule === "all" || selectedModule === "ekyc") && (
                <Card
                  className="contact-card"
                  style={{
                    padding: "32px",
                    margin: "0 0 40px 0",
                    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                    border: "1px solid #a7f3d0",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1)",
                  }}
                >
                  {/* Section Header & Dropdown Selector */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                      marginBottom: "28px",
                      paddingBottom: "20px",
                      borderBottom: "1px solid #d1fae5",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span
                          style={{
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {t("EKYC MODULE MANUALS")}
                        </span>
                        <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#065f46", margin: 0 }}>
                          {t("Interactive eKYC User Guide & Role Manuals")}
                        </h3>
                      </div>
                      <p style={{ fontSize: "14px", color: "#047857", margin: 0 }}>
                        {t("Select your role or manual below to launch the step-by-step pictorial user guide for eKYC operations.")}
                      </p>
                    </div>

                    {/* Quick Manual Access Dropdown Selector */}
                    <div style={{ minWidth: "280px" }}>
                      <Dropdown
                        option={ekycGuides}
                        optionKey="label"
                        selected={null}
                        placeholder={t("📖 Jump to eKYC Guide...")}
                        select={(val) => handleEkycSelect(val)}
                        t={t}
                        style={{ width: "100%", margin: 0 }}
                      />
                    </div>
                  </div>

                  {/* 4 Role-Based Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "20px",
                      marginBottom: "28px",
                    }}
                  >
                    {ekycRoleCards.map((card, idx) => (
                      <Card
                        key={idx}
                        style={{
                          background: "#ffffff",
                          padding: "20px",
                          margin: 0,
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "28px", marginBottom: "10px" }}>{card.icon}</div>
                          <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>{t(card.title)}</h4>
                          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", marginBottom: "16px" }}>{t(card.desc)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openManual(card.url)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            backgroundColor: "#059669",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          {t(card.btnText)} →
                        </button>
                      </Card>
                    ))}
                  </div>

                  {/* Footer Main Hub Launch Button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openManual("/user_mannual_ekyc_/index.html")}
                      style={{
                        padding: "14px 32px",
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "700",
                        fontSize: "15px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      {t("Launch Main eKYC User Manual Hub")}
                    </button>

                    <button
                      type="button"
                      onClick={() => openManual("/user_mannual_ekyc_/ekyc_module_work_manual.html")}
                      style={{
                        padding: "14px 28px",
                        backgroundColor: "#ffffff",
                        color: "#047857",
                        border: "2px solid #10b981",
                        borderRadius: "10px",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>⚙️</span>
                      {t("View Full Work Manual")}
                    </button>
                  </div>
                </Card>
              )}

              {/* ── DEDICATED OCR METER READING APPLICATION HUB SECTION ── */}
              {(selectedModule === "all" || selectedModule === "ocr_meter") && (
                <Card
                  id="ocr-interactive-hub"
                  className="contact-card"
                  style={{
                    padding: "32px",
                    margin: "0 0 40px 0",
                    background: "linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%)",
                    border: "1px solid #c084fc",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "#8b5cf6",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                    >
                      📸
                    </div>
                    <div>
                      <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#4c1d95", margin: 0 }}>
                        {t("OCR Meter Reading Application Guide")}
                      </h3>
                      <p style={{ fontSize: "14px", color: "#6b21a8", margin: 0, marginTop: "4px" }}>
                        {t("Digitized water-meter reading workflow using mobile camera OCR, verification, offline local sync & supervisor billing approval.")}
                      </p>
                    </div>
                  </div>

                  {/* 8-Step Interactive Pipeline Stepper */}
                  <div style={{ marginBottom: "28px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#581c87", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t("End-to-End Meter Reading & Billing Pipeline")}
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {ocrPipelineSteps.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#ffffff",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid #e9d5ff",
                            boxShadow: "0 2px 6px rgba(139, 92, 246, 0.05)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{s.icon}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                background: "#f3e8ff",
                                color: "#7c3aed",
                              }}
                            >
                              STEP {s.step}
                            </span>
                          </div>
                          <h5 style={{ fontSize: "14px", fontWeight: "700", color: "#3b0764", margin: "0 0 4px 0" }}>{t(s.title)}</h5>
                          <p style={{ fontSize: "12px", color: "#6b21a8", margin: 0, lineHeight: "1.5" }}>{t(s.desc)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Two Main Roles Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e9d5ff",
                      }}
                    >
                      <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#6b21a8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{ocrRoleTasks.meterReader.icon}</span> {t(ocrRoleTasks.meterReader.title)}
                      </h4>
                      <ul style={{ paddingLeft: "18px", fontSize: "13px", color: "#475569", lineHeight: "1.7", margin: 0 }}>
                        {ocrRoleTasks.meterReader.items.map((item, idx) => (
                          <li key={idx}>{t(item)}</li>
                        ))}
                      </ul>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e9d5ff",
                      }}
                    >
                      <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#6b21a8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{ocrRoleTasks.supervisor.icon}</span> {t(ocrRoleTasks.supervisor.title)}
                      </h4>
                      <ul style={{ paddingLeft: "18px", fontSize: "13px", color: "#475569", lineHeight: "1.7", margin: 0 }}>
                        {ocrRoleTasks.supervisor.items.map((item, idx) => (
                          <li key={idx}>{t(item)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── DEDICATED PROOF OF DELIVERY (PoD) APPLICATION HUB SECTION ── */}
              {(selectedModule === "all" || selectedModule === "pod_app") && (
                <Card
                  id="pod-interactive-hub"
                  className="contact-card"
                  style={{
                    padding: "32px",
                    margin: "0 0 40px 0",
                    background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
                    border: "1px solid #fde68a",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "#f59e0b",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                    >
                      📦
                    </div>
                    <div>
                      <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#78350f", margin: 0 }}>
                        {t("Proof of Delivery (PoD) Application Guide")}
                      </h3>
                      <p style={{ fontSize: "14px", color: "#92400e", margin: 0, marginTop: "4px" }}>
                        {t("Field-staff bill delivery recording via QR scan verification, bill photo capture, delivery status logging & DJB system submission.")}
                      </p>
                    </div>
                  </div>

                  {/* 5-Step Delivery Workflow */}
                  <div style={{ marginBottom: "28px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#b45309", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t("5-Step Physical Bill Delivery Workflow")}
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {podPipelineSteps.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#ffffff",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid #fef3c7",
                            boxShadow: "0 2px 6px rgba(245, 158, 11, 0.05)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{s.icon}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                background: "#fef3c7",
                                color: "#d97706",
                              }}
                            >
                              STEP {s.step}
                            </span>
                          </div>
                          <h5 style={{ fontSize: "14px", fontWeight: "700", color: "#78350f", margin: "0 0 4px 0" }}>{t(s.title)}</h5>
                          <p style={{ fontSize: "12px", color: "#92400e", margin: 0, lineHeight: "1.5" }}>{t(s.desc)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business Pipeline Relationship Card */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #fef3c7",
                    }}
                  >
                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#78350f", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🔗</span> {t("How PoD Connects with Meter Reading")}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "12px", textAlign: "center", background: "#fffbeb", padding: "16px", borderRadius: "10px" }}>
                      {podRelationshipSteps.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <div>
                            <div style={{ fontSize: "24px" }}>{step.icon}</div>
                            <div style={{ fontWeight: "700", fontSize: "13px", color: "#78350f" }}>{t(step.title)}</div>
                            <div style={{ fontSize: "11px", color: "#92400e" }}>{t(step.desc)}</div>
                          </div>
                          {idx < podRelationshipSteps.length - 1 && <div style={{ fontSize: "20px", color: "#d97706" }}>➔</div>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* ── DEDICATED NIRIKSHAN DIGITAL FIELD INSPECTION HUB SECTION ── */}
              {(selectedModule === "all" || selectedModule === "nirikshan") && (
                <Card
                  id="nirikshan-interactive-hub"
                  className="contact-card"
                  style={{
                    padding: "32px",
                    margin: "0 0 40px 0",
                    background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                    border: "1px solid #7dd3fc",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          backgroundColor: "#0284c7",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                        }}
                      >
                        🔍
                      </div>
                      <div>
                        <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#0369a1", margin: 0 }}>
                          {t("Nirikshan Digital Field Inspection Application Guide")}
                        </h3>
                        <p style={{ fontSize: "14px", color: "#0284c7", margin: 0, marginTop: "4px" }}>
                          {t("Field Inspector's digital inspection, photographic evidence capture, GPS location validation, continuous workflow & submission.")}
                        </p>
                      </div>
                    </div>

                    {/* <button
                      type="button"
                      onClick={() => openManual("/user_mannual_ekyc_/nirikshan_module_work_manual.html")}
                      style={{
                        padding: "10px 18px",
                        backgroundColor: "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
                      }}
                    >
                      <span>📘</span>
                      {t("Open Nirikshan Full Work Manual")} →
                    </button> */}
                  </div>

                  {/* Golden Rule Banner */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#ffffff",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      marginBottom: "28px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      boxShadow: "0 4px 14px rgba(2, 132, 199, 0.2)",
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>⭐</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {t("The Golden Operating Rule")}
                      </h4>
                      <p style={{ margin: "2px 0 0 0", fontSize: "13px", opacity: 0.95, lineHeight: "1.5" }}>
                        {t("Start with a FRESH LOGIN SESSION (Logout → Close App → Reopen → Fresh Login) and complete the inspection without unnecessary interruption or app switching to prevent stale session timeouts and authorization errors.")}
                      </p>
                    </div>
                  </div>

                  {/* 10-Step Interactive Operating Pipeline Stepper */}
                  <div style={{ marginBottom: "28px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0369a1", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t("10-Step Standard Operating Sequence")}
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {nirikshanPipelineSteps.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#ffffff",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid #bae6fd",
                            boxShadow: "0 2px 6px rgba(2, 132, 199, 0.05)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{s.icon}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                background: "#e0f2fe",
                                color: "#0284c7",
                              }}
                            >
                              STEP {s.step}
                            </span>
                          </div>
                          <h5 style={{ fontSize: "14px", fontWeight: "700", color: "#0c4a6e", margin: "0 0 4px 0" }}>{t(s.title)}</h5>
                          <p style={{ fontSize: "12px", color: "#0369a1", margin: 0, lineHeight: "1.5" }}>{t(s.desc)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ecosystem Comparison: Meter Reading vs PoD vs Nirikshan */}
                  <div style={{ marginBottom: "28px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#0369a1", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t("How Nirikshan Differs Across DJB Ecosystem Apps")}
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {nirikshanAppEcosystem.map((app, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: app.bgColor,
                            border: `1px solid ${app.color}40`,
                            borderRadius: "12px",
                            padding: "18px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <span style={{ fontSize: "24px" }}>{app.icon}</span>
                            <h5 style={{ fontSize: "16px", fontWeight: "700", color: app.color, margin: 0 }}>{t(app.name)}</h5>
                          </div>
                          <div style={{ fontSize: "13px", color: "#334155", marginBottom: "8px" }}>
                            <strong>{t("Main Purpose:")}</strong> {t(app.purpose)}
                          </div>
                          <div style={{ fontSize: "12px", backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${app.color}30`, fontWeight: "600", color: app.color }}>
                            {t("Activity Flow:")} {t(app.flow)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Troubleshooting & Session Resolution Matrix */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #bae6fd",
                    }}
                  >
                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0369a1", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🛠️</span> {t("Nirikshan Troubleshooting & Session Resolution Guide")}
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {nirikshanTroubleshooting.map((tItem, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "14px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "18px" }}>{tItem.icon}</span>
                            <h5 style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t(tItem.issue)}</h5>
                          </div>
                          <p style={{ fontSize: "11px", color: "#dc2626", margin: "0 0 6px 0", fontWeight: "600" }}>{t(tItem.msg)}</p>
                          <div style={{ fontSize: "12px", color: "#334155", lineHeight: "1.4" }}>
                            <strong>{t("Resolution:")}</strong> {t(tItem.fix)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* FAQs Accordion */}
              <Card className="contact-card" style={{ padding: "30px", margin: 0 }}>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>{t("Frequently Asked Questions")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {faqs.map((faq, index) => {
                    const isOpen = activeFaq === index;
                    return (
                      <div
                        key={index}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          overflow: "hidden",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveFaq(isOpen ? null : index)}
                          style={{
                            width: "100%",
                            padding: "16px 20px",
                            background: isOpen ? "#f1f5f9" : "#ffffff",
                            border: "none",
                            textAlign: "left",
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#1e293b",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{t(faq.q)}</span>
                          <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                        </button>
                        {isOpen && (
                          <div
                            style={{
                              padding: "16px 20px",
                              background: "#ffffff",
                              borderTop: "1px solid #e2e8f0",
                              color: "#475569",
                              fontSize: "14px",
                              lineHeight: "1.7",
                            }}
                          >
                            {t(faq.a)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ── TAB 2: PDF GUIDE CONTENT ── */}
          {activeTab === "pdf" && (
            <div className="pdf-guide-content">
              <Card className="contact-card" style={{ padding: "28px", margin: 0 }}>
                {/* Service Selection Toolbar */}
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    marginBottom: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#1f5fa8",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "4px",
                        }}
                      >
                        {t(pdfGuideText.selectServiceTitle)}
                      </div>
                      <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{t(currentPdfService.label)}</h3>
                    </div>

                    {/* Quick PDF Service Switcher Pills when "All Modules" is selected */}
                    {selectedModule === "all" && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {pdfServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setSelectedPdfService(service.id);
                              setPdfLoading(true);
                            }}
                            style={{
                              padding: "8px 14px",
                              fontSize: "13px",
                              fontWeight: "600",
                              borderRadius: "8px",
                              border: selectedPdfService === service.id ? "2px solid #1f5fa8" : "1px solid #cbd5e1",
                              backgroundColor: selectedPdfService === service.id ? "#eff6ff" : "#ffffff",
                              color: selectedPdfService === service.id ? "#1f5fa8" : "#475569",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: selectedPdfService === service.id ? "0 2px 8px rgba(31, 95, 168, 0.15)" : "none",
                            }}
                          >
                            <span>
                              {service.id === "ekyc"
                                ? "🛡️ eKYC"
                                : service.id === "ocr_meter"
                                ? "📸 OCR Meter"
                                : service.id === "pod_app"
                                ? "📦 Proof of Delivery (PoD)"
                                : service.id === "nirikshan"
                                ? "🔍 Nirikshan"
                                : service.id === "water_tanker"
                                ? "🚰 Water Tanker"
                                : "💧 Water & Sewerage"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>{t(currentPdfService.desc)}</p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "12px",
                      borderTop: "1px solid #cbd5e1",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#64748b", display: "flex", gap: "12px", alignItems: "center" }}>
                      <span>
                        {t("Last Updated:")} <strong>{currentPdfService.updated}</strong>
                      </span>
                      <span>•</span>
                      <span>{t("Format: PDF Document")}</span>
                      <span>•</span>
                      <span>{t("Official DJB Publication")}</span>
                    </div>

                    {currentPdfService.url && (
                      <ButtonSelector
                        label={t("Print / Download PDF")}
                        onSubmit={() => window.open(currentPdfService.url, "_blank")}
                        style={{ height: "40px", padding: "0 20px", backgroundColor: "#1f5fa8" }}
                      />
                    )}
                  </div>
                </div>

                {/* Hint banner */}
                <div
                  style={{
                    background: "#eff6ff",
                    borderLeft: "4px solid #1f5fa8",
                    padding: "12px 16px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#1e40af",
                    marginBottom: "20px",
                  }}
                >
                  {t(pdfGuideText.hintBanner)}
                </div>

                {/* PDF iFrame Viewer Container / Coming Soon Fallback */}
                {currentPdfService.url ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "750px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  >
                    {pdfLoading && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(255, 255, 255, 0.9)",
                          zIndex: 10,
                        }}
                      >
                        <Loader />
                      </div>
                    )}
                    <iframe
                      key={selectedPdfService}
                      src={currentPdfService.url}
                      title={t(currentPdfService.label)}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      onLoad={() => setPdfLoading(false)}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "60px 20px",
                      textAlign: "center",
                      backgroundColor: "#f8fafc",
                      border: "2px dashed #cbd5e1",
                      borderRadius: "12px",
                      color: "#64748b",
                    }}
                  >
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
                    <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>{t(pdfGuideText.comingSoonTitle)}</h4>
                    <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto", lineHeight: "1.6" }}>{t(pdfGuideText.comingSoonDesc)}</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      <Footer {...props} />
    </React.Fragment>
  );
};

export default UserGuide;
