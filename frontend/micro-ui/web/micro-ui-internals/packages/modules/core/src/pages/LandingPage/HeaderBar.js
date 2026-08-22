import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import headerConfig from "./configs/headerConfig";
import ChangeLanguage from "../../components/ChangeLanguage";
import { useTranslation } from "react-i18next";


/* =========================
   🔹 HeaderBar Component
   ========================= */
const HeaderBar = ({ logoUrl, stateInfo }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { topBar, branding, navbar } = headerConfig;

  /* =========================
     🔹 States
  ========================= */
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayLogo = logoUrl || branding.logo;
  const orgName = topBar.organizationName;

  /* =========================
     🔹 Scroll Hide Header Logic
  ========================= */
  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (currentScroll > 60 && currentScroll > lastScrollY) {
        document.body.classList.add("upyog-scrolled");
      } else if (currentScroll < 40) {
        document.body.classList.remove("upyog-scrolled");
      }

      lastScrollY = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  /* =========================
     🔹 Close menus on outside click
  ========================= */
  useEffect(() => {
    const close = () => {
      setLoginDropdownOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <React.Fragment>
      {/* =========================
         🔹 Internal Styles (Scoped & Responsive)
      ========================= */}
      <style>{`
        .upyog-top-bar .employee-select-wrap,
        .employee-select-wrap select,
        .employee-select-wrap .select__control {
          margin-top: 2px !important;
          margin-bottom: 0 !important;
        }

        .header-login-dropdown {
          position: relative;
          display: inline-block;
        }

        .login-dropdown-menu {
          position: absolute;
          top: 110%;
          right: 0;
          background: #fff;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          width: 200px;
          z-index: 999;
          display: block;
        }

        .dropdown-item {
          display: block;
          padding: 10px 14px;
          color: #333;
          font-size: 14px;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .dropdown-item:hover {
          background: #f5f5f5;
        }

        /* Responsive Mobile Header Styling */
        .hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: #003366;
          cursor: pointer;
          padding: 8px;
          z-index: 1002;
          outline: none;
        }

        .mobile-language-selector {
          display: none;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-top: 1px solid #f1f5f9;
          width: 100%;
          font-size: 14.5px;
          font-weight: 600;
          color: #475569;
        }

        @media (max-width: 768px) {
          .upyog-top-bar {
            display: none !important;
          }
          
          body.upyog-scrolled {
            padding-top: 70px !important;
          }

          .upyog-header {
            padding: 12px 20px !important;
            height: 70px !important;
            box-sizing: border-box;
            transform: none !important;
            will-change: auto !important;
            position: relative;
            z-index: 1002 !important;
          }

          .upyog-scrolled .upyog-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 12px 20px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transform: none !important;
            will-change: auto !important;
            z-index: 1002 !important;
          }

          .brand-title {
            font-size: 20px !important;
          }

          .brand-subtitle {
            font-size: 9px !important;
          }

          .brand-mark {
            width: 38px !important;
            height: 38px !important;
            border-radius: 8px !important;
          }

          .hamburger-btn {
            display: block;
          }

          .upyog-nav {
            display: flex !important;
            flex-direction: column;
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            bottom: 0;
            background: #ffffff;
            z-index: 99999 !important;
            padding: 20px 24px !important;
            gap: 16px !important;
            overflow-y: auto;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -4px 0 16px rgba(0,0,0,0.05);
            align-items: stretch !important;
          }

          .upyog-nav.mobile-open {
            transform: translateX(0) !important;
          }

          .upyog-nav a.nav-hover-btn,
          .header-login-btn {
            display: block;
            width: 100%;
            padding: 12px 16px !important;
            box-sizing: border-box;
            text-align: left;
            font-size: 15px !important;
            border-radius: 8px !important;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            box-shadow: none !important;
            color: #1e293b !important;
          }

          .upyog-nav a.nav-hover-btn::after {
            display: none !important;
          }

          .upyog-nav a.nav-hover-btn:hover {
            background: #f1f5f9;
            color: #005bbb !important;
          }

          .header-login-dropdown {
            width: 100%;
          }

          .header-login-btn {
            background: linear-gradient(135deg, #005bbb, #003c8f);
            color: #ffffff !important;
            text-align: center !important;
          }

          .login-dropdown-menu {
            position: static !important;
            width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-top: 8px;
            background: #f8fafc;
          }

          .dropdown-item {
            padding: 12px 20px !important;
            border-bottom: 1px solid #edf2f7;
          }

          .dropdown-item:last-child {
            border-bottom: none;
          }

          .mobile-language-selector {
            display: flex;
            margin-top: auto;
          }
        }
      `}</style>

      {/* =========================
         🔹 Top Bar
      ========================= */}
      <div className="upyog-top-bar">
        <div className="upyog-top-left">
          {topBar.showLanguage && (
            <div style={{ display: "inline-block" }}>
              <ChangeLanguage dropdown />
            </div>
          )}
          <span className="pipe">|</span>
          <span>{t(orgName)}</span>
        </div>

        <div className="upyog-top-right">
          {topBar.socialLinks.map((item, index) => (
            <a
              key={index}
              href={item.url}
              className="icon-link"
              aria-label={item.name}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>

      {/* =========================
         🔹 Header + Navbar
      ========================= */}
      <div className="upyog-header">
        <div className="branding" onClick={() => { setMobileMenuOpen(false); window.location.href = "/digit-ui/home"; }} style={{ cursor: "pointer" }}>
          <div className="brand-mark">
            <img src="https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmycsh2g2wu7/b/DJB-EDP-LZ-UPYOG-DEV-ASSET-BUCKET-BOM/o/djb_logo.png" alt="DJB Logo" />
          </div>
          <div className="btx">
            <h1 className="brand-title">Delhi Jal Board</h1>
            <p className="brand-subtitle">Integrated Enterprise Management System</p>
          </div>
        </div>

        {/* Hamburger Menu Toggle Button */}
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? t("Close Menu") : t("Open Menu")}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        <nav className={`upyog-nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {navbar.map((item, index) => {
            if (item.type === "dropdown") {
              return (
                <div
                  key={index}
                  className="header-login-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="header-login-btn"
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                  >
                    {t(item.label)}
                  </button>

                  {loginDropdownOpen && (
                    <div className="login-dropdown-menu">
                      {item.children?.map((child, idx) => (
                        <a
                          key={idx}
                          href={child.link}
                          className="dropdown-item"
                          onClick={(e) => {
                            e.preventDefault();
                            setLoginDropdownOpen(false);
                            setMobileMenuOpen(false);
                            history.push(child.link);
                          }}
                        >
                          {t(child.label)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* =========================
               🔹 REGISTER BUTTON
            ========================= */
            if (item.type === "button") {
              return (
                <a
                  key={index}
                  href={item.link || "#"}
                  className="header-login-btn"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (item.link) {
                      e.preventDefault();
                      history.push(item.link);
                    }
                  }}
                >
                  {t(item.label)}
                </a>
              );
            }

            /* =========================
               🔹 NORMAL NAV ITEMS
            ========================= */
            return (
              <a
                key={index}
                href={item.link || "#"}
                className="nav-hover-btn"
                target={item.external ? "_blank" : "_self"}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (item.link === "#") {
                    e.preventDefault();
                  } else if (item.link && !item.external) {
                    e.preventDefault();
                    history.push(item.link);
                  }
                }}
              >
                {t(item.label)}
              </a>
            );
          })}

          {/* Mobile Language Selector */}
          <div className="mobile-language-selector">
            <span>{t("Language")}:</span>
            <div style={{ marginLeft: "8px" }}>
              <ChangeLanguage dropdown />
            </div>
          </div>
        </nav>
      </div>


    </React.Fragment>
  );
};

export default HeaderBar;
