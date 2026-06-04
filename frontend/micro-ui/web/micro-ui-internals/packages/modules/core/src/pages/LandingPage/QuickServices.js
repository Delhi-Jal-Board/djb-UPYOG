import React from "react";
import WaterBillIcon from "./icons/WaterBIllicon";
import NewConnectionIcon from "./icons/NewConnection";
import MutationIcon from "./icons/MutationIcon";
import RainWaterHarvestingIcon from "./icons/RWHIcon";
import AddServiceIcon from "./icons/SeviceIcon";
import GrievanceIcon from "./icons/GrievanceIcon";
import { useTranslation } from "react-i18next";
import { Card } from "@djb25/digit-ui-react-components";

const QuickServices = () => {
  const { t } = useTranslation();
  const services = [
    { icon: <WaterBillIcon />, label: "Pay Your Water Bill" },
    { icon: <NewConnectionIcon />, label: "Apply for New Connection" },
    { icon: <MutationIcon />, label: "Apply for Mutation" },
    { icon: <GrievanceIcon />, label: "Apply for Grievance" },
    { icon: <AddServiceIcon />, label: "Add Service" },
    { icon: <RainWaterHarvestingIcon />, label: "Rain Water Harvesting" }
  ];

  return (
    <section className="upyog-quick-wrapper">
      <h2 className="upyog-quick-title">{t("Quick Services")}</h2>

      <div className="upyog-quick-grid">
        {services.map((item, index) => (
          <Card key={index} className="upyog-quick-card">
            <div className="upyog-quick-icon">{item.icon}</div>
            <div className="upyog-quick-text">{t(item.label)}</div>
            <div className="upyog-quick-arrow">›</div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default QuickServices;
