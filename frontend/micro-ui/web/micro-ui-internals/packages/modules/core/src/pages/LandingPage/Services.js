import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Card } from "@djb25/digit-ui-react-components";
import services from "./configs/services.json";
import WaterDropIcon from "./icons/WaterDrop";

const moduleIcons = {
  // "Property Tax": "/assets/icons/property.png",
  // "Trade License": "/assets/icons/trade.png",
  // "Birth Certificate": "/assets/icons/birth.png",
  // "Water & Sewerage": "/assets/icons/water.png",
};

const ServiceGrid = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const modules = services || [];

  const activeModules = modules
    .filter((m) => m.active)
    .sort((a, b) => a.order - b.order);

  const [expanded, setExpanded] = useState(false);
  const visibleModules = expanded ? activeModules : activeModules.slice(0, 8);

  const handleCardClick = (link) => {
    if (link) {
      if (link.startsWith("http://") || link.startsWith("https://")) {
        window.open(link, "_blank");
      } else {
        history.push(link);
      }
    }
  };

  return (
    <section className="upyog-service-wrapper">
      <h2 className="upyog-service-title">{t("Services")}</h2>

      <div className="upyog-service-grid">
        {visibleModules.map((item, idx) => (
          <Card key={idx} className="service-card card-double-wave" onClick={() => handleCardClick(item.link)}>
            <img
              src={
                moduleIcons[item.module] ||
                item.bannerImage ||
                "https://cdn.ksmart.lsgkerala.gov.in/common/webpage/services/property_tax.webp"
              }
              alt={item.module}
              className="service-card-icon"
            />
            <div className="service-wave-drop">
              <WaterDropIcon size={22} />
            </div>
            <span className="service-title">{t(item.module)}</span>
          </Card>
        ))}
      </div>

      {activeModules.length > 8 && (
        <div className="service-expand-btn-wrapper">
          <button
            className="service-expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? t("Show Less") : t("View All Services")}
          </button>
        </div>
      )}
    </section>
  );
};

export default ServiceGrid;