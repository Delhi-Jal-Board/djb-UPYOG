import React, { useState } from "react";
import { ArrowDown } from "../atoms/svgindex";

const CollapsibleCardPage = ({ number, title, children, defaultOpen = false, tabs = null, defaultTab = "", onTabChange = () => {}, style, className }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs && tabs[0]) || "");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <div className={`collapsible-card ${className ? className : ""}`} style={style}>
      {/* Header */}
      <div className="collapsible-card-header" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="collapsible-card-title">
          {number ? `${number}. ` : ""}
          {title}
        </h3>
        <span className={`collapsible-card-arrow ${isOpen ? "rotate" : ""}`}>
          <ArrowDown />
        </span>
      </div>

      {/* Collapsible body */}
      <div className="collapsible-card-body" style={{ display: isOpen ? "block" : "none" }}>
        {/* Tab header */}
        {tabs && (
          <div className="collapsible-card-tabs">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabClick(tab)}
                className={`collapsible-card-tab-button ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div className="collapsible-card-tab-content">
          {tabs ? <React.Fragment key={activeTab}>{children(activeTab)}</React.Fragment> : children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleCardPage;
