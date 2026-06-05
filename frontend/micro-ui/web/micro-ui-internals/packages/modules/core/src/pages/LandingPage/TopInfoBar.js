import React from "react";
import topInfoConfig from "./configs/topInfoConfig"; // <-- Import config

import { useTranslation } from "react-i18next";

const TopInfoBar = () => {
  const { t } = useTranslation();
  return (
    <div className="upyog-info-bar">
      <span className="upyog-info-icon">{topInfoConfig.icon}</span>

      <div className="upyog-info-content">
        <p className="upyog-info-text">{t(topInfoConfig.message)}</p>
      </div>
    </div>
  );
};

export default TopInfoBar;
