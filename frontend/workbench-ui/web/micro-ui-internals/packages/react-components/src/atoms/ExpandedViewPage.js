import React, { Fragment, useEffect, useState, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import ModuleHeader from "./ModuleHeader";
import { ArrowLeft, HomeIcon } from "./svgindex";
import { useTranslation } from "react-i18next";
import ExpandedViewContext from "./ExpandedViewContext";
import ModuleLinksView from "./ModuleLinksView";

const ExpandedViewPage = ({ modules = [] }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();

  const sessionData = Digit.SessionStorage.get("MODULE_DETAILS") || null;

  const locationState = sessionData || location.state || {};
  // const locationState = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const moduleNameFromQuery = queryParams.get("moduleName");

  const moduleName = locationState.moduleName || moduleNameFromQuery;
  const links = locationState.links || [];

  const [activeModuleCode, setActiveModuleCode] = useState(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!moduleName && !location.state) {
      history.push("/digit-ui/employee");
      return;
    }

    if (moduleName) {
      const found = modules.find((m) => {
        return m.code === moduleName || t(`ACTION_TEST_${m.code}`) === moduleName || m.name === moduleName;
      });

      if (found) {
        setActiveModuleCode(found.code);
      } else {
        setActiveModuleCode(moduleName);
      }
    }
  }, [location.state, moduleName, history, modules, t]);

  const sidebarList = modules.filter((m) => Digit.ComponentRegistryService.getComponent(`${m.code}Card`));

  const activeModuleLabel = useMemo(() => {
    if (!activeModuleCode) return "";

    const foundModule = modules.find((m) => m.code === activeModuleCode);

    if (foundModule) {
      return t(`ACTION_TEST_${foundModule.code}`);
    }

    return moduleName || activeModuleCode;
  }, [activeModuleCode, modules, moduleName, t]);

  const breadcrumbs = [{ icon: HomeIcon, path: "/digit-ui/employee" }, { label: activeModuleLabel }];

  const renderContent = () => {
    if (!activeModuleCode) return null;

    const CardComponent = Digit.ComponentRegistryService.getComponent(`${activeModuleCode}Card`);

    if (CardComponent) {
      return (
        <ExpandedViewContext.Provider value={{ isExpandedView: true }}>
          <CardComponent />
        </ExpandedViewContext.Provider>
      );
    }

    if ((activeModuleCode === moduleName || t(`ACTION_TEST_${activeModuleCode}`) === moduleName) && links.length > 0) {
      return <ModuleLinksView links={links} moduleName={moduleName || ""} />;
    }

    return <div className="no-links-msg">MODULE CONTENT NOT FOUND FOR {activeModuleCode}.</div>;
  };

  if (!location.state && !moduleName) return null;

  const handleClick = async (mod) => {
    Digit.SessionStorage.set("MODULE_DETAILS", {
      moduleName: mod.code,
    });
    setActiveModuleCode(mod.code);
    setIsMobileMenuOpen(false);
  };
  return (
    <Fragment>
      <div className="ground-container employee-app-container employee-app-homepage-container">
        <ModuleHeader
          leftContent={
            <Fragment>
              <ArrowLeft className="icon" />
              BACK
            </Fragment>
          }
          onLeftClick={() => window.history.back()}
          breadcrumbs={breadcrumbs}
        />

        <div className="expanded-page-container">
          <div className="mobile-sidebar-toggle" onClick={() => setIsMobileMenuOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hamburger-icon">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{activeModuleLabel || "Select Module"}</span>
          </div>

          {isMobileMenuOpen && <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>}

          <div className={`expanded-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <span className="sidebar-title">ALL MODULES</span>
              {/* Close button for mobile */}
              <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
                ✕
              </button>
            </div>
            <div className="sidebar-menu">
              {sidebarList.map((mod, idx) => {
                const displayName = t(`ACTION_TEST_${mod.code}`) || mod.name;
                const isActive = mod.code === activeModuleCode;

                return (
                  <div
                    key={idx}
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      handleClick(mod);
                    }}
                  >
                    <div className="sidebar-icon-placeholder">
                      <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" />
                        <path d="M12 22v-9.5" />
                        <path d="M20 6.5l-8 4.5-8-4.5" />
                      </svg>
                    </div>

                    <span className="sidebar-text">{displayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🔹 RIGHT CONTENT */}
          <div className="expanded-content-area" style={{ flex: 1 }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default ExpandedViewPage;
