import React from "react";
import { useTranslation } from "react-i18next";

const WhatsNewCard = ({ header, actions, eventNotificationText, timePastAfterEventCreation, timeApproxiamationInUnits }) => {
  const { t } = useTranslation();

  const getTransformedLocale = (label) => {
    if (typeof label === "number") return label;
    return label && label.toUpperCase().replace(/[.:-\s\/]/g, "_");
  };

  return (
    <div className="WhatsNewCard">
      <h2>{t(header)}</h2>
      <p>{eventNotificationText}</p>
      {actions?.map((i, index) => (
        <a key={index} href={i?.actionUrl ? i.actionUrl.replace("https://dev-djb.nitcon.in", window.location.origin) : i?.actionUrl}>{`${t(`CS_COMMON_${getTransformedLocale(i?.code)}`)}`}</a>
      ))}
      <p>{timePastAfterEventCreation + ` ${t(timeApproxiamationInUnits)}`}</p>
    </div>
  );
};

export default WhatsNewCard;
