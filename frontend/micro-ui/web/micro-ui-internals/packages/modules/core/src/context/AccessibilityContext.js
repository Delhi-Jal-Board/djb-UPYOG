import React, { createContext, useContext, useEffect, useState } from "react";

const AccessibilityContext = createContext({
  fontSize: 16,
  setFontSize: () => {},
  theme: "light",
  setTheme: () => {},
});

const STORAGE_KEY_FONT = "djb_fontSize";
const STORAGE_KEY_THEME = "djb_theme";
const DEFAULT_FONT = 16;
const MIN_FONT = 12;
const MAX_FONT = 22;
const STEP = 2;

/** Apply font size to <html> and persist */
export const applyFontSize = (size) => {
  const clamped = Math.min(MAX_FONT, Math.max(MIN_FONT, size));
  
  // Set html font-size to scale rem-based elements (text and icons)
  // This avoids zooming the entire layout, adhering to user requirement
  document.documentElement.style.fontSize = clamped + "px";
  
  if (typeof window !== "undefined" && document.documentElement.style.zoom) {
    document.documentElement.style.zoom = ""; // Clear any leftover zoom
  }

  localStorage.setItem(STORAGE_KEY_FONT, String(clamped));
  return clamped;
};

/** Apply theme to <html data-theme> and persist */
export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY_THEME, theme);
};

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT);
  const [theme, setThemeState] = useState("light");

  // Restore saved preferences on mount (once)
  useEffect(() => {
    const savedFont = parseInt(localStorage.getItem(STORAGE_KEY_FONT), 10) || DEFAULT_FONT;
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || "light";

    const clamped = applyFontSize(savedFont);
    setFontSizeState(clamped);

    applyTheme(savedTheme);
    setThemeState(savedTheme);
  }, []);

  const setFontSize = (size) => {
    const clamped = applyFontSize(size);
    setFontSizeState(clamped);
  };

  const setTheme = (t) => {
    applyTheme(t);
    setThemeState(t);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        theme,
        setTheme,
        MIN_FONT,
        MAX_FONT,
        STEP,
        DEFAULT_FONT,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);

export default AccessibilityContext;
