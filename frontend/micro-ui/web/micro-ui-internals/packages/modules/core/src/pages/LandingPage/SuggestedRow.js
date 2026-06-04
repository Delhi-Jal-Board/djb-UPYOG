import React, { useMemo } from "react";
import services from "./configs/services.json";

import { useTranslation } from "react-i18next";

// 🔀 Fisher–Yates shuffle (does NOT mutate original array)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const SuggestedRow = ({ limit = 3 }) => {
  const { t } = useTranslation();
  const suggestedServices = useMemo(() => {
    return shuffleArray(
      services.filter((s) => s.active)
    ).slice(0, limit);
  }, []);

  return (
    <div className="upyog-suggested-wrapper">
      <span className="upyog-suggested-label">{t("Suggested")}:</span>

      {suggestedServices.map((service) => (
        <button
          key={service.code}
          className="upyog-suggested-btn"
        >
          {t(service.module)}
        </button>
      ))}
    </div>
  );
};

export default SuggestedRow;
