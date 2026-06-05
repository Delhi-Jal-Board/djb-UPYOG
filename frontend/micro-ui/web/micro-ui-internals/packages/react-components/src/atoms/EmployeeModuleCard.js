import React, { Fragment, useContext, useCallback, useEffect, useRef } from "react";
import { useHistory, Link, useLocation } from "react-router-dom";
import {
  ADSIconComp,
  AssetIcon,
  BillsIconComp,
  CHBIconComp,
  DSSIconComp,
  EngagementIconComp,
  EventsIconComp,
  FsmIconComp,
  HrmsIcon,
  KycIcon,
  MCollectIconComp,
  OBPSIconComp,
  PGRIconComp,
  PTIconComp,
  PTRIconComp,
  ReceiptsIconComp,
  TankerIcon,
  TLIconComp,
  VendorIcon,
  WaterIcon,
  SurveyIconComp,
  ArrowForward,
} from "./svgindex";
import ExpandedViewContext from "./ExpandedViewContext";
import ModuleLinksView from "./ModuleLinksView";
import CollapsibleModuleSidebar from "./CollapsibleModuleSidebar";
import { useTranslation } from "react-i18next";

const getNewButtonText = (moduleName, kpis, links) => {
  let path = "";
  if (kpis && kpis.length > 0 && kpis[0].link) {
    path = kpis[0].link;
  } else if (links && links.length > 0 && links[0].link) {
    path = links[0].link;
  }

  path = path.toLowerCase();
  const name = String(moduleName || "").toLowerCase();

  if (path.includes("/ws/") || path.includes("/sw/") || (name.includes("water") && (name.includes("sew") || name.includes("sw"))))
    return "New connection";
  if (path.includes("/wt/") || (name.includes("water") && name.includes("tanker"))) return "New application";
  if (path.includes("/ekyc/") || name.includes("kyc")) return "New Kyc";
  if (path.includes("/fsm/") || name.includes("fsm") || name.includes("sludge") || name.includes("faecal")) return "New";
  if (path.includes("/vendor/") || name.includes("vendor")) return "New vendor";
  if (path.includes("/hrms/") || name.includes("user management") || name.includes("employee")) return "New Employee";
  if (path.includes("/asset/") || name.includes("asset")) return "New Asset";

  return "New";
};

const getLinkLabelText = (linkItem) => String(linkItem?.label || "");

const shouldRenderLinkCount = (count) => count !== undefined && count !== null && count !== "";

/* ─────────────────────────────────────────────────────────────
   MOBILE TAB BAR — completely self-contained, position:fixed
   so it lives OUTSIDE the flex/sidebar layout entirely
───────────────────────────────────────────────────────────── */
const MobileModuleTabBar = ({ links = [], moduleName = "" }) => {
  const location = useLocation();
  const activeRef = useRef(null);

  /* Auto-scroll active tab into view on route change */
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [location.pathname]);

  const renderTab = (linkItem, index) => {
    const isActive = location.pathname === linkItem.link;
    const labelText = getLinkLabelText(linkItem);
    const initials = labelText.substring(0, 2).toUpperCase();

    const tabInner = (
      <span
        className={`emtb-tab${isActive ? " emtb-tab--active" : ""}${!linkItem.link ? " emtb-tab--disabled" : ""}`}
        ref={isActive ? activeRef : null}
      >
        <span className="emtb-tab__icon">{linkItem.icon ? linkItem.icon : <span className="emtb-tab__initials">{initials}</span>}</span>
        <span className="emtb-tab__content">
          <span className="emtb-tab__label">{labelText}</span>
          {linkItem.subLabel ? <span className="emtb-tab__sublabel">{linkItem.subLabel}</span> : null}
        </span>
        {shouldRenderLinkCount(linkItem.count) ? <span className="emtb-tab__count">{linkItem.count}</span> : null}
      </span>
    );

    if (!linkItem.link) {
      return <div key={index}>{tabInner}</div>;
    }

    if (linkItem.link.includes("digit-ui")) {
      return (
        <Link key={index} to={linkItem.link} style={{ textDecoration: "none" }}>
          {tabInner}
        </Link>
      );
    }

    return (
      <a key={index} href={linkItem.link} style={{ textDecoration: "none" }}>
        {tabInner}
      </a>
    );
  };

  return (
    <nav className="emtb-root" aria-label={`${moduleName} navigation`}>
      {links.map((linkItem, index) => renderTab(linkItem, index))}
    </nav>
  );
};

const getModuleIcon = (moduleName, kpis, links, originalIcon) => {
  let path = "";
  if (kpis && kpis.length > 0 && kpis[0].link) path = kpis[0].link;
  else if (links && links.length > 0 && links[0].link) path = links[0].link;

  path = path.toLowerCase();
  const name = String(moduleName || "").toLowerCase();

  if (path.includes("/ws/") || path.includes("/sw/") || (name.includes("water") && (name.includes("sew") || name.includes("sw"))))
    return <WaterIcon />;
  if (path.includes("/wt/") || (name.includes("water") && name.includes("tanker"))) return <TankerIcon />;
  if (path.includes("/ekyc/") || name.includes("kyc")) return <KycIcon />;
  if (path.includes("/vendor/") || name.includes("vendor")) return <VendorIcon />;
  if (path.includes("/hrms/") || name.includes("user management") || name.includes("employee")) return <HrmsIcon />;
  if (path.includes("/asset/") || name.includes("asset")) return <AssetIcon />;
  if (path.includes("/pt/") || name.includes("property")) return <PTIconComp />;
  if (path.includes("/bills/") || name.includes("bill") || name.includes("payment")) return <BillsIconComp />;
  if (path.includes("/fsm/") || name.includes("fsm") || name.includes("sludge")) return <FsmIconComp />;
  if (path.includes("/tl/") || name.includes("trade")) return <TLIconComp />;
  if (path.includes("/mcollect/") || name.includes("collect")) return <MCollectIconComp />;
  if (path.includes("/receipts/") || name.includes("receipt")) return <ReceiptsIconComp />;
  if (path.includes("/obps/") || name.includes("obps") || name.includes("building")) return <OBPSIconComp />;
  if (path.includes("/pgr/") || name.includes("pgr") || name.includes("complaint")) return <PGRIconComp />;
  if (path.includes("/ptr/") || name.includes("ptr") || name.includes("pet")) return <PTRIconComp />;
  if (path.includes("/chb/") || name.includes("chb") || name.includes("hall")) return <CHBIconComp />;
  if (path.includes("/ads/") || name.includes("ads") || name.includes("advertisement")) return <ADSIconComp />;
  if (path.includes("/dss/") || name.includes("dss") || name.includes("dashboard")) return <DSSIconComp />;
  if (path.includes("/engagement/") || name.includes("engagement")) return <EngagementIconComp />;
  if (name.includes("survey")) return <SurveyIconComp />;
  if (name.includes("event")) return <EventsIconComp />;

  return originalIcon;
};

const getIconColorClass = (moduleName, kpis, links) => {
  let path = "";
  if (kpis && kpis.length > 0 && kpis[0].link) path = kpis[0].link;
  else if (links && links.length > 0 && links[0].link) path = links[0].link;

  path = path.toLowerCase();
  const name = String(moduleName || "").toLowerCase();

  if (path.includes("/ws/") || path.includes("/sw/") || (name.includes("water") && (name.includes("sew") || name.includes("sw")))) return "icon-blue";
  if (path.includes("/wt/") || (name.includes("water") && name.includes("tanker"))) return "icon-orange";
  if (path.includes("/ekyc/") || name.includes("kyc")) return "icon-green";
  if (path.includes("/fsm/") || name.includes("fsm") || name.includes("sludge") || name.includes("faecal")) return "icon-brown";
  if (path.includes("/vendor/") || name.includes("vendor")) return "icon-violet";
  if (path.includes("/hrms/") || name.includes("user management") || name.includes("employee")) return "icon-teal";
  if (path.includes("/asset/") || name.includes("asset")) return "icon-purple";
  if (path.includes("/pt/") || name.includes("property")) return "icon-purple";
  if (path.includes("/tl/") || name.includes("trade")) return "icon-orange";
  if (path.includes("/mcollect/") || name.includes("collect")) return "icon-violet";
  if (path.includes("/receipts/") || name.includes("receipt")) return "icon-teal";
  if (path.includes("/obps/") || name.includes("obps") || name.includes("building")) return "icon-blue";
  if (path.includes("/pgr/") || name.includes("pgr") || name.includes("complaint")) return "icon-brown";
  if (path.includes("/ptr/") || name.includes("ptr") || name.includes("pet")) return "icon-green";
  if (path.includes("/bills/") || name.includes("bill") || name.includes("payment")) return "icon-orange";
  if (path.includes("/chb/") || name.includes("chb") || name.includes("hall")) return "icon-violet";
  if (path.includes("/ads/") || name.includes("ads") || name.includes("advertisement")) return "icon-teal";
  if (path.includes("/dss/") || name.includes("dss") || name.includes("dashboard")) return "icon-purple";
  if (path.includes("/engagement/") || name.includes("engagement")) return "icon-blue";

  return "icon-default";
};

const EmployeeModuleCard = ({ Icon, moduleName, kpis = [], links = [], className, styles, onDetailsClick }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { isExpandedView, isModuleSidebar = false } = useContext(ExpandedViewContext) || {};

  const handleDetailsClick = useCallback(() => {
    if (onDetailsClick) {
      onDetailsClick();
      return;
    }
    Digit.SessionStorage.set("MODULE_DETAILS", {
      moduleName,
      links,
    });

    history.push(`/digit-ui/employee/module/details`, {
      moduleName,
      links,
    });
  }, [history, moduleName, links, onDetailsClick]);

  if (isExpandedView) {
    return <ModuleLinksView links={links} moduleName={moduleName} />;
  }

  if (isModuleSidebar) {
    return (
      <Fragment>
        {/*
          MobileModuleTabBar uses position:fixed so it floats above the page.
          It is completely invisible to the parent flex layout — cannot push
          or affect the sidebar or the content area at all.
          It only shows on screens ≤ 768px (enforced inside the component).
        */}
        <MobileModuleTabBar links={links} moduleName={moduleName} />

        {/*
          CollapsibleModuleSidebar already hides itself on mobile via its
          own CSS (display:none on .premium-sidebar at max-width:768px).
          On desktop it renders normally.
        */}
        <CollapsibleModuleSidebar links={links} moduleName={moduleName} Icon={Icon} />
      </Fragment>
    );
  }

  const mainKpi = kpis.length > 0 ? kpis[0] : null;
  const secondaryKpis = kpis.length > 1 ? kpis.slice(1) : [];

  return (
    <Fragment>
      <div className={`new-employee-card card-home ${className || ""}`} onClick={handleDetailsClick} style={{ cursor: "pointer" }}>
        <div className="card-header-row">
          <div className={`module-icon-wrap ${getIconColorClass(moduleName, kpis, links)}`}>{getModuleIcon(moduleName, kpis, links, Icon)}</div>
          <h2 className="module-title">{moduleName}</h2>
        </div>

        <div className="card-body-row">
          <div className="main-kpi-section">
            {mainKpi && (
              <Fragment>
                <span className="main-kpi-number">{mainKpi.count || "0"}</span>
                <span className="main-kpi-label">{mainKpi.label}</span>
              </Fragment>
            )}
          </div>

          <div className="secondary-kpi-section">
            {secondaryKpis
              .filter((kpi) => {
                const label = String(kpi.label || "").toLowerCase();
                return label.includes("nearing sla") || label.includes("active employee") || label.includes("online inbox") || label.includes("emergency inbox");
              })
              .map((kpi, index) => {
                const isHeader = !kpi.count && kpi.label === kpi.label?.toUpperCase();
                return (
                  <div key={index} className={`secondary-kpi-item ${isHeader ? "sec-kpi-header" : ""}`}>
                    <span className="sec-kpi-label">
                      {kpi.link ? (
                        kpi.link.includes("digit-ui/") ? (
                          <Link to={kpi.link} style={{ color: "inherit", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
                            {kpi.label}
                          </Link>
                        ) : (
                          <a href={kpi.link} style={{ color: "inherit", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
                            {kpi.label}
                          </a>
                        )
                      ) : (
                        kpi.label
                      )}
                    </span>
                    {!isHeader && <span className="sec-kpi-value">{kpi.count ? kpi.count : <span className="sec-kpi-dot"></span>}</span>}
                  </div>
                );
              })}
          </div>
        </div>

        <div className="card-footer-row">
          <div className="footer-links">
            <span className="pill-link" style={{ cursor: "pointer" }} onClick={(e) => e.stopPropagation()}>
              {t("View Reports")}

              <ArrowForward />
            </span>
            <span className="pill-link" style={{ cursor: "pointer" }} onClick={(e) => e.stopPropagation()}>
              +
            </span>
          </div>
          <button
            className="details-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDetailsClick();
            }}
          >
            {t("Details")}
          </button>
        </div>
      </div>
    </Fragment>
  );
};

/* ─────────────────────────────────────────────────────────────
   MODULE CARD FULL WIDTH
───────────────────────────────────────────────────────────── */
const ModuleCardFullWidth = ({ Icon, moduleName, kpis = [], links = [], className, styles }) => {
  const { t } = useTranslation();
  const history = useHistory();

  const handleDetailsClick = () => {
    history.push("/digit-ui/employee/module/details", { moduleName, links });
  };

  const mainKpi = kpis.length > 0 ? kpis[0] : null;
  const secondaryKpis = kpis.length > 1 ? kpis.slice(1) : [];

  return (
    <div className={`new-employee-card ${className || ""}`} style={styles || {}}>
      <div className="card-header-row">
        {Icon && (
          <div className={`module-icon-wrap ${getIconColorClass(moduleName, kpis, links)}`}>{getModuleIcon(moduleName, kpis, links, Icon)}</div>
        )}
        <h2 className="module-title">{moduleName}</h2>
      </div>

      <div className="card-body-row">
        <div className="main-kpi-section">
          {mainKpi && (
            <Fragment>
              <span className="main-kpi-number">{mainKpi.count || "0"}</span>
              <span className="main-kpi-label">{mainKpi.label}</span>
            </Fragment>
          )}
        </div>

        <div className="secondary-kpi-section">
          {secondaryKpis
            .filter((kpi) => {
              const label = String(kpi.label || "").toLowerCase();
              return label.includes("nearing sla") || label.includes("active employee") || label.includes("online inbox") || label.includes("emergency inbox");
            })
            .map((kpi, index) => {
              const isHeader = !kpi.count && kpi.label === kpi.label?.toUpperCase();
              return (
                <div key={index} className={`secondary-kpi-item ${isHeader ? "sec-kpi-header" : ""}`}>
                  <span className="sec-kpi-label">
                    {kpi.link ? (
                      kpi.link.includes("digit-ui/") ? (
                        <Link to={kpi.link} style={{ color: "inherit", textDecoration: "none" }}>
                          {kpi.label}
                        </Link>
                      ) : (
                        <a href={kpi.link} style={{ color: "inherit", textDecoration: "none" }}>
                          {kpi.label}
                        </a>
                      )
                    ) : (
                      kpi.label
                    )}
                  </span>
                  {!isHeader && <span className="sec-kpi-value">{kpi.count ? kpi.count : <span className="sec-kpi-dot"></span>}</span>}
                </div>
              );
            })}
        </div>
      </div>

      <div className="card-footer-row">
        <div className="footer-links">
          <span className="pill-link" style={{ cursor: "pointer" }}>
            {t("View Reports")}
            <ArrowForward />
          </span>
          <span className="pill-link" style={{ cursor: "pointer" }}>
            + {getNewButtonText(moduleName, kpis, links)}
          </span>
        </div>
        <button className="details-btn" onClick={handleDetailsClick}>
          {t("Details")}
        </button>
      </div>
    </div>
  );
};

export { EmployeeModuleCard, ModuleCardFullWidth };
