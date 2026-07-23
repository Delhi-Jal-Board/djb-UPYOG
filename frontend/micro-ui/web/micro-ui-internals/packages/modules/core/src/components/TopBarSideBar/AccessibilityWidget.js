import React, { useState, useRef, useEffect } from "react";
import { useAccessibility } from "../../context/AccessibilityContext";

/* ─── Inline SVG icons (no external dep) ─────────────────────────── */
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
    aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
  </svg>
);

const AccessibilityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    <path d="M15.5 11h-7a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5z" />
    <path d="M12 11v6" />
    <path d="M10 21l2-4 2 4" />
  </svg>
);

/* ─── Main Widget ─────────────────────────────────────────────────── */
const AccessibilityWidget = () => {
  const { fontSize, setFontSize, theme, setTheme, MIN_FONT, MAX_FONT, DEFAULT_FONT, STEP } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isDark = theme === "dark";

  const handleIncrease = () => setFontSize(fontSize + STEP);
  const handleReset   = () => setFontSize(DEFAULT_FONT);
  const handleDecrease = () => setFontSize(fontSize - STEP);
  const toggleTheme   = () => setTheme(isDark ? "light" : "dark");

  const isMaxFont = fontSize >= MAX_FONT;
  const isMinFont = fontSize <= MIN_FONT;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="accessibility-dropdown-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
      <button 
        className="accessibility-dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Accessibility options"
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "transparent", border: "1px solid #e5e7eb", borderRadius: "20px", 
          padding: "4px 10px", cursor: "pointer", color: "#374151"
        }}
      >
        <AccessibilityIcon />
        <span style={{ fontSize: "12px", fontWeight: "600" }}>Accessibility</span>
      </button>

      {isOpen && (
        <div 
          className="accessibility-dropdown-menu" 
          style={{
            position: "absolute", top: "100%", right: "0", marginTop: "8px",
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", zIndex: 999, padding: "8px"
          }}
        >
          <div className="accessibility-widget" role="group" aria-label="Accessibility options" style={{ border: "none", padding: "0" }}>

      {/* ── Font size controls ─────────────────────────── */}
      <div className="a11y-font-group" aria-label="Text size">
        <button
          className={`a11y-btn a11y-font-btn${isMinFont ? " a11y-btn--disabled" : ""}`}
          onClick={handleDecrease}
          disabled={isMinFont}
          aria-label="Decrease text size"
          title="Decrease text size (A-)"
        >
          <span className="a11y-font-label a11y-font-label--sm">A</span>
          <span className="a11y-font-minus" aria-hidden="true">-</span>
        </button>

        <button
          className="a11y-btn a11y-font-btn a11y-font-btn--reset"
          onClick={handleReset}
          aria-label="Reset text size to default"
          title="Reset text size to default"
        >
          <span className="a11y-font-label a11y-font-label--md">A</span>
        </button>

        <button
          className={`a11y-btn a11y-font-btn${isMaxFont ? " a11y-btn--disabled" : ""}`}
          onClick={handleIncrease}
          disabled={isMaxFont}
          aria-label="Increase text size"
          title="Increase text size (A+)"
        >
          <span className="a11y-font-label a11y-font-label--lg">A</span>
          <span className="a11y-font-plus" aria-hidden="true">+</span>
        </button>
      </div>

      {/* ── Divider ───────────────────────────────────── */}
      <div className="a11y-divider" aria-hidden="true" />

      {/* ── Theme toggle ──────────────────────────────── */}
      <button
        className={`a11y-btn a11y-theme-btn${isDark ? " a11y-theme-btn--dark" : " a11y-theme-btn--light"}`}
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
        <span className="a11y-theme-label">{isDark ? "Light" : "Dark"}</span>
      </button>


          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityWidget;
