import React from "react";
import statsConfig from "./configs/StatsConfig"; // <-- import stats data
import { useTranslation } from "react-i18next";
import { Card } from "@djb25/digit-ui-react-components";

const StatsSection = () => {
  const { t } = useTranslation();
  return (
    <section className="stats-section">
      <div className="stats-container">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="stats-card">
            <div className="wave-lines"></div>
            <h3 className="stats-value">{t(stat.value)}</h3>
            <h4 className="stats-title">{t(stat.title)}</h4>
            <p className="stats-desc">{t(stat.description)}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
