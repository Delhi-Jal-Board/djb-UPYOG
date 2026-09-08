import {
  BackButton,
  BillsIcon,
  CitizenHomeCard,
  CitizenInfoLabel,
  FSMIcon,
  Loader,
  MCollectIcon,
  OBPSIcon,
  PGRIcon,
  PTIcon,
  TLIcon,
  WSICon,
  PTRIcon,
  CHBIcon,
  FinanceChartIcon,
  Toast,
  LeftArrowIcon,
  RightArrowIcon,
  PresentationIcon,
} from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import EmployeeDashboard from "./EmployeeDashboard";
import RecentActivity from "./RecentActivity";
import NewsAndEvents from "./NewsAndEvents";

/* Feature :: Citizen All service screen cards
 */
export const processLinkData = (newData, code, t) => {
  const obj = newData?.[`${code}`];
  if (obj) {
    obj.map((link) => {
      link.link = link["navigationURL"];
      link.i18nKey = t(link["name"]);
      return link;
    });
  }
  const newObj = {
    links: obj?.reverse(),
    header: Digit.Utils.locale.getTransformedLocale(`ACTION_TEST_${code}`),
    iconName: `CITIZEN_${code}_ICON`,
  };
  if (code === "FSM") {
    const roleBasedLoginRoutes = [
      {
        role: "FSM_DSO",
        from: "/digit-ui/citizen/fsm/dso-dashboard",
        dashoardLink: "CS_LINK_DSO_DASHBOARD",
        loginLink: "CS_LINK_LOGIN_DSO",
      },
    ];
    roleBasedLoginRoutes.forEach(({ role, from, loginLink, dashoardLink }) => {
      if (Digit.UserService.hasAccess(role))
        newObj?.links?.push({
          link: from,
          i18nKey: t(dashoardLink),
        });
      else
        newObj?.links?.push({
          link: `/digit-ui/citizen/login`,
          state: { role: "FSM_DSO", from },
          i18nKey: t(loginLink),
        });
    });
  }
  if (code === "WT" || code === "MT") {
    const fallbackLinks =
      code === "WT"
        ? [
          { link: "/digit-ui/citizen/wt/request-service", i18nKey: t("WT_REQUEST_TANKER") },
          { link: "/digit-ui/citizen/wt/status", i18nKey: t("WT_VIEW_APPLICATIONS") },
        ]
        : [
          { link: "/digit-ui/citizen/wt/request-service", i18nKey: t("MT_REQUEST_TANKER") },
          { link: "/digit-ui/citizen/wt/status", i18nKey: t("MT_VIEW_APPLICATIONS") },
        ];

    const role = code === "WT" ? "WT_VENDOR" : "MT_VENDOR";
    const from = code === "WT" ? "/digit-ui/citizen/wt/wt-Vendor" : "/digit-ui/citizen/wt/mt-Vendor";
    const loginLink = code === "WT" ? "WT_VENDOR_ACTIONS" : "MT_VENDOR_LOGIN";

    if (Digit.UserService.hasAccess(role))
      fallbackLinks.push({
        link: from,
        i18nKey: t(loginLink),
      });
    else
      fallbackLinks.push({
        link: `/digit-ui/citizen/login`,
        state: { role: role, from },
        i18nKey: t(loginLink),
      });

    return {
      links: fallbackLinks,
      header: t(Digit.Utils.locale.getTransformedLocale(`ACTION_TEST_${code}`)),
      iconName: `CITIZEN_${code}_ICON`,
    };
  }

  return newObj;
};

const iconSelector = (code) => {
  switch (code) {
    case "PT":
      return <PTIcon className="fill-path-primary-main" />;
    case "WS":
      return <WSICon className="fill-path-primary-main" />;
    case "FSM":
      return <FSMIcon className="fill-path-primary-main" />;
    case "MCollect":
      return <MCollectIcon className="fill-path-primary-main" />;
    case "PGR":
      return <PGRIcon className="fill-path-primary-main" />;
    case "TL":
      return <TLIcon className="fill-path-primary-main" />;
    case "OBPS":
      return <OBPSIcon className="fill-path-primary-main" />;
    case "Bills":
      return <BillsIcon className="fill-path-primary-main" />;
    case "PTR":
      return <PTRIcon className="fill-path-primary-main" />;
    case "CHB":
      return <CHBIcon className="fill-path-primary-main" />;
    case "ADS":
      return <CHBIcon className="fill-path-primary-main" />;
    case "WT":
      return <CHBIcon className="fill-path-primary-main" />;
    default:
      return <PTIcon className="fill-path-primary-main" />;
  }
};

const CitizenHome = ({ modules, getCitizenMenu, fetchedCitizen, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <Loader />;
  }

  const paymentModule = modules.find(({ code }) => code === "Payment");
  const otherModules = modules.filter(({ code }) => code !== "Payment");
  const moduleArray = paymentModule ? [paymentModule, ...otherModules] : otherModules;

  const renderCitizenCard = (mod, index) => {
    const { code } = mod;
    const isAuthWT = code === "WT" && Digit.Utils.wtAccess();

    const Card =
      code === "WT" && !isAuthWT
        ? null
        : Digit.ComponentRegistryService.getComponent(
          code === "WT" ? "WTCitizenCard" : code === "MT" ? "MTCitizenCard" : code === "TP" ? "TPCitizenCard" : `${code}Card`
        );

    if (Card) return <Card key={index} />;

    let mdmsDataObj;
    if (fetchedCitizen) mdmsDataObj = fetchedCitizen ? processLinkData(getCitizenMenu, code, t) : undefined;

    if (mdmsDataObj?.links?.length > 0) {
      return (
        <CitizenHomeCard
          key={index}
          header={t(mdmsDataObj?.header)}
          links={mdmsDataObj?.links?.filter((ele) => ele?.link)?.sort((x, y) => x?.orderNumber - y?.orderNumber)}
          Icon={() => iconSelector(code)}
          Info={
            code === "OBPS"
              ? () => (
                <CitizenInfoLabel
                  style={{ margin: "0px", padding: "10px" }}
                  info={t("CS_FILE_APPLICATION_INFO_LABEL")}
                  text={t(`BPA_CITIZEN_HOME_STAKEHOLDER_INCLUDES_INFO_LABEL`)}
                />
              )
              : null
          }
          isInfo={code === "OBPS" ? true : false}
        />
      );
    }
    return null;
  };

  return (
    <React.Fragment>
      <div className="citizen-all-services-wrapper">
        <BackButton />
        <div className="citizenAllServiceGrid">{moduleArray.filter((mod) => mod).map((mod, index) => renderCitizenCard(mod, index))}</div>
      </div>
    </React.Fragment>
  );
};

export const engagementModuleCodes = [
  "ENGAGEMENT",
  "Engagement",
  "PGR",
  "Events",
  "Documents",
  "Public Message broadcast",
  "MessageBroadcast",
  "Broadcast",
  "Surveys",
];

/* Maps each engagement module code to a Tabler icon name + display label */
const engagementModuleMeta = {
  PGR: { icon: "speakerphone", label: "Grievances" },
  Events: { icon: "calendar-event", label: "Events" },
  Surveys: { icon: "clipboard-list", label: "Surveys" },
  Broadcast: { icon: "broadcast", label: "Broadcasts" },
  MessageBroadcast: { icon: "broadcast", label: "Broadcasts" },
  "Public Message broadcast": { icon: "broadcast", label: "Broadcasts" },
  Documents: { icon: "file-text", label: "Documents" },
  ENGAGEMENT: { icon: "users", label: "Engagement" },
  Engagement: { icon: "users", label: "Engagement" },
};

const employeeModuleAccess = {
  ADS: "adsAccess",
  ASSET: "assetAccess",
  BPA: "BPAAccess",
  BPAREG: "BPAREGAccess",
  CHB: "chbAccess",
  Documents: "engagementAccess",
  EW: "ewAccess",
  Engagement: "engagementAccess",
  Events: "engagementAccess",
  FSM: "fsmAccess",
  FORMIO: "formioAccess",
  HRMS: "hrmsAccess",
  MCollect: "mCollectAccess",
  MT: "mtAccess",
  NOC: "NOCAccess",
  PGR: "pgrAccess",
  PT: "ptAccess",
  PTR: "ptrAccess",
  RWH: "rwhAccess",
  SV: "svAccess",
  SW: "swAccess",
  Surveys: "engagementAccess",
  TL: "tlAccess",
  WT: "wtAccess",
  WS: "wsAccess",
};

const getAccessibleEmployeeModules = (modules) =>
  modules.filter((module) => {
    const accessChecker = employeeModuleAccess[module?.code?.toUpperCase()];
    return !accessChecker || Digit.Utils?.[accessChecker]?.();
  });

/* ─── Engagement Panel ───────────────────────────────────────────────────────
 * Replaces the old ModuleCarousel for engagement modules.
 * Renders a soft shell with a chip row for filtering, and renders each
 * module's registered Card component below (if one exists).
 * ─────────────────────────────────────────────────────────────────────────── */
export const EngagementPanel = ({ modules, t }) => {
  const [activeCode, setActiveCode] = React.useState("PGR");
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  /* Build deduplicated chip list — collapse duplicate broadcast variants */
  const chips = React.useMemo(() => {
    const seen = new Set();
    return modules
      .map((mod) => {
        const meta = engagementModuleMeta[mod.code] || { icon: "apps", label: mod.code };
        return { code: mod.code, ...meta };
      })
      .filter(({ label }) => {
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      });
  }, [modules]);

  const handleChipClick = (code) => {
    /* Toggle: clicking the active chip clears the filter */
    setActiveCode((prev) => (prev === code ? null : code));
  };

  const visibleModules = activeCode
    ? modules.filter((mod) => mod.code === activeCode)
    : modules;

  if (!modules || modules.length === 0) return null;

  return (
    <div className="engagement-panel">
      {/* Header row */}
      <div 
        className="engagement-panel__header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ cursor: "pointer", userSelect: "none" }}
      >
        <div className="engagement-panel__title-group">
          <span className="engagement-panel__pulse-dot" aria-hidden="true" />
          <span className="engagement-panel__title">{t("Community engagement")}</span>
        </div>
        <div className="engagement-panel__collapse-icon" style={{ color: "#64748b" }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </div>
      </div>

      {/* Collapsible Content */}
      <div 
        className={`engagement-panel__content ${isCollapsed ? 'collapsed' : ''}`}
      >
        <div className="engagement-panel__content-inner">

      {/* Chip / pill navigation row */}
      <div className="engagement-panel__chip-row" role="list">
        {chips.map(({ code, icon, label }) => (
          <button
            key={code}
            role="listitem"
            className={`engagement-chip${activeCode === code ? " engagement-chip--active" : ""}`}
            onClick={() => handleChipClick(code)}
            aria-pressed={activeCode === code}
          >
            <i className={`ti ti-${icon}`} aria-hidden="true" />
            {t(label)}
          </button>
        ))}
      </div>

      {/* Registered module cards (filtered by active chip) */}
      {visibleModules.some((mod) => Digit.ComponentRegistryService.getComponent(`${mod.code}Card`)) && (
        <div className="engagement-panel__cards">
          {visibleModules.map((mod, index) => {
            const Card = Digit.ComponentRegistryService.getComponent(`${mod.code}Card`);
            if (!Card) return null;
            return <Card key={index} />;
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export const ModuleCarousel = ({ modules, title, renderCard, className }) => {
  const scrollContainerRef = React.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);

      if (clientWidth > 0) {
        if (!scrollContainerRef.current._carouselGap) {
          const computedStyle = window.getComputedStyle(scrollContainerRef.current);
          scrollContainerRef.current._carouselGap = parseInt(computedStyle.columnGap) || 0;
        }
        const gap = scrollContainerRef.current._carouselGap;
        const total = Math.ceil((scrollWidth + gap) / (clientWidth + gap)) || 1;
        setTotalPages(total);
        const current = Math.round(scrollLeft / (clientWidth + gap)) + 1;
        setCurrentPage(Math.min(Math.max(current, 1), total));
      }
    }
  };

  React.useEffect(() => {
    let timeoutId;
    const debouncedScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };

    handleScroll();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", debouncedScroll);
    }
    window.addEventListener("resize", handleScroll);

    return () => {
      if (container) container.removeEventListener("scroll", debouncedScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [modules]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const gap = parseInt(window.getComputedStyle(scrollContainerRef.current).columnGap) || 0;
      const scrollAmount = direction === "left" ? -(scrollContainerRef.current.clientWidth + gap) : scrollContainerRef.current.clientWidth + gap;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!modules || modules.length === 0) return null;

  return (
    <div className={`module-carousel-section ${className || ""}`} style={{ marginBottom: "20px", marginTop: "10px" }}>
      <div className="module-carousel-header" style={{ display: "flex", justifyContent: title ? "space-between" : "flex-end", alignItems: "center" }}>
        {title && <h3 style={{ margin: 0, fontWeight: "700" }}>{title}</h3>}

        <div className="module-carousel-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button className="carousel-arrow left" onClick={() => scroll("left")} aria-label="Previous" disabled={!showLeftArrow}>
            <LeftArrowIcon />
          </button>
          <span className="carousel-pagination-text" style={{ fontSize: "14px", fontWeight: "500", color: "#505A5F" }}>
            {currentPage} / {totalPages}
          </span>
          <button className="carousel-arrow right" onClick={() => scroll("right")} aria-label="Next" disabled={!showRightArrow}>
            <RightArrowIcon />
          </button>
        </div>
      </div>

      <div className="module-carousel-wrapper">
        <div className="carousel-track" ref={scrollContainerRef} onScroll={handleScroll}>
          {modules.map((mod, index) => {
            if (renderCard) return renderCard(mod, index);
            const { code } = mod;
            const Card = Digit.ComponentRegistryService.getComponent(`${code}Card`);
            if (!Card) return null;
            return <Card key={index} />;
          })}
        </div>
      </div>
    </div>
  );
};

const EmployeeHome = ({ modules }) => {
  const { t } = useTranslation();
  const userInfo = JSON.parse(localStorage.getItem("Employee.user-info"));
  const name = userInfo?.name;
  const dashboardCemp = Digit.UserService.hasAccess(["DASHBOARD_EMPLOYEE"]) ? true : false;
  const [showToast, setShowToast] = React.useState(null);

  const clearToast = () => {
    setShowToast(null);
  };

  if (window.Digit.SessionStorage.get("PT_CREATE_EMP_TRADE_NEW_FORM")) window.Digit.SessionStorage.set("PT_CREATE_EMP_TRADE_NEW_FORM", {});

  const { data: dashboardConfig } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "common-masters", [{ name: "CommonConfig" }], {
    select: (data) => {
      const formattedData = data?.["common-masters"]?.["CommonConfig"];
      const cityDashboardObject = formattedData?.find((item) => item?.name === "cityDashboardEnabled");
      return cityDashboardObject?.isActive;
    },
  });

  const { data: dashboardUrl } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "tenant", [{ name: "citymodule" }], {
    select: (data) => {
      const citymodules = data?.tenant?.citymodule || [];
      const dashboardModule = citymodules.find((item) => item?.dashboards);
      return dashboardModule?.dashboards;
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
    if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
    return { text: "Good Evening", emoji: "🌙" };
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const greeting = getGreeting();

  const accessibleModules = getAccessibleEmployeeModules(modules);
  // const engagementModules = accessibleModules.filter((mod) => engagementModuleCodes.includes(mod?.code));
  const mainModules = accessibleModules.filter((mod) => !engagementModuleCodes.includes(mod?.code));

  return (
    <div className="employee-app-homepage-container">
      {dashboardConfig && dashboardCemp ? <EmployeeDashboard modules={modules} /> : null}

      <div className="home-header">
        <div className="header-top-section">
          <div className="header-greeting-area">
            <h1 className="greeting-title">
              <span className="greeting-emoji">{greeting.emoji}</span> {t(greeting.text)}, {name}
            </h1>
            <p className="greeting-date">{getFormattedDate()}</p>
          </div>
          <div className="header-right-area">
            <button
              onClick={() => {
                if (dashboardUrl) {
                  window.open(dashboardUrl, "_blank");
                } else {
                  setShowToast({ label: t("Dashboard URL not found"), error: true });
                }
              }}
              className="view-dashboard-btn"
            >
              <span className="btn-text">{t("View Analytics")}</span>
              <div className="btn-icon-bg">
                <FinanceChartIcon className="finance-chart-icon" />
              </div>
            </button>
            <div className="header-icon-area">
              <PresentationIcon />
            </div>
            <div className="header-actions-area"></div>
          </div>
        </div>
      </div>

      {showToast && <Toast label={showToast.label} onClose={clearToast} error={showToast?.error} />}

      <div className="employee-home-main-content">
        <div className="ground-container">
          <div className="top-info-cards-wrapper">
            <NewsAndEvents />
            <RecentActivity />
          </div>

          {/* Core services — unchanged carousel */}
          <ModuleCarousel modules={mainModules} title={t("Core Services")} className="core-carousel-section" />

          {/* Engagement panel temporarily disabled. */}
          {/* {engagementModules.length > 0 && <EngagementPanel modules={engagementModules} t={t} />} */}
        </div>
      </div>
    </div>
  );
};

export const AppHome = ({ userType, modules, getCitizenMenu, fetchedCitizen, isLoading }) => {
  if (userType === "citizen") {
    return <CitizenHome modules={modules} getCitizenMenu={getCitizenMenu} fetchedCitizen={fetchedCitizen} isLoading={isLoading} />;
  }
  return <EmployeeHome modules={modules} />;
};
