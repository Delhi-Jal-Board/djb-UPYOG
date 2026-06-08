import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";
import Footer from "./footer";
import { ABOUT } from "./configs/AboutConfig";
import OrgChart from "./orgChart/orgChart";
import { orgStructureData } from "./configs/orgStructureData";
import { useTranslation } from "react-i18next";
import { Loader, ButtonSelector } from "@djb25/digit-ui-react-components";

const About = (props) => {
  const { logoUrl, stateInfo } = props;
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState("about");
  const [activeTab, setActiveTab] = useState("overview");
  const [pdfLoading, setPdfLoading] = useState(true);

  const orgName = "Delhi Jal Board";

  useEffect(() => {
    const menu = ABOUT.sideNav.find((m) => m.key === activeMenu);
    if (menu?.defaultTab) setActiveTab(menu.defaultTab);
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "citizen") {
      setPdfLoading(true);
    }
  }, [activeMenu]);

  const blocks = ABOUT.content[activeTab] || [];

  const renderBlock = (block, index) => {
    switch (block.type) {
      /* ================= HEADINGS ================= */
      case "heading":
        return (
          <h3 key={index} className="djb-section-title">
            {t(block.text)}
          </h3>
        );

      case "subheading":
        return (
          <h4 key={index} className="djb-sub-title">
            {t(block.text)}
          </h4>
        );

      /* ================= PARAGRAPH ================= */
      case "paragraph":
        return <p key={index} dangerouslySetInnerHTML={{ __html: block.html }} />;

      /* ================= LIST ================= */
      case "list":
        return (
          <ul key={index} className="djb-list">
            {block.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        );

      /* ================= STANDARD TABLE ================= */
      case "table":
        return (
          <table key={index} className="djb-table">
            <thead>
              <tr>
                {block.columns.map((c, i) => (
                  <th key={i}>{t(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) =>
                    typeof cell === "object" ? (
                      <td key={c} colSpan={cell.colSpan}>
                        <strong>{t(cell.text)}</strong>
                      </td>
                    ) : (
                      <td key={c}>{t(cell)}</td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        );

      /* ================= REVENUE TABLE ================= */
      case "revenueTable":
        return (
          <table key={index} className="djb-table djb-revenue-table">
            <thead>
              <tr>
                {block.columns.map((c, i) => (
                  <th key={i}>{t(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  <td>{t(row.year)}</td>
                  <td>
                    <div className="revenue-cell">
                      <span className="revenue-value">{t(row.value)}</span>
                      <div className="revenue-bar">
                        <div className={`bar ${row.bar}`}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  /* ── nav icon map ── */
  const navIcons = {
    about: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    org: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="5" height="5" /><rect x="17" y="7" width="5" height="5" /><rect x="9" y="2" width="6" height="5" />
        <line x1="12" y1="7" x2="12" y2="4" /><line x1="4.5" y1="7" x2="4.5" y2="17" /><line x1="19.5" y1="7" x2="19.5" y2="17" />
        <line x1="4.5" y1="17" x2="19.5" y2="17" />
      </svg>
    ),
    citizen: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    who: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    web: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  };

  return (
    <React.Fragment>
      <HeaderBar {...props} />
      <div className="about-page-wrapper">
        {/* ── Hero Banner (matches Contact Us style) ── */}
        <div className="about-hero-banner">
          <div className="about-hero-overlay"></div>
          <div className="about-hero-content">
            <span className="about-hero-badge">{t("Organisation")}</span>
            <h1>{t("About Delhi Jal Board")}</h1>
            <p>{t("Learn about our mission, infrastructure, water sector achievements, tariff policies, and organizational structure.")}</p>
          </div>
        </div>

        {/* ── Main body ── */}
        <div className="about-page-container">
          <div className="about-layout-grid">

            {/* ────────── LEFT: Side Nav ────────── */}
            <aside className="about-side-nav">
              <div className="about-side-nav-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                {t("Navigation")}
              </div>
              <ul className="about-side-nav-list">
                {ABOUT.sideNav.map((item) => (
                  <li
                    key={item.key}
                    className={`about-side-nav-item${activeMenu === item.key ? " active" : ""}`}
                    onClick={() => setActiveMenu(item.key)}
                  >
                    <span className="about-nav-icon">{navIcons[item.key]}</span>
                    <span className="about-nav-label">{t(item.label)}</span>
                    {activeMenu === item.key && (
                      <svg className="about-nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </li>
                ))}
              </ul>
            </aside>

            {/* ────────── RIGHT: Content Card ────────── */}
            <div className="about-content-card">

              {/* ── ABOUT section: tabbed content ── */}
              {activeMenu === "about" && (
                <React.Fragment>
                  {/* Tabs */}
                  <div className="about-tab-bar">
                    {ABOUT.tabs.map((tab) => (
                      <button
                        key={tab.key}
                        className={`about-tab-btn${activeTab === tab.key ? " active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {t(tab.label)}
                      </button>
                    ))}
                  </div>

                  <section className="djb-section">{blocks.map(renderBlock)}</section>
                </React.Fragment>
              )}

              {/* ── ORG STRUCTURE ── */}
              {activeMenu === "org" && (
                <section className="djb-org-fullwidth">
                  <div className="about-content-card-header">
                    <span className="about-content-card-header-icon">
                      {navIcons["org"]}
                    </span>
                    <h3 className="djb-section-title" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
                      {t("Organizational Structure of {{orgName}}", { orgName })}
                    </h3>
                  </div>

                  <div className="org-image-wrapper">
                    <img
                      src="https://delhijalboard.delhi.gov.in/sites/default/files/Jalboard/images/org_chart_cng_0.jpg"
                      alt={t("{{orgName}} Organisational Structure", { orgName })}
                      className="org-structure-image"
                    />
                  </div>
                </section>
              )}

              {/* ── CITIZEN CHARTER ── */}
              {activeMenu === "citizen" && (
                <section className="djb-section pdf-print-area">
                  <div className="doc-frame">
                    {/* Document Header */}
                    <div className="doc-header">
                      <div>
                        <h3 className="doc-title">{t("Citizen Charter – {{orgName}}", { orgName })}</h3>
                        <div className="doc-meta">
                          <span>{t("Last Updated: 2022")}</span>
                          <span>•</span>
                          <span>{t("Format: PDF")}</span>
                        </div>
                      </div>

                      <div className="pdf-toolbar no-print">
                        <ButtonSelector
                          label={t("Print / Download PDF")}
                          onSubmit={() =>
                            window.open(
                              "https://delhijalboard.delhi.gov.in/sites/default/files/Jalboard/pdf_files/citizen_s_charter_2022.pdf",
                              "_blank"
                            )
                          }
                          style={{ height: "40px", padding: "0 20px" }}
                        />
                      </div>
                    </div>

                    {/* Info Hint */}
                    <div className="doc-hint">{t("For best print quality, please use the 'Print / Download PDF' option.")}</div>

                    {/* PDF Container */}
                    <div className="pdf-container full-view">
                      {pdfLoading && (
                        <div className="pdf-loader-overlay">
                          <Loader />
                        </div>
                      )}
                      <iframe
                        src="https://docs.google.com/gview?url=https://delhijalboard.delhi.gov.in/sites/default/files/Jalboard/pdf_files/citizen_s_charter_2022.pdf&embedded=true"
                        title={t("{{orgName}} Citizen Charter 2022", { orgName })}
                        frameBorder="0"
                        onLoad={() => setPdfLoading(false)}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* ── WHO'S WHO ── */}
              {activeMenu === "who" && <section className="djb-section">{ABOUT.content.who.map(renderBlock)}</section>}

              {/* ── CATCH-ALL: coming soon ── */}
              {activeMenu !== "about" && activeMenu !== "org" && activeMenu !== "citizen" && activeMenu !== "who" && (
                <section className="djb-section">
                  <div className="about-coming-soon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <h3>{t("Content Coming Soon")}</h3>
                    <p>{t("This section is being updated. Please check back soon.")}</p>
                  </div>
                </section>
              )}

            </div>
          </div>
        </div>
      </div>
      <Footer {...props} />
    </React.Fragment>
  );
};

export default About;
