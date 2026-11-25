import React, { useState, useEffect } from "react";
import { Card, CheckBox, ActionBar, SubmitBar, TextInput, Toast } from "@djb25/digit-ui-react-components";

const Step4_Preview = ({
  t,
  formData = {},
  applicationDetails,
  resolvedServiceType,
  onBack,
  onSubmit,
  isLoading,
  isEditFlow,
  authMobileNumber,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [fee, setFee] = useState(0);
  const [taxHeads, setTaxHeads] = useState([]);
  const [slab, setSlab] = useState(t("Calculating..."));

  // OTP Verification state
  const [selectedOption, setSelectedOption] = useState(null); // null | "OTP" | "WITHOUT_OTP"
  const [existingOtp, setExistingOtp] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [isExistingOtpVerified, setIsExistingOtpVerified] = useState(false);
  const [isNewOtpVerified, setIsNewOtpVerified] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingExisting, setIsVerifyingExisting] = useState(false);
  const [isVerifyingNew, setIsVerifyingNew] = useState(false);

  const [otpErrorExisting, setOtpErrorExisting] = useState("");
  const [otpErrorNew, setOtpErrorNew] = useState("");

  const [timeLeft, setTimeLeft] = useState(0);
  const [showToast, setShowToast] = useState(null);

  const getMaskedName = (name) => {
    if (!name) return "NA";
    return name.split("").map((char, index) => (index % 2 === 1 && char !== " " ? "*" : char)).join("");
  };

  const getMaskedPhone = (phone) => {
    if (!phone || String(phone).length < 10) return "NA";
    const str = String(phone).replace(/\D/g, "").slice(-10);
    return `******${str.slice(-4)}`;
  };

  const appData = applicationDetails?.applicationData || {};
  const connectionNo = appData?.connectionNo || "NA";
  const meterId = appData?.meterId || "NA";
  const propertyId = appData?.propertyId || "NA";
  const connectionCategory = appData?.connectionCategory || "NA";

  const oldHolder = appData?.connectionHolders?.find((h) => h?.isPrimaryOwner) || appData?.connectionHolders?.[0] || {};
  const oldName = getMaskedName(oldHolder?.name);
  const rawExistingMobile = oldHolder?.mobileNumber || appData?.mobileNumber || authMobileNumber || "";
  const existingMobileNumber = String(rawExistingMobile).replace(/\D/g, "").slice(-10);
  const oldPhone = getMaskedPhone(existingMobileNumber);

  const rawNewMobile = formData?.newOwnerMobileNumber || "";
  const newOwnerMobileNumber = String(rawNewMobile).replace(/\D/g, "").slice(-10);

  const tenantId = appData?.tenantId || Digit.ULBService.getCurrentTenantId();
  const { data: propertyData } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId },
    { filters: { propertyIds: propertyId }, tenantId, enabled: !!propertyId && propertyId !== "NA" }
  );

  const propertyAddress = propertyData?.Properties?.[0]?.address || appData?.property?.address || {};
  const oldAddress = [
    propertyAddress?.houseNo || propertyAddress?.doorNo,
    propertyAddress?.buildingName,
    propertyAddress?.street,
    propertyAddress?.locality?.name,
    propertyAddress?.city,
    propertyAddress?.pincode,
  ].filter(Boolean).join(", ") || "NA";

  const {
    proposedNewConsumerName,
    relationshipWithExistingConsumer,
    reasonForNameChange,
    identityProofType,
    documentNumber,
    identityProofDocumentId,
    saleDeedDocumentId,
  } = formData;

  const getRelationshipName = (code) => {
    if (code?.code) return code.i18nKey;
    const map = { BLOOD_RELATION: t("Blood Relation"), LEGAL_HEIR: t("Legal Heir"), OTHER: t("Other") };
    return map[code] || code || "NA";
  };

  const getReasonName = (code) => {
    if (code?.code) return code.i18nKey;
    const map = { SALE_PURCHASE: t("Purchase of Property"), DEVOLUTION_INHERITANCE: t("Inheritance"), OTHER: t("Other (Devolution)") };
    return map[code] || code;
  };

  const viewDocument = async (fileStoreId) => {
    if (!fileStoreId) return;
    try {
      const stateId = Digit.ULBService.getStateId();
      const res = await window.Digit.UploadServices.Filefetch([fileStoreId], stateId);
      if (res?.data?.[fileStoreId]) {
        const fileUrl = res.data[fileStoreId].split(",")[0];
        window.open(fileUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to fetch document", err);
    }
  };

  useEffect(() => {
    const calculateStaticFee = () => {
      const relationCode = formData?.relationshipWithExistingConsumer?.code || formData?.relationshipWithExistingConsumer;

      if (relationCode === "BLOOD_RELATION") {
        setFee(100);
        setTaxHeads([]);
        setSlab(t("Blood relation slab"));
      } else {
        setFee(1350);
        setTaxHeads([
          { taxHeadCode: "WS_MUTATION_TRADE_SECURITY", estimateAmount: 250.0 },
          { taxHeadCode: "WS_MUTATION_FEE", estimateAmount: 100.0 },
          { taxHeadCode: "WS_WATER_ADVANCE", estimateAmount: 1000.0 },
        ]);
        setSlab(t("Other Slab"));
      }
    };

    calculateStaticFee();
  }, [formData]);

  // Resend timer countdown
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Dispatch OTP simultaneously to existing and new mobile numbers
  const triggerSimultaneousOtpDispatch = async () => {
    if (!existingMobileNumber || existingMobileNumber.length < 10) {
      setShowToast({
        key: "error",
        message: t("Registered mobile number not found for existing consumer"),
      });
      return;
    }
    if (!newOwnerMobileNumber || newOwnerMobileNumber.length < 10) {
      setShowToast({
        key: "error",
        message: t("Valid mobile number not found for new applicant"),
      });
      return;
    }

    setIsSendingOtp(true);
    setTimeLeft(30);

    try {
      const stateCode = Digit.ULBService.getStateId() || "dl";
      const userType = Digit.UserService.getType() ? Digit.UserService.getType().toUpperCase() : "CITIZEN";

      const sendToExisting = Digit.UserService.sendOtp(
        {
          otp: {
            mobileNumber: existingMobileNumber,
            tenantId: stateCode,
            type: "register",
            userType: userType,
          },
        },
        stateCode
      );

      const sendToNew = Digit.UserService.sendOtp(
        {
          otp: {
            mobileNumber: newOwnerMobileNumber,
            tenantId: stateCode,
            type: "register",
            userType: userType,
          },
        },
        stateCode
      );

      const [resExisting, resNew] = await Promise.allSettled([sendToExisting, sendToNew]);
      setIsSendingOtp(false);

      const isExistingErr =
        resExisting.status === "rejected" ||
        resExisting.value?.error ||
        resExisting.value?.data?.error ||
        resExisting.value?.Errors ||
        resExisting.value?.data?.Errors;

      const isNewErr =
        resNew.status === "rejected" ||
        resNew.value?.error ||
        resNew.value?.data?.error ||
        resNew.value?.Errors ||
        resNew.value?.data?.Errors;

      if (isExistingErr && isNewErr) {
        setShowToast({
          key: "error",
          message: t("Failed to send OTP to mobile numbers. Please click Resend OTP to try again."),
        });
      } else if (isExistingErr) {
        setShowToast({
          key: "warning",
          message: t("OTP sent to new applicant, but failed for existing consumer."),
        });
      } else if (isNewErr) {
        setShowToast({
          key: "warning",
          message: t("OTP sent to existing consumer, but failed for new applicant."),
        });
      } else {
        setShowToast({
          key: "success",
          message: t("OTP sent successfully to both registered mobile numbers."),
        });
      }
    } catch (err) {
      setIsSendingOtp(false);
      setShowToast({
        key: "error",
        message: err?.response?.data?.Errors?.[0]?.message || err?.message || t("Failed to send OTP"),
      });
    }
  };

  // Selection change handler
  const handleSelectOption = (option) => {
    if (selectedOption === option) return;

    // Reset OTP verification states when switching
    setExistingOtp("");
    setNewOtp("");
    setIsExistingOtpVerified(false);
    setIsNewOtpVerified(false);
    setOtpErrorExisting("");
    setOtpErrorNew("");

    setSelectedOption(option);

    if (option === "OTP") {
      triggerSimultaneousOtpDispatch();
    }
  };

  // Verify OTP for Existing Consumer
  const handleVerifyExistingOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!existingOtp || existingOtp.length < 6) {
      setShowToast({
        key: "warning",
        message: t("Please enter a valid 6-digit OTP"),
      });
      return;
    }

    setIsVerifyingExisting(true);
    setOtpErrorExisting("");

    try {
      const stateCode = Digit.ULBService.getStateId() || "dl";
      const userType = Digit.UserService.getType() ? Digit.UserService.getType().toUpperCase() : "CITIZEN";
      const payload = {
        otp: {
          otp: existingOtp,
          identity: existingMobileNumber,
          mobileNumber: existingMobileNumber,
          tenantId: stateCode,
          userType: userType,
        },
      };

      const res = await Digit.UserService.validateOtp(payload);
      if (!res || (typeof res === "object" && Object.keys(res).length === 0)) {
        throw new Error(t("OTP validation unsuccessful"));
      }
      if (res?.error || res?.data?.error) {
        const errObj = res?.error || res?.data?.error;
        throw new Error(errObj?.fields?.[0]?.message || errObj?.message || t("Failed to verify OTP"));
      }
      if (res?.Errors || res?.data?.Errors) {
        const errObj = res?.Errors || res?.data?.Errors;
        throw new Error(errObj?.[0]?.message || t("Failed to verify OTP"));
      }
      if (res?.isSuccessful === false || res?.successful === false) {
        throw new Error(t("Invalid OTP"));
      }

      setIsVerifyingExisting(false);
      setIsExistingOtpVerified(true);
      setShowToast({
        key: "success",
        message: t("Existing consumer's OTP verified successfully!"),
      });
    } catch (err) {
      setIsVerifyingExisting(false);
      const errMsg =
        err?.response?.data?.error?.fields?.[0]?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.Errors?.[0]?.message ||
        err?.message ||
        t("Invalid OTP for existing consumer");
      setOtpErrorExisting(errMsg);
      setShowToast({ key: "error", message: errMsg });
    }
  };

  // Verify OTP for New Applicant
  const handleVerifyNewOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!newOtp || newOtp.length < 6) {
      setShowToast({
        key: "warning",
        message: t("Please enter a valid 6-digit OTP"),
      });
      return;
    }

    setIsVerifyingNew(true);
    setOtpErrorNew("");

    try {
      const stateCode = Digit.ULBService.getStateId() || "dl";
      const userType = Digit.UserService.getType() ? Digit.UserService.getType().toUpperCase() : "CITIZEN";
      const payload = {
        otp: {
          otp: newOtp,
          identity: newOwnerMobileNumber,
          mobileNumber: newOwnerMobileNumber,
          tenantId: stateCode,
          userType: userType,
        },
      };

      const res = await Digit.UserService.validateOtp(payload);
      if (!res || (typeof res === "object" && Object.keys(res).length === 0)) {
        throw new Error(t("OTP validation unsuccessful"));
      }
      if (res?.error || res?.data?.error) {
        const errObj = res?.error || res?.data?.error;
        throw new Error(errObj?.fields?.[0]?.message || errObj?.message || t("Failed to verify OTP"));
      }
      if (res?.Errors || res?.data?.Errors) {
        const errObj = res?.Errors || res?.data?.Errors;
        throw new Error(errObj?.[0]?.message || t("Failed to verify OTP"));
      }
      if (res?.isSuccessful === false || res?.successful === false) {
        throw new Error(t("Invalid OTP"));
      }

      setIsVerifyingNew(false);
      setIsNewOtpVerified(true);
      setShowToast({
        key: "success",
        message: t("New applicant's OTP verified successfully!"),
      });
    } catch (err) {
      setIsVerifyingNew(false);
      const errMsg =
        err?.response?.data?.error?.fields?.[0]?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.Errors?.[0]?.message ||
        err?.message ||
        t("Invalid OTP for new applicant");
      setOtpErrorNew(errMsg);
      setShowToast({ key: "error", message: errMsg });
    }
  };

  const isBothOtpVerified = isExistingOtpVerified && isNewOtpVerified;
  const isOtpComplete = selectedOption === "OTP" && isBothOtpVerified;
  const isWithoutOtp = selectedOption === "WITHOUT_OTP";
  const canSubmit = agreed && !isLoading && (isOtpComplete || isWithoutOtp);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const isOtpVerified = selectedOption === "OTP" && isBothOtpVerified;
    onSubmit({ isOtpVerified });
  };

  const isMobileView = window.innerWidth < 768;
  const sectionStyle = {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: isMobileView ? "12px" : "16px",
    marginBottom: "16px",
  };
  const labelStyle = { color: "#666", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" };
  const valueStyle = { fontWeight: "bold", fontSize: isMobileView ? "13px" : "15px", wordBreak: "break-word" };
  const uploadDocStatusStyle = { fontSize: isMobileView ? "12px" : "14px", fontWeight: "bold" };

  const infoItem = (label, value) => (
    <div style={{ minWidth: 0 }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );

  return (
    <Card style={{ marginBottom: "20px", padding: isMobileView ? "12px" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ fontSize: isMobileView ? "15px" : "18px", fontWeight: "700", margin: 0 }}>
          {t("4. Application Preview & Final Declaration")}
        </h2>
      </div>

      {/* Property & Connection Summary */}
      <div style={{ ...sectionStyle, borderLeft: "4px solid #00497e" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#00497e", marginBottom: "12px" }}>
          {t("Property & Connection Summary")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobileView ? "1fr 1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
            gap: isMobileView ? "12px" : "16px",
          }}
        >
          {infoItem(t("Connection No"), connectionNo)}
          {infoItem(t("Meter Number"), meterId)}
        </div>
      </div>

      {/* Existing Owner */}
      {!isEditFlow && (
        <div style={{ ...sectionStyle, borderLeft: "4px solid #f29c1f" }}>
          <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#f29c1f", marginBottom: "12px" }}>
            {t("Existing / Previous Owner Details (Masked)")}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobileView ? "1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
              gap: isMobileView ? "12px" : "16px",
              marginBottom: "12px",
            }}
          >
            {infoItem(t("Registered Name:"), oldName)}
            {infoItem(t("Registered Phone:"), oldPhone)}
          </div>
          {infoItem(t("Registered Address:"), oldAddress)}
        </div>
      )}

      {/* New Owner */}
      <div style={{ ...sectionStyle, borderLeft: "4px solid #00497e" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#00497e", marginBottom: "12px" }}>
          {t("Transferee (New Owner) Summary")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobileView ? "1fr 1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
            gap: isMobileView ? "12px" : "16px",
          }}
        >
          {infoItem(t("New Owner Name"), proposedNewConsumerName)}
          {infoItem(t("Mobile Number"), newOwnerMobileNumber ? `+91 ${getMaskedPhone(newOwnerMobileNumber)}` : "NA")}
          {infoItem(t("Relation Type"), getRelationshipName(relationshipWithExistingConsumer))}
          {infoItem(t("Transfer Reason"), getReasonName(reasonForNameChange))}
        </div>
      </div>

      {/* Documents */}
      <div style={{ ...sectionStyle, borderLeft: "4px solid #17a2b8" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#17a2b8", marginBottom: "12px" }}>
          {t("Uploaded Documents")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobileView ? "1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
            gap: isMobileView ? "12px" : "16px",
          }}
        >
          <div>
            <div style={labelStyle}>{t("Address / Identity Proof")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={uploadDocStatusStyle}>✓ {identityProofType?.i18nKey || t("Document")}</span>
              {identityProofDocumentId && (
                <button
                  type="button"
                  onClick={() => viewDocument(identityProofDocumentId)}
                  style={{
                    color: "#00497e",
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: isMobileView ? "12px" : "14px",
                    fontWeight: "bold",
                    padding: 0,
                  }}
                >
                  {t("View")}
                </button>
              )}
            </div>
          </div>
          <div>
            <div style={labelStyle}>{t("Document Number")}</div>
            <div style={valueStyle}>{documentNumber || "NA"}</div>
          </div>
          <div>
            <div style={labelStyle}>{t("Reason-Based Proof")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={uploadDocStatusStyle}>✓ {t("Uploaded")}</span>
              {saleDeedDocumentId && (
                <button
                  type="button"
                  onClick={() => viewDocument(saleDeedDocumentId)}
                  style={{
                    color: "#00497e",
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: isMobileView ? "12px" : "14px",
                    fontWeight: "bold",
                    padding: 0,
                  }}
                >
                  {t("View")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fee */}
      <div
        style={{
          ...sectionStyle,
          backgroundColor: "#f2fff5",
          border: "1px solid #c3e6cb",
          borderLeft: "4px solid #28a745",
        }}
      >
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#28a745", marginBottom: "12px" }}>
          {t("Mutation Fee Details")}
        </h3>

        {taxHeads && taxHeads.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {taxHeads.map((tax, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  maxWidth: isMobileView ? "100%" : "400px",
                }}
              >
                <div style={labelStyle}>{t(tax.taxHeadCode)}:</div>
                <div style={valueStyle}>₹ {tax.estimateAmount}.00</div>
              </div>
            ))}
            <hr style={{ borderTop: "1px solid #c3e6cb", margin: "12px 0", maxWidth: isMobileView ? "100%" : "400px" }} />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", maxWidth: isMobileView ? "100%" : "400px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={labelStyle}>{t("Total Amount Payable:")}</div>
            <div style={{ ...valueStyle, color: "#28a745", fontSize: isMobileView ? "18px" : "20px" }}>₹ {fee}.00</div>
          </div>
          <div>
            <div style={labelStyle}>{t("Fee Status:")}</div>
            <span
              style={{
                padding: "4px 8px",
                backgroundColor: "#d1ecf1",
                color: "#0c5460",
                borderRadius: "16px",
                fontSize: isMobileView ? "10px" : "12px",
                fontWeight: "bold",
                display: "inline-block",
                marginTop: "4px",
              }}
            >
              {t("PAYABLE POST VERIFICATION")}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Selection Section */}
      <div
        style={{
          ...sectionStyle,
          borderLeft: "4px solid #00497e",
          backgroundColor: "#fcfdfe",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ fontSize: isMobileView ? "14px" : "16px", fontWeight: "bold", color: "#00497e", marginBottom: "6px" }}>
          {t("Verification Mode Selection")}
        </h3>
        <p style={{ fontSize: isMobileView ? "12px" : "13px", color: "#555", marginBottom: "16px", lineHeight: "1.4" }}>
          {t("Please select one of the following mutually exclusive verification options before submitting your mutation application:")}
        </p>

        {/* Mutually Exclusive Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Option 1 */}
          <div
            onClick={() => handleSelectOption("OTP")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: isMobileView ? "12px" : "16px",
              borderRadius: "8px",
              border: selectedOption === "OTP" ? "2px solid #00497e" : "1px solid #dcdcdc",
              backgroundColor: selectedOption === "OTP" ? "#eef6fc" : "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              boxShadow: selectedOption === "OTP" ? "0 2px 6px rgba(0, 73, 126, 0.12)" : "none",
            }}
          >
            <input
              type="radio"
              id="opt_mutation_verify_otp"
              name="mutationVerificationOption"
              checked={selectedOption === "OTP"}
              onChange={() => handleSelectOption("OTP")}
              style={{ marginTop: "3px", width: "18px", height: "18px", cursor: "pointer", accentColor: "#00497e" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label
                  htmlFor="opt_mutation_verify_otp"
                  style={{
                    fontWeight: "bold",
                    fontSize: isMobileView ? "13px" : "15px",
                    color: "#00497e",
                    cursor: "pointer",
                    margin: 0,
                  }}
                >
                  {t("Option 1: Verify with OTP")}
                </label>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    backgroundColor: "#e8f5e9",
                    color: "#2e7d32",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    border: "1px solid #c8e6c9",
                  }}
                >
                  {t("Recommended")}
                </span>
              </div>
              <div style={{ fontSize: isMobileView ? "12px" : "13px", color: "#555", marginTop: "4px", lineHeight: "1.4" }}>
                {t(
                  "Sends OTP simultaneously to both existing consumer's registered mobile number and new applicant's mobile number. Both must be verified to enable submission."
                )}
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div
            onClick={() => handleSelectOption("WITHOUT_OTP")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: isMobileView ? "12px" : "16px",
              borderRadius: "8px",
              border: selectedOption === "WITHOUT_OTP" ? "2px solid #00497e" : "1px solid #dcdcdc",
              backgroundColor: selectedOption === "WITHOUT_OTP" ? "#eef6fc" : "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              boxShadow: selectedOption === "WITHOUT_OTP" ? "0 2px 6px rgba(0, 73, 126, 0.12)" : "none",
            }}
          >
            <input
              type="radio"
              id="opt_mutation_without_otp"
              name="mutationVerificationOption"
              checked={selectedOption === "WITHOUT_OTP"}
              onChange={() => handleSelectOption("WITHOUT_OTP")}
              style={{ marginTop: "3px", width: "18px", height: "18px", cursor: "pointer", accentColor: "#00497e" }}
            />
            <div style={{ flex: 1 }}>
              <label
                htmlFor="opt_mutation_without_otp"
                style={{
                  fontWeight: "bold",
                  fontSize: isMobileView ? "13px" : "15px",
                  color: "#00497e",
                  cursor: "pointer",
                  margin: 0,
                  display: "block",
                }}
              >
                {t("Option 2: Apply Without OTP Verification")}
              </label>
              <div style={{ fontSize: isMobileView ? "12px" : "13px", color: "#555", marginTop: "4px", lineHeight: "1.4" }}>
                {t(
                  "Submit application directly without OTP verification. The application will undergo standard department inspection and verification."
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Option 1: Expanded OTP Verification Section */}
        {selectedOption === "OTP" && (
          <div
            style={{
              marginTop: "20px",
              padding: isMobileView ? "14px" : "18px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #cce5ff",
              borderLeft: "4px solid #00497e",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              <div>
                <h4 style={{ fontSize: isMobileView ? "14px" : "15px", fontWeight: "bold", color: "#00497e", margin: 0 }}>
                  {t("OTP Verification Section")}
                </h4>
                <p style={{ fontSize: isMobileView ? "11px" : "12px", color: "#666", margin: "4px 0 0 0" }}>
                  {t("Enter the 6-digit OTP sent to each mobile number and click Verify.")}
                </p>
              </div>

              {/* Resend OTP button */}
              <button
                type="button"
                onClick={triggerSimultaneousOtpDispatch}
                disabled={isSendingOtp || timeLeft > 0}
                style={{
                  background: "none",
                  border: "none",
                  color: isSendingOtp || timeLeft > 0 ? "#999" : "#00497e",
                  fontWeight: "bold",
                  fontSize: isMobileView ? "12px" : "13px",
                  cursor: isSendingOtp || timeLeft > 0 ? "not-allowed" : "pointer",
                  textDecoration: isSendingOtp || timeLeft > 0 ? "none" : "underline",
                  padding: "4px 0",
                }}
              >
                {isSendingOtp
                  ? t("Sending OTP...")
                  : timeLeft > 0
                  ? `${t("Resend OTP")} (${timeLeft}s)`
                  : t("Resend OTP")}
              </button>
            </div>

            {/* Two OTP Input Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobileView ? "1fr" : "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Box 1: Existing Consumer */}
              <div
                style={{
                  border: isExistingOtpVerified ? "1px solid #c8e6c9" : "1px solid #e0e0e0",
                  backgroundColor: isExistingOtpVerified ? "#f4fbf5" : "#fafafa",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ fontWeight: "bold", fontSize: isMobileView ? "12px" : "13px", color: "#333" }}>
                    1. {t("Existing Consumer Mobile")}
                  </div>
                  {isExistingOtpVerified && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        backgroundColor: "#28a745",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      ✓ {t("Verified")}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: isMobileView ? "11px" : "12px", color: "#666", marginBottom: "10px" }}>
                  {t("Sent to")}: <strong>+91 {oldPhone}</strong>
                </div>

                {isExistingOtpVerified ? (
                  <div style={{ padding: "8px 12px", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: "4px", fontSize: isMobileView ? "12px" : "13px", fontWeight: "600" }}>
                    ✓ {t("Mobile number verified successfully")}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <TextInput
                          value={existingOtp}
                          onChange={(e) => {
                            setOtpErrorExisting("");
                            setExistingOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleVerifyExistingOtp(e);
                          }}
                          placeholder={t("Enter 6-digit OTP")}
                          maxLength={6}
                          style={{ width: "100%", letterSpacing: "2px", fontWeight: "bold" }}
                          disabled={isVerifyingExisting}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyExistingOtp}
                        disabled={isVerifyingExisting || existingOtp.length < 6}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: isVerifyingExisting || existingOtp.length < 6 ? "#ccc" : "#00497e",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isVerifyingExisting || existingOtp.length < 6 ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                          fontSize: isMobileView ? "12px" : "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isVerifyingExisting ? t("Verifying...") : t("Verify")}
                      </button>
                    </div>
                    {otpErrorExisting && (
                      <div style={{ color: "#d32f2f", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                        {otpErrorExisting}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2: New Applicant */}
              <div
                style={{
                  border: isNewOtpVerified ? "1px solid #c8e6c9" : "1px solid #e0e0e0",
                  backgroundColor: isNewOtpVerified ? "#f4fbf5" : "#fafafa",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ fontWeight: "bold", fontSize: isMobileView ? "12px" : "13px", color: "#333" }}>
                    2. {t("New Applicant Mobile")}
                  </div>
                  {isNewOtpVerified && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        backgroundColor: "#28a745",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      ✓ {t("Verified")}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: isMobileView ? "11px" : "12px", color: "#666", marginBottom: "10px" }}>
                  {t("Sent to")}: <strong>+91 {getMaskedPhone(newOwnerMobileNumber)}</strong>
                </div>

                {isNewOtpVerified ? (
                  <div style={{ padding: "8px 12px", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: "4px", fontSize: isMobileView ? "12px" : "13px", fontWeight: "600" }}>
                    ✓ {t("Mobile number verified successfully")}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <TextInput
                          value={newOtp}
                          onChange={(e) => {
                            setOtpErrorNew("");
                            setNewOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleVerifyNewOtp(e);
                          }}
                          placeholder={t("Enter 6-digit OTP")}
                          maxLength={6}
                          style={{ width: "100%", letterSpacing: "2px", fontWeight: "bold" }}
                          disabled={isVerifyingNew}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyNewOtp}
                        disabled={isVerifyingNew || newOtp.length < 6}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: isVerifyingNew || newOtp.length < 6 ? "#ccc" : "#00497e",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isVerifyingNew || newOtp.length < 6 ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                          fontSize: isMobileView ? "12px" : "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isVerifyingNew ? t("Verifying...") : t("Verify")}
                      </button>
                    </div>
                    {otpErrorNew && (
                      <div style={{ color: "#d32f2f", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                        {otpErrorNew}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status Summary Banner */}
            {isBothOtpVerified ? (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#e8f5e9",
                  border: "1px solid #c8e6c9",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: "#2e7d32", fontSize: "16px", fontWeight: "bold" }}>✓</span>
                <span style={{ color: "#1b5e20", fontSize: isMobileView ? "12px" : "13px", fontWeight: "600" }}>
                  {t("Both mobile numbers verified successfully. Please review the declaration below to proceed with submission.")}
                </span>
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#fff8e1",
                  border: "1px solid #ffe082",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color: "#f57f17", fontSize: "16px" }}>ℹ️</span>
                <span style={{ color: "#856404", fontSize: isMobileView ? "12px" : "13px" }}>
                  {t("Both existing consumer and new applicant OTPs must be verified to enable final submission.")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Option 2 Info Note */}
        {selectedOption === "WITHOUT_OTP" && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              backgroundColor: "#f4f8fb",
              border: "1px solid #d0e4f5",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ color: "#00497e", fontSize: "16px" }}>ℹ️</span>
            <span style={{ color: "#00497e", fontSize: isMobileView ? "12px" : "13px" }}>
              {t("Application will be submitted without OTP verification. Final submit button is now enabled (confirm declaration below).")}
            </span>
          </div>
        )}

        {/* Prompt when neither option is selected */}
        {!selectedOption && (
          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeeba",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "14px" }}>⚠️</span>
            <span style={{ color: "#856404", fontSize: isMobileView ? "12px" : "13px", fontWeight: "500" }}>
              {t("Please choose either Option 1 (Verify with OTP) or Option 2 (Apply Without OTP) to proceed with submission.")}
            </span>
          </div>
        )}
      </div>

      {/* Declaration */}
      <div
        style={{
          padding: isMobileView ? "12px" : "16px",
          backgroundColor: "#fffbeb",
          border: "1px solid #ffeeba",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <CheckBox
          label={t("I want to go ahead with submitting this application. I confirm that the details and information provided by me are true and correct to the best of my knowledge.")}
          onChange={(e) => setAgreed(e.target.checked)}
          checked={agreed}
          style={isMobileView ? { fontSize: "12px" } : undefined}
        />
      </div>

      {/* Action Bar - responsive stacked on mobile */}
      {isMobileView ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: "14px 20px",
              backgroundColor: !canSubmit ? "#ccc" : "#00497e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: !canSubmit ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "15px",
              width: "100%",
              opacity: !canSubmit ? 0.6 : 1,
            }}
          >
            {isLoading ? t("Submitting...") : t("Proceed")}
          </button>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "12px 20px",
              backgroundColor: "#e0e0e0",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              width: "100%",
              fontSize: "14px",
            }}
          >
            ← {t("Edit Information")}
          </button>
        </div>
      ) : (
        <ActionBar>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "10px 20px",
              backgroundColor: "#e0e0e0",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              marginRight: "12px",
            }}
          >
            ← {t("Edit Information")}
          </button>
          <SubmitBar
            label={isLoading ? t("Submitting...") : t("Proceed")}
            onSubmit={handleSubmit}
            disabled={!canSubmit}
          />
        </ActionBar>
      )}

      {showToast && (
        <Toast
          error={showToast?.key === "error"}
          warning={showToast?.key === "warning"}
          label={t(showToast?.message)}
          onClose={() => setShowToast(null)}
          isDleteBtn={true}
        />
      )}
    </Card>
  );
};

export default Step4_Preview;
