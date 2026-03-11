import React from 'react'
import { InfoBannerIcon } from './svgindex';

export default function Tooltip({ children, message, label, isMandatory }) {
    return (
        <div
            style={{ position: "relative", display: "flex", alignItems: "center", gap: "5px" }}
            onMouseEnter={(e) => {
                const tooltip = e.currentTarget.querySelector(".tooltiptext");
                if (tooltip) {   // ✅ prevent null error
                    tooltip.style.visibility = "visible";
                    tooltip.style.opacity = 1;
                }
            }}
            onMouseLeave={(e) => {
                const tooltip = e.currentTarget.querySelector(".tooltiptext");
                if (tooltip) {   // ✅ prevent null error
                    tooltip.style.visibility = "hidden";
                    tooltip.style.opacity = 0;
                }
            }}
        >
            {label} {isMandatory && <span style={{ color: "red" }}>*</span>}

            {message && (
                <div
                    className="tooltip"
                    style={{ width: "14px", height: "5px", display: "inline-flex", alignItems: "center" }}
                >
                    {children}
                    <InfoBannerIcon />


                    <span
                        className="tooltiptext"
                        style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "small",
                            wordWrap: "break-word",
                            width: "300px",
                            marginLeft: "15px",
                            marginBottom: "-10px",
                        }}
                    >
                        {message}
                    </span>
                </div>
            )}
        </div>
    )
}