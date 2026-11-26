import React, { useState } from "react";
import { Card, Toast } from "@djb25/digit-ui-react-components";
import { useHistory } from "react-router-dom";

const Step5_Submission = ({ applicationNumber, serviceType, tenantId, formData, isOtpVerified, t }) => {
  const history = useHistory();
  const [showToast, setShowToast] = useState(null);
  const [isPaymentRedirecting, setIsPaymentRedirecting] = useState(false);

  const isEmployee = window.location.href.includes("/employee");
  const isSW = serviceType === "SEWERAGE" || applicationNumber?.includes("SW");
  const primaryBusinessService = isSW ? "SW.MUTATION" : "WS.MUTATION";
  const fallbackBusinessService = isSW ? "SW.ONE_TIME_FEE" : "WS.ONE_TIME_FEE";
  const cleanTenantId = tenantId || Digit.ULBService.getCurrentTenantId() || "dl";

  // Fetch bill for mutation fee via standard hook
  const { data: billData, isLoading: isBillLoading } = Digit.Hooks.useFetchBillsForBuissnessService(
    {
      businessService: primaryBusinessService,
      consumerCode: applicationNumber,
      tenantId: cleanTenantId,
    },
    {
      enabled: !!applicationNumber,
      retry: false,
    }
  );

  // Fallback bill fetch if primary returns empty
  const { data: fallbackBillData, isLoading: isFallbackLoading } = Digit.Hooks.useFetchBillsForBuissnessService(
    {
      businessService: fallbackBusinessService,
      consumerCode: applicationNumber,
      tenantId: cleanTenantId,
    },
    {
      enabled: !!applicationNumber && !isBillLoading && (!billData?.Bill || billData.Bill.length === 0),
      retry: false,
    }
  );

  const activeBill = billData?.Bill?.[0] || fallbackBillData?.Bill?.[0] || null;
  const billAmount = activeBill?.totalAmount != null ? Number(activeBill.totalAmount) : null;
  const activeBusinessService = activeBill?.businessService || primaryBusinessService;

  const handleMakePayment = async () => {
    setIsPaymentRedirecting(true);
    try {
      let bService = activeBusinessService;
      let finalBill = activeBill;

      // If bill is not yet loaded, try fetching on demand via API
      if (!finalBill) {
        try {
          const res = await Digit.PaymentService.fetchBill(cleanTenantId, {
            consumerCode: applicationNumber,
            businessService: primaryBusinessService,
          });
          if (res?.Bill?.[0]) {
            finalBill = res.Bill[0];
            bService = finalBill.businessService || primaryBusinessService;
          }
        } catch (e) {
          console.warn("Could not fetch bill with primary business service, checking fallback", e);
          try {
            const resFallback = await Digit.PaymentService.fetchBill(cleanTenantId, {
              consumerCode: applicationNumber,
              businessService: fallbackBusinessService,
            });
            if (resFallback?.Bill?.[0]) {
              finalBill = resFallback.Bill[0];
              bService = finalBill.businessService || fallbackBusinessService;
            }
          } catch (e2) {
            console.warn("Could not fetch fallback bill", e2);
          }
        }
      }

      const consumerName =
        finalBill?.payerName ||
        formData?.proposedNewConsumerName ||
        "";
      const formattedAppNo = (applicationNumber || "").replace(/\//g, "+");

      if (isEmployee) {
        history.push({
          pathname: `/digit-ui/employee/payment/collect/${bService}/${encodeURIComponent(applicationNumber)}/${cleanTenantId}`,
          search: `?tenantId=${cleanTenantId}&consumerCode=${applicationNumber}&ISWSAPP&applicationNumber=${applicationNumber}`,
          state: { tenantId: cleanTenantId, fromAcknowledgement: true },
        });
      } else {
        // Citizen route
        history.push({
          pathname: `/digit-ui/citizen/payment/my-bills/${bService}/${formattedAppNo}`,
          search: `?workflow=WNS&tenantId=${cleanTenantId}&ConsumerName=${encodeURIComponent(consumerName)}&consumerCode=${applicationNumber}`,
          state: {
            tenantId: cleanTenantId,
            fromAcknowledgement: true,
            paymentAmount: finalBill?.totalAmount,
          },
        });
      }
    } catch (err) {
      console.error("Error redirecting to payment:", err);
      setShowToast({
        key: "error",
        message: t("Unable to proceed to payment. Please try again or check My Applications."),
      });
      setIsPaymentRedirecting(false);
    }
  };

  const goHome = () => {
    history.push(isEmployee ? "/digit-ui/employee" : "/digit-ui/citizen");
  };

  const isMobileView = window.innerWidth < 768;
  const isLoadingBill = isBillLoading || isFallbackLoading;

  return (
    <div style={{ padding: isMobileView ? "8px 0" : "16px 0" }}>
      {/* Top Banner - Conditional based on OTP verification */}
      {isOtpVerified ? (
        /* Section containing only the generated Mutation Application ID/Number when submitted with OTP */
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #cce5ff",
            borderTop: "4px solid #00497e",
            borderRadius: "8px",
            padding: isMobileView ? "16px" : "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobileView ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobileView ? "flex-start" : "center",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: isMobileView ? "12px" : "13px", color: "#666", marginBottom: "4px" }}>
                {t("Generated Mutation Application Number")}
              </div>
              <div style={{ fontSize: isMobileView ? "18px" : "22px", fontWeight: "bold", color: "#00497e", wordBreak: "break-all" }}>
                {applicationNumber || "NA"}
              </div>
            </div>
            <span
              style={{
                padding: "6px 12px",
                backgroundColor: "#e8f5e9",
                color: "#2e7d32",
                borderRadius: "16px",
                fontSize: isMobileView ? "11px" : "12px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                border: "1px solid #c8e6c9",
              }}
            >
              ✓ {t("OTP Verified Application")}
            </span>
          </div>
        </div>
      ) : (
        /* Normal Submission Banner when submitted without OTP */
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #d4edda",
            borderTop: "4px solid #28a745",
            borderRadius: "8px",
            padding: isMobileView ? "16px" : "20px",
            display: "flex",
            flexDirection: isMobileView ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobileView ? "stretch" : "flex-start",
            gap: "12px",
            marginBottom: "20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <h2
              style={{
                color: "#28a745",
                fontSize: isMobileView ? "15px" : "18px",
                fontWeight: "bold",
                margin: "0 0 6px",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>✅</span> {t("Your mutation application has been submitted successfully to the respective Zonal Officer!")}
            </h2>
            <div style={{ color: "#555", marginTop: "4px", fontSize: isMobileView ? "13px" : "14px", wordBreak: "break-all" }}>
              {t("Your SRN Reference No. is:")} <strong style={{ color: "#00497e" }}>{applicationNumber}</strong>
            </div>
          </div>
          <div style={{ alignSelf: isMobileView ? "flex-start" : undefined }}>
            <span
              style={{
                padding: "6px 12px",
                backgroundColor: "#fff3cd",
                color: "#856404",
                borderRadius: "16px",
                fontSize: isMobileView ? "11px" : "12px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                border: "1px solid #ffeeba",
              }}
            >
              {t("Pending for Zonal Officer approval")}
            </span>
          </div>
        </div>
      )}

      {/* Make Payment Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #cce5ff",
          borderLeft: "4px solid #00497e",
          borderRadius: "8px",
          padding: isMobileView ? "16px" : "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0, 73, 126, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <div>
            <h3 style={{ fontSize: isMobileView ? "15px" : "17px", fontWeight: "bold", color: "#00497e", margin: "0 0 4px" }}>
              {t("Mutation Application Fee & Payment")}
            </h3>
            <p style={{ fontSize: isMobileView ? "12px" : "13px", color: "#666", margin: 0, lineHeight: "1.4" }}>
              {t("You can make the fee payment for this application now to expedite the verification process, or pay later from My Applications.")}
            </p>
          </div>
          {billAmount !== null && (
            <span
              style={{
                padding: "4px 10px",
                backgroundColor: billAmount > 0 ? "#fff3cd" : "#e8f5e9",
                color: billAmount > 0 ? "#856404" : "#2e7d32",
                borderRadius: "14px",
                fontSize: "12px",
                fontWeight: "bold",
                border: billAmount > 0 ? "1px solid #ffeeba" : "1px solid #c8e6c9",
              }}
            >
              {billAmount > 0 ? t("Payment Pending") : t("No Dues")}
            </span>
          )}
        </div>

        {/* Bill Amount Display */}
        {/* <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            backgroundColor: "#f7fafd",
            padding: "14px 16px",
            borderRadius: "6px",
            border: "1px solid #e1effa",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: isMobileView ? "11px" : "12px", color: "#666", marginBottom: "2px" }}>
              {t("Total Amount Payable:")}
            </div>
            <div style={{ fontSize: isMobileView ? "18px" : "22px", fontWeight: "bold", color: "#28a745" }}>
              {isLoadingBill
                ? t("Checking payment details...")
                : billAmount !== null
                ? `₹ ${billAmount.toFixed(2)}`
                : t("₹ 100.00 (Standard Mutation Fee)")}
            </div>
          </div>
          {activeBill?.payerName && (
            <div>
              <div style={{ fontSize: isMobileView ? "11px" : "12px", color: "#666", marginBottom: "2px" }}>
                {t("Consumer / Applicant Name:")}
              </div>
              <div style={{ fontSize: isMobileView ? "13px" : "14px", fontWeight: "bold", color: "#333" }}>
                {activeBill.payerName}
              </div>
            </div>
          )}
        </div> */}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleMakePayment}
            disabled={isPaymentRedirecting}
            style={{
              padding: isMobileView ? "12px 20px" : "12px 28px",
              backgroundColor: isPaymentRedirecting ? "#999" : "#28a745",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: isPaymentRedirecting ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: isMobileView ? "100%" : "auto",
              boxShadow: "0 2px 4px rgba(40, 167, 69, 0.25)",
            }}
          >
            <span>💳</span>
            {isPaymentRedirecting ? t("Redirecting to payment...") : t("Make Payment")}
          </button>

          <button
            type="button"
            onClick={goHome}
            style={{
              padding: isMobileView ? "12px 20px" : "12px 24px",
              backgroundColor: "#f0f2f5",
              color: "#00497e",
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              width: isMobileView ? "100%" : "auto",
            }}
          >
            {t("Go to Home")}
          </button>
        </div>
      </div>

      {showToast && (
        <Toast
          error={showToast.key === "error"}
          warning={showToast.key === "warning"}
          label={t(showToast.message)}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
};

export default Step5_Submission;
