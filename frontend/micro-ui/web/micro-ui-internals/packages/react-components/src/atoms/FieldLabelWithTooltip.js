import React, { useState } from "react";
import CardLabel from "./CardLabel";
import { InfoBannerIcon } from "./svgindex";

const FieldLabelWithTooltip = ({ label, isMandatory = false, infoText, tooltipWidth = "220px", className = "", style = {} }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <CardLabel className={className} style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative", ...style }}>
      <span>
        {label}
        {isMandatory && <span className="check-page-link-button"> *</span>}
      </span>
      {infoText && (
        <div
          className="tooltip"
          style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip((prev) => !prev)}
        >
          <InfoBannerIcon fill="#708090" />
          <span
            className="tooltiptext"
            style={{
              width: tooltipWidth,
              marginLeft: `calc(-${tooltipWidth} / 2)`,
              textAlign: "center",
              fontSize: "12px",
              padding: "6px 8px",
              lineHeight: "1.4",
              whiteSpace: "normal",
              zIndex: 1000,
              ...(showTooltip ? { visibility: "visible", opacity: 1 } : {}),
            }}
          >
            {infoText}
          </span>
        </div>
      )}
    </CardLabel>
  );
};

export default FieldLabelWithTooltip;
