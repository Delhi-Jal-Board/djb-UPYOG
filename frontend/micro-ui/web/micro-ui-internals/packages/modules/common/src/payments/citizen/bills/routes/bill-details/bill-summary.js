import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const ShieldIconSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#505A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "8px"}}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const ReceiptSlashIconSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#505A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "8px"}}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <line x1="3" y1="3" x2="21" y2="21"></line>
  </svg>
);

const BillSumary = ({ billAccountDetails, total, businessService, arrears }) => {
  const { t } = useTranslation();
  const { workflow: ModuleWorkflow } = Digit.Hooks.useQueryParams();

  useEffect(() => {
    ModuleWorkflow === "mcollect" && billAccountDetails && billAccountDetails.map((ob) => {
      if(ob.taxHeadCode.includes("CGST"))
        ob.order = 3;
      else if(ob.taxHeadCode.includes("SGST"))
        ob.order = 4;
    })
  },[billAccountDetails])
  
  const hasArrears = arrears > 0;

  return (
    <React.Fragment>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
        {billAccountDetails
          .sort((a, b) => a.order - b.order)
          .map((amountDetails, index) => {
            return (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", color: "#505A5F", fontSize: "16px" }}>
                  <ShieldIconSVG />
                  {t(amountDetails.taxHeadCode)}
                </div>
                <div style={{ fontWeight: "500", fontSize: "16px", color: "#0B0C0C" }}>
                  ₹{Math.abs(amountDetails?.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
            );
          })}

        {
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", color: "#505A5F", fontSize: "16px" }}>
              <ReceiptSlashIconSVG />
              {t("COMMON_ARREARS")}
            </div>
            <div style={{ fontWeight: "500", fontSize: "16px", color: "#9A9A9A" }}>
              ₹{Math.abs(arrears || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
        }

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          backgroundColor: "#F8F9FA", 
          padding: "16px", 
          borderRadius: "8px",
          marginTop: "8px" 
        }}>
          <div>
            <div style={{ color: "#0B0C0C", fontWeight: "500", fontSize: "14px", marginBottom: "4px" }}>
              {t("CS_PAYMENT_TOTAL_AMOUNT")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#9A9A9A" }}>
              {hasArrears ? t("CS_HAS_ARREARS", "Has arrears") : t("CS_NO_ARREARS", "No arrears")} 
              <span style={{ 
                backgroundColor: hasArrears ? "#FFEBEB" : "#C4EACA", 
                color: hasArrears ? "#D4351C" : "#00703C", 
                padding: "2px 8px", 
                borderRadius: "12px", 
                fontWeight: "500",
                fontSize: "12px"
              }}>
                {hasArrears ? t("CS_UNPAID", "Unpaid") : t("CS_CLEAR", "Clear")}
              </span>
            </div>
          </div>
          <div style={{ color: "#0B0C0C", fontWeight: "500", fontSize: "24px" }}>
            ₹{Number(total).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default BillSumary;
