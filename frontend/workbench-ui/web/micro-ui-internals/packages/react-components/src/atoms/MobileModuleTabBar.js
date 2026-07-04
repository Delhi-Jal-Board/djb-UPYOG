import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

const MobileModuleTabBar = ({ links = [], moduleName = "" }) => {
  const location = useLocation();
  const activeRef = useRef(null);

  /* Auto-scroll the active tab into view on route change */
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
    const initials = linkItem.label.substring(0, 2).toUpperCase();

    const tabClass = `mtb-tab${isActive ? " mtb-tab--active" : ""}${!linkItem.link ? " mtb-tab--disabled" : ""}`;

    const inner = (
      <span className={tabClass} ref={isActive ? activeRef : null}>
        <span className="mtb-tab__icon">
          {linkItem.icon ? (
            linkItem.icon
          ) : (
            <span className="mtb-tab__initials">{initials}</span>
          )}
        </span>
        <span className="mtb-tab__label">{linkItem.label}</span>
        {isActive && <span className="mtb-tab__indicator" />}
      </span>
    );

    if (!linkItem.link) {
      return <div key={index}>{inner}</div>;
    }

    if (linkItem.link.includes("digit-ui")) {
      return (
        <Link key={index} to={linkItem.link} style={{ textDecoration: "none" }}>
          {inner}
        </Link>
      );
    }

    return (
      <a key={index} href={linkItem.link} style={{ textDecoration: "none" }}>
        {inner}
      </a>
    );
  };

  return (
    <>
      {/* Scoped styles — no class name collisions with the sidebar CSS */}
      <style>{`
        .mtb-root {
          display: none; /* hidden on desktop */
        }

        @media (max-width: 768px) {
          /* ── Fixed bar — completely outside any flex/grid layout ── */
          .mtb-root {
            display: flex;
            position: fixed;
            top: 56px; /* adjust to sit below your app header height */
            left: 0;
            right: 0;
            z-index: 9999;
            background: #ffffff;
            border-bottom: 1.5px solid #e5e7eb;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 0 8px;
            gap: 2px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          }

          .mtb-root::-webkit-scrollbar {
            display: none;
          }

          /* ── Push page content down so it is not hidden behind the bar ── */
          /* Add this class to whatever element wraps your page content     */
          .mtb-page-offset {
            padding-top: 48px !important;
          }

          /* ── Each tab ── */
          .mtb-tab {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 14px;
            white-space: nowrap;
            cursor: pointer;
            position: relative;
            border-bottom: 2px solid transparent;
            color: #6b7280;
            transition: color 0.18s ease;
            flex-shrink: 0;
          }

          .mtb-tab:hover {
            color: #1a67a3;
          }

          .mtb-tab--active {
            color: #1a67a3;
            border-bottom-color: #1a67a3;
          }

          .mtb-tab--disabled {
            opacity: 0.45;
            pointer-events: none;
          }

          /* ── Icon wrapper ── */
          .mtb-tab__icon {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .mtb-tab__icon svg {
            width: 16px;
            height: 16px;
          }

          /* ── Fallback initials badge ── */
          .mtb-tab__initials {
            font-size: 10px;
            font-weight: 700;
            background: #e5e7eb;
            color: #6b7280;
            border-radius: 4px;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: 0.5px;
          }

          .mtb-tab--active .mtb-tab__initials {
            background: #dbeafe;
            color: #1a67a3;
          }

          /* ── Label ── */
          .mtb-tab__label {
            font-size: 13px;
            font-weight: 500;
            line-height: 1;
          }

          .mtb-tab--active .mtb-tab__label {
            font-weight: 600;
          }

          /* ── Active underline indicator ── */
          .mtb-tab__indicator {
            display: none; /* handled by border-bottom on the tab itself */
          }
        }
      `}</style>

      <nav className="mtb-root" aria-label={`${moduleName} navigation`}>
        {links.map((linkItem, index) => renderTab(linkItem, index))}
      </nav>
    </>
  );
};

export default MobileModuleTabBar;