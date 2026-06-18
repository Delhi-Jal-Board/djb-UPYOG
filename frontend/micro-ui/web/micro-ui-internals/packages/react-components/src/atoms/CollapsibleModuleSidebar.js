import React, { Fragment, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ReactDOM from "react-dom";

const getLinkLabelText = (linkItem) => String(linkItem?.label || "");
const shouldRenderLinkCount = (count) => count !== undefined && count !== null && count !== "";

const countStyle = {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    color: "#1a67a3",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 10px",
    borderRadius: "12px",
    boxShadow: "0 2px 4px rgba(26, 103, 163, 0.1)",
    border: "1px solid #bfdbfe",
    transition: "all 0.3s ease",
    marginLeft: "auto"
};

const CollapsibleModuleSidebar = ({ links = [], moduleName = "Dashboard", Icon }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const [portalTarget, setPortalTarget] = useState(null);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        setPortalTarget(document.getElementById("module-sidebar-portal-target"));
    }, []);

    const renderNavLink = (linkItem, index, extraClass = "") => {
        const isActive = location.pathname === linkItem.link;
        const labelText = getLinkLabelText(linkItem);
        const initials = labelText.substring(0, 2).toUpperCase();

        const LinkContent = (
            <div className="nav-item-content" style={{ display: "flex", alignItems: "center", padding: "12px", justifyContent: isCollapsed ? "center" : "flex-start", width: "100%", boxSizing: "border-box" }}>
                <div className="nav-icon-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", flexShrink: 0, transition: "transform 0.2s" }}>
                    {linkItem.icon ? linkItem.icon : (
                        <span className="fallback-initial" style={{ width: "100%", height: "100%", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: "14px", fontWeight: "600", color: isActive ? "#ffffff" : "#475569", backgroundColor: isActive ? "#1a67a3" : "#f1f5f9", boxShadow: isActive ? "0 4px 10px rgba(26,103,163,0.3)" : "none" }}>
                            {initials}
                        </span>
                    )}
                </div>
                {!isCollapsed && (
                    <div style={{ display: "flex", alignItems: "center", flex: 1, overflow: "hidden", marginLeft: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
                            <span className="nav-text" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.95rem", fontWeight: isActive ? "600" : "500", color: isActive ? "#1a67a3" : "#475569" }}>
                                {labelText}
                            </span>
                            {linkItem.subLabel && (
                                <span className="nav-subtext" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {linkItem.subLabel}
                                </span>
                            )}
                        </div>
                        {shouldRenderLinkCount(linkItem.count) && <span className="nav-count" style={countStyle}>{linkItem.count}</span>}
                    </div>
                )}
            </div>
        );

        const className = `nav-item ${isActive ? "active" : ""} ${extraClass}`;
        const navLinkStyle = {
            borderRadius: "10px",
            display: "block",
            textDecoration: "none",
            ...(isActive && !isCollapsed ? { background: "linear-gradient(90deg, #eff6ff 0%, #ffffff 100%)", borderLeft: "4px solid #1a67a3" } : {})
        };

        return (
            <div key={index} className={className} title={isCollapsed ? labelText : ""}>
                {linkItem.link ? (
                    linkItem.link.includes("digit-ui") ? (
                        <Link to={linkItem.link} className="nav-link" style={navLinkStyle}>{LinkContent}</Link>
                    ) : (
                        <a href={linkItem.link} className="nav-link" style={navLinkStyle}>{LinkContent}</a>
                    )
                ) : (
                    <div className="nav-link disabled" style={{ borderRadius: "10px", display: "block" }}>{LinkContent}</div>
                )}
            </div>
        );
    };

    // Mobile horizontal tab bar
    const renderMobileTab = (linkItem, index) => {
        const isActive = location.pathname === linkItem.link;
        const labelText = getLinkLabelText(linkItem);
        const initials = labelText.substring(0, 2).toUpperCase();

        const content = (
            <div className={`mobile-tab-item ${isActive ? "active" : ""}`}>
                <div className="mobile-tab-icon">
                    {linkItem.icon ? linkItem.icon : <span className="mobile-tab-initial">{initials}</span>}
                </div>
                <div className="mobile-tab-copy">
                    <span className="mobile-tab-label">{labelText}</span>
                    {linkItem.subLabel ? <span className="mobile-tab-sublabel">{linkItem.subLabel}</span> : null}
                </div>
                {shouldRenderLinkCount(linkItem.count) ? <span className="mobile-tab-count" style={countStyle}>{linkItem.count}</span> : null}
            </div>
        );

        if (!linkItem.link) return <div key={index} className="mobile-tab-wrapper disabled">{content}</div>;

        return (
            <div key={index} className="mobile-tab-wrapper">
                {linkItem.link.includes("digit-ui") ? (
                    <Link to={linkItem.link}>{content}</Link>
                ) : (
                    <a href={linkItem.link}>{content}</a>
                )}
            </div>
        );
    };

    const collapseButton = (
        <button
            className="collapse-toggle"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
            }}
            aria-label="Toggle Sidebar"
            type="button"
            style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = "#1a67a3"; e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#fff"; }}
            onMouseOut={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isCollapsed ? (
                    <>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </>
                ) : (
                    <>
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </>
                )}
            </svg>
        </button>
    );

    return (
        <div className="module-sidebar-wrapper">
            {portalTarget && ReactDOM.createPortal(collapseButton, portalTarget)}
            {/* ── Mobile horizontal nav bar (visible only on mobile) ── */}
            {/* <nav className="mobile-tab-bar">
                {links.map((linkItem, index) => renderMobileTab(linkItem, index))}
            </nav> */}

            {/* ── Desktop sidebar (hidden on mobile) ── */}
            <aside
                id="module-sidebar"
                className={`premium-sidebar ${isCollapsed ? "collapsed" : "expanded"}`}
                style={{
                    boxShadow: "rgba(0, 0, 0, 0.05) 4px 0px 20px",
                    borderRight: "1px solid rgba(229, 231, 235, 0.5)",
                    background: "rgba(255, 255, 255, 0.98)",
                    backdropFilter: "blur(12px)",
                    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s",
                }}
            >
                <div className="sidebar-header" style={{
                    display: "flex",
                    flexDirection: isCollapsed ? "column" : "row",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: "32px",
                    padding: "10px 0",
                    gap: isCollapsed ? "24px" : "0"
                }}>
                    <div className="brand-container" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                        <div className="brand-icon" style={{ width: "36px", height: "36px", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", borderRadius: "12px", background: "linear-gradient(135deg, #1a67a3, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                            {Icon || <div className="default-icon"></div>}
                        </div>
                        {!isCollapsed && <h2 className="brand-name" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px", margin: 0 }}>{moduleName}</h2>}
                    </div>
                </div>
                <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {links.map((linkItem, index) => renderNavLink(linkItem, index))}
                </nav>
            </aside>
        </div>
    );
};

export default CollapsibleModuleSidebar;
