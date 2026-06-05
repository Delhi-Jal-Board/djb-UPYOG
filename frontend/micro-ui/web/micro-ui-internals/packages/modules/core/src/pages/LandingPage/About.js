import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";
import Footer from "./footer";
import { ABOUT } from "./configs/AboutConfig";
import OrgChart from "./orgChart/orgChart";
import { orgStructureData } from "./configs/orgStructureData";
import { useTranslation } from "react-i18next";
import { Card, Header, Loader, ButtonSelector } from "@djb25/digit-ui-react-components";

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

  return (
    <React.Fragment>
      <HeaderBar {...props} />

      <section className="djb-page-wrapper">
        <Header styles={{ fontSize: "32px", marginBottom: "20px" }}>{t("About Us")}</Header>

        <div className="djb-about-layout">
          <Card className="djb-side-nav" style={{ margin: 0, padding: "20px" }}>
            <div className="side-nav-title">{t("Navigation")}</div>
            <ul>
              {ABOUT.sideNav.map((item) => (
                <li key={item.key} className={activeMenu === item.key ? "active" : ""} onClick={() => setActiveMenu(item.key)}>
                  {t(item.label)}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="djb-about-content" style={{ margin: 0, padding: "20px" }}>
            {activeMenu === "about" && (
              <React.Fragment>
                <div className="djb-tabs">
                  {ABOUT.tabs.map((tab) => (
                    <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>
                      {t(tab.label)}
                    </button>
                  ))}
                </div>

                <section className="djb-section">{blocks.map(renderBlock)}</section>
              </React.Fragment>
            )}

            {activeMenu === "org" && (
              <section className="djb-org-fullwidth">
                <h3 className="djb-section-title">{t("Organizational Structure of {{orgName}}", { orgName })}</h3>

                <div className="org-image-wrapper">
                  <img
                    src="https://delhijalboard.delhi.gov.in/sites/default/files/Jalboard/images/org_chart_cng_0.jpg"
                    alt={t("{{orgName}} Organisational Structure", { orgName })}
                    className="org-structure-image"
                  />
                </div>
              </section>
            )}

            {activeMenu === "citizen" && (
              <section className="djb-section pdf-print-area">
                <div className="doc-frame">
                  {/* ===== Document Header ===== */}
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

                  {/* ===== Info Hint ===== */}
                  <div className="doc-hint">{t("For best print quality, please use the “Print / Download PDF” option.")}</div>

                  {/* ===== PDF Container (iframe ALWAYS mounted) ===== */}
                  <div className="pdf-container full-view">
                    {/* Loader overlay */}
                    {pdfLoading && (
                      <div className="pdf-loader-overlay">
                        <Loader />
                      </div>
                    )}

                    {/* Iframe */}
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

            {activeMenu === "who" && <section className="djb-section">{ABOUT.content.who.map(renderBlock)}</section>}

            {activeMenu !== "about" && activeMenu !== "org" && activeMenu !== "citizen" && activeMenu !== "who" && (
              <section className="djb-section">
                <h3 className="djb-section-title">{t("Content Coming Soon")}</h3>
              </section>
            )}
          </Card>
        </div>
      </section>

      <Footer {...props} />
    </React.Fragment>
  );
};

export default About;
