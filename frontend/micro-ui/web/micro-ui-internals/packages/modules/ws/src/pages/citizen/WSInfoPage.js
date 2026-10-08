import React, { useState, useEffect } from "react";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardText,
  CardSubHeader,
  SubmitBar,
  RadioButtons,
  Dropdown,
  Loader,
  CitizenInfoLabel,
  Label,
  TextInput,
  Toast,
  OTPInput,
} from "@djb25/digit-ui-react-components";

const getMaskedPhone = (phone) => {
  if (!phone || phone.length < 10) return "NA";
  return `******${phone.slice(-4)}`;
};

const getAddress = (address, t) => {
  return `${address?.doorNo ? `${address?.doorNo}, ` : ""} ${address?.street ? `${address?.street}, ` : ""}${
    address?.landmark ? `${address?.landmark}, ` : ""
  }${t(Digit.Utils.pt.getMohallaLocale(address?.locality.code, address?.tenantId))}, ${t(Digit.Utils.pt.getCityLocale(address?.tenantId))}${
    address?.pincode && t(address?.pincode) ? `, ${address.pincode}` : " "
  }`;
};

const WSInfoPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();
  const isEmployee = window.location.href.includes("/employee");
  const user = Digit.UserService.getUser();
  const userMobileNumber = user?.info?.userName?.match(/^[0-9]{10}$/) ? user.info.userName : user?.info?.mobileNumber;

  const [hasProperty, setHasProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchMobileNumber, setSearchMobileNumber] = useState(isEmployee ? "" : userMobileNumber || "");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  useEffect(() => {
    // A property may only be used after a fresh OTP verification in this flow.
    sessionStorage.removeItem("WS_OTP_VERIFIED_PROPERTY_ID");
  }, []);

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const mobileNumberToSearch = searchMobileNumber;

  const { isLoading, data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: { mobileNumber: mobileNumberToSearch }, tenantId: tenantId },
    {
      filters: { mobileNumber: mobileNumberToSearch },
      tenantId: tenantId,
      enabled: hasProperty?.code === "YES" && mobileNumberToSearch?.length === 10 && isMobileVerified ? true : false,
    }
  );

  const radioOptions = [
    { code: "YES", name: "Yes" },
    { code: "NO", name: "No" },
  ];

  const proceedToNext = () => {
    sessionStorage.removeItem("Digit.PT_CREATE_EMP_WS_NEW_FORM");
    const isEmployee = window.location.href.includes("/employee");
    const baseUrl = isEmployee ? "/digit-ui/employee/ws" : "/digit-ui/citizen/ws";
    if (hasProperty?.code === "YES" && selectedProperty) {
      // Bind the OTP verification to the property selected before verification.
      sessionStorage.setItem("WS_OTP_VERIFIED_PROPERTY_ID", selectedProperty.propertyId);
      history.push(`${baseUrl}/old-application?propertyId=${selectedProperty.propertyId}`);
    } else {
      history.push(`${baseUrl}/old-application`);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    setIsOtpSending(true);
    try {
      const userType = Digit.UserService.getType() ? Digit.UserService.getType().toUpperCase() : (isEmployee ? "EMPLOYEE" : "CITIZEN");
      const payload = {
        otp: {
          mobileNumber: mobileNumberToSearch,
          tenantId: "dl",
          type: "register",
          userType: "EMPLOYEE",
        },
      };

      const response = await Digit.UserService.sendOtp(payload, "dl");
      if (!response) {
        setIsOtpSending(false);
        setShowToast({ key: "error", message: t("Failed to send OTP (No response)") });
        return;
      }
      if (response?.error || response?.data?.error) {
        const errObj = response?.error || response?.data?.error;
        setIsOtpSending(false);
        setShowToast({ key: "error", message: errObj?.fields?.[0]?.message || errObj?.message || t("Failed to send OTP") });
        return;
      }
      if (response?.Errors || response?.data?.Errors) {
        const errObj = response?.Errors || response?.data?.Errors;
        setIsOtpSending(false);
        setShowToast({ key: "error", message: errObj?.[0]?.message || t("Failed to send OTP") });
        return;
      }

      setIsOtpSending(false);
      setShowOtpVerification(true);
      setTimeLeft(30);
      setShowToast({ key: "success", message: t("OTP sent successfully!") });
    } catch (err) {
      setIsOtpSending(false);
      let errMsg = t("Failed to send OTP");
      if (err?.response?.data?.error) {
        errMsg = err.response.data.error?.fields?.[0]?.message || err.response.data.error?.message || errMsg;
      } else if (err?.response?.data?.Errors) {
        errMsg = err.response.data.Errors?.[0]?.message || errMsg;
      } else if (err.message) {
        errMsg = err.message;
      }
      setShowToast({ key: "error", message: errMsg });
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    if (!otp || otp.length < 6) {
      setShowToast({ key: "warning", message: t("Please enter a valid 6-digit OTP") });
      return;
    }
    setIsOtpVerifying(true);
    try {
      // Intentionally not sending userType in validateOtp as per original mutation code
      const payload = {
        otp: {
          otp: otp,
          identity: mobileNumberToSearch,
          tenantId: "dl",
        },
      };

      const response = await Digit.UserService.validateOtp(payload);

      if (!response || (typeof response === "object" && Object.keys(response).length === 0)) {
        throw new Error("OTP validation unsuccessful");
      }

      // If the API responds with 200 OK but includes an error payload:
      if (response?.error || response?.data?.error) {
        const errObj = response?.error || response?.data?.error;
        throw new Error(errObj?.fields?.[0]?.message || errObj?.message || "Failed to verify OTP");
      }
      if (response?.Errors || response?.data?.Errors) {
        const errObj = response?.Errors || response?.data?.Errors;
        throw new Error(errObj?.[0]?.message || "Failed to verify OTP");
      }

      setIsOtpVerifying(false);
      setShowToast({ key: "success", message: t("OTP verified successfully!") });
      setShowOtpVerification(false);
      setIsMobileVerified(true);
    } catch (err) {
      setIsOtpVerifying(false);
      let errMsg = err.message || t("Failed to verify OTP");
      if (err?.response?.data?.error) {
        errMsg = err.response.data.error?.fields?.[0]?.message || err.response.data.error?.message || errMsg;
      } else if (err?.response?.data?.Errors) {
        errMsg = err.response.data.Errors?.[0]?.message || errMsg;
      } else if (err.message) {
        errMsg = err.message;
      }
      setShowToast({ key: "error", message: errMsg });
    }
  };

  const handleNext = (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    if (hasProperty?.code === "YES" && selectedProperty) {
      if (!isMobileVerified) {
        setShowToast({ key: "warning", message: t("Please verify mobile number first") });
        return;
      }
      proceedToNext();
    } else if (hasProperty?.code === "YES" && !selectedProperty) {
      // Should not be reachable since button is disabled, but just in case
      return;
    } else {
      // Proceed without property
      proceedToNext();
    }
  };

  const handleCreateProperty = () => {
    const propertyUrl = isEmployee ? "/digit-ui/employee/ws/create-application/create-property" : "/digit-ui/citizen/commonpt-home";
    history.push(propertyUrl);
  };

  const propertyOptions =
    propertyDetails?.Properties?.map((prop) => ({
      ...prop,
      displayName: `${prop.propertyId} - ${getAddress(prop.address, t)}`,
    })) || [];


  const handleDigiLockerLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const data = await Digit.DigiLockerService.authorization({ module: "WS", tenantId });
      const redirectUrl = data?.redirectURL || data?.redirectUrl;
      const verifier = data?.dlReqRef || data?.codeverifier || data?.codeVerifier || data?.code_verifier;
      if (verifier) {
        sessionStorage.setItem("code_verfier_register", verifier);
      }
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        console.error("No redirect URL returned from DigiLocker API", data);
      }
    } catch (error) {
      console.error("Error fetching DigiLocker authorization URL", error);
    }
  };

  const isNextDisabled = !hasProperty || (hasProperty?.code === "YES" && !selectedProperty) || hasProperty?.code === "NO";

  return (
    <React.Fragment>
      <div className="ws-info-container">
        <style>{`
          .ws-info-container {
            margin: 0 auto;
            padding: 8px 4px 32px 4px;
            color: #0b0c0c;
            box-sizing: border-box;
          }
          .ws-info-container * {
            box-sizing: border-box;
          }
          .ws-info-header-card {
            background: #ffffff;
            border: 1px solid #dce4ec;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(11, 77, 130, 0.04);
          }
          .ws-header-badge-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            margin-bottom: 12px;
          }
          .ws-service-tag {
            background: #e8f3fa;
            color: #0b4d82;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4px 12px;
            border-radius: 14px;
            border: 1px solid #c9e0f5;
          }
          .ws-portal-tag {
            background: #f4f5f7;
            color: #505a5f;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 14px;
            border: 1px solid #e1e4e8;
          }
          .ws-page-title {
            font-size: 26px;
            font-weight: 700;
            color: #0b0c0c;
            margin: 0 0 6px 0;
            line-height: 1.3;
          }
          .ws-page-subtitle {
            font-size: 14.5px;
            color: #505a5f;
            margin: 0 0 18px 0;
            line-height: 1.5;
          }
          .ws-guidance-box {
            display: flex;
            gap: 16px;
            background: #f0f7fd;
            border: 1px solid #c9e0f5;
            border-left: 5px solid #1a67a3;
            border-radius: 8px;
            padding: 16px 20px;
          }
          .ws-guidance-icon-wrap {
            flex-shrink: 0;
            margin-top: 2px;
          }
          .ws-guidance-text-wrap {
            flex: 1;
          }
          .ws-guidance-title {
            font-size: 16px;
            font-weight: 700;
            color: #0b4d82;
            margin-bottom: 6px;
          }
          .ws-guidance-desc {
            font-size: 14px;
            color: #2b3940;
            line-height: 1.55;
            margin-bottom: 14px;
          }
          .ws-guidance-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .ws-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            border: 1px solid #bfdcfa;
            color: #0b4d82;
            font-size: 13px;
            font-weight: 600;
            padding: 5px 12px;
            border-radius: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          }
          .ws-card {
            background: #ffffff;
            border: 1px solid #dce4ec;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 2px 10px rgba(11, 77, 130, 0.04);
          }
          .ws-step-header {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 18px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eef2f5;
          }
          .ws-step-num-badge {
            background: #1a67a3;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(26, 103, 163, 0.25);
          }
          .ws-step-title {
            font-size: 19px;
            font-weight: 700;
            color: #0b0c0c;
            margin: 0 0 4px 0;
          }
          .ws-step-subtitle {
            font-size: 14px;
            color: #505a5f;
            margin: 0;
            line-height: 1.5;
          }
          .ws-question-container {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 18px 20px;
            margin-bottom: 20px;
          }
          .ws-question-label {
            font-size: 15.5px;
            font-weight: 700;
            color: #0b0c0c;
            display: block;
            margin-bottom: 12px;
          }
          .ws-req-dot {
            color: #d4351c;
            margin-right: 2px;
          }
          .ws-prop-guide-banner {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e40af;
            font-size: 13.5px;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 18px;
          }
          .ws-guide-step-tag {
            background: #2563eb;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 10px;
            white-space: nowrap;
          }
          .ws-prop-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 18px;
            align-items: start;
          }
          .ws-field-col {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .ws-mobile-input-wrap {
            display: flex;
            gap: 12px;
            align-items: center;
          }
          .ws-field-helper {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .ws-selected-prop-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #00703c;
            font-weight: 600;
            background: #eef9f2;
            padding: 6px 12px;
            border-radius: 6px;
            margin-top: 8px;
            border: 1px solid #c3e6cb;
          }
          .ws-otp-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 18px 20px;
            margin: 16px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          }
          .ws-otp-header {
            margin-bottom: 14px;
          }
          .ws-otp-title-group {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .ws-otp-subtitle {
            font-size: 13.5px;
            color: #64748b;
          }
          .ws-otp-input-row {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: center;
          }
          .ws-otp-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .ws-otp-timer-note {
            font-size: 13px;
            color: #64748b;
            margin-top: 10px;
          }
          .ws-verified-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 12px 18px;
            border-radius: 8px;
            margin: 16px 0;
          }
          .ws-verified-text {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .ws-verified-check {
            background: #28a745;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 13px;
            flex-shrink: 0;
          }
          .ws-verified-sub {
            font-size: 12.5px;
            color: #1e7e34;
          }
          .ws-btn-link {
            background: none;
            border: none;
            color: #1a67a3;
            font-size: 13.5px;
            font-weight: 600;
            text-decoration: underline;
            cursor: pointer;
            padding: 0;
          }
          .ws-no-prop-alert {
            display: flex;
            gap: 14px;
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-left: 4px solid #e53e3e;
            border-radius: 8px;
            padding: 16px 18px;
            margin-top: 16px;
          }
          .ws-no-prop-icon {
            font-size: 22px;
            flex-shrink: 0;
          }
          .ws-no-prop-content strong {
            display: block;
            font-size: 15px;
            color: #c53030;
            margin-bottom: 4px;
          }
          .ws-no-prop-content p {
            font-size: 14px;
            color: #4a5568;
            margin: 0 0 12px 0;
          }
          .ws-prop-no-block {
            margin-top: 16px;
          }
          .ws-no-prop-notice {
            display: flex;
            gap: 14px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-left: 4px solid #2563eb;
            border-radius: 8px;
            padding: 16px 18px;
            margin-bottom: 16px;
          }
          .ws-notice-icon-circle {
            font-size: 22px;
            flex-shrink: 0;
          }
          .ws-no-prop-notice h4 {
            margin: 0 0 4px 0;
            font-size: 15px;
            color: #1e40af;
          }
          .ws-no-prop-notice p {
            margin: 0;
            font-size: 14px;
            color: #1e3a8a;
            line-height: 1.5;
          }
          .ws-checklist-header {
            margin-bottom: 20px;
          }
          .ws-checklist-title-row {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
          }
          .ws-section-badge {
            background: #f1f5f9;
            color: #475569;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 3px 10px;
            border-radius: 12px;
            width: fit-content;
            border: 1px solid #e2e8f0;
          }
          .ws-checklist-title {
            font-size: 21px;
            font-weight: 700;
            color: #0b0c0c;
            margin: 0;
          }
          .ws-confused-user-explainer {
            display: flex;
            gap: 14px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-left: 4px solid #16a34a;
            border-radius: 8px;
            padding: 14px 18px;
            margin-top: 10px;
          }
          .ws-explainer-icon {
            flex-shrink: 0;
            margin-top: 2px;
          }
          .ws-explainer-title {
            display: block;
            font-size: 15px;
            font-weight: 700;
            color: #15803d;
            margin-bottom: 4px;
          }
          .ws-explainer-desc {
            font-size: 13.5px;
            color: #166534;
            margin: 0;
            line-height: 1.55;
          }
          .ws-checklist-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 24px;
            margin-top: 20px;
          }
          .ws-checklist-column {
            display: flex;
            flex-direction: column;
          }
          .ws-col-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
          }
          .ws-col-icon-wrap {
            width: 38px;
            height: 38px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .ws-col-title {
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 2px 0;
          }
          .ws-col-subtitle {
            font-size: 12.5px;
            color: #64748b;
            margin: 0;
          }
          .ws-group-cards-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .ws-group-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 16px;
          }
          .ws-group-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 10px;
          }
          .ws-tag-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .ws-tag-item {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #334155;
            font-size: 12.5px;
            font-weight: 500;
            padding: 4px 10px;
            border-radius: 6px;
          }
          .ws-docs-cards-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .ws-doc-item-card {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .ws-doc-badge {
            font-size: 20px;
            flex-shrink: 0;
          }
          .ws-doc-info {
            flex: 1;
          }
          .ws-doc-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .ws-doc-desc {
            font-size: 12px;
            color: #64748b;
          }
          .ws-req-pill {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
            white-space: nowrap;
          }
          .ws-opt-pill {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #e2e8f0;
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 12px;
            white-space: nowrap;
          }
          .ws-digilocker-box {
            background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 10px;
            padding: 18px;
            margin-top: 16px;
          }
          .ws-digilocker-header {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            margin-bottom: 14px;
          }
          .ws-dl-icon-circle {
            width: 36px;
            height: 36px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          }
          .ws-dl-title {
            font-size: 15px;
            font-weight: 700;
            color: #0369a1;
            margin-bottom: 2px;
          }
          .ws-dl-sub {
            font-size: 12.5px;
            color: #334155;
            line-height: 1.45;
          }
          .ws-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 9px 18px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
            white-space: nowrap;
          }
          .ws-btn-primary {
            background: #1a67a3;
            color: #ffffff;
          }
          .ws-btn-primary:hover:not(:disabled) {
            background: #0b4d82;
          }
          .ws-btn-outline {
            background: #ffffff;
            border: 1px solid #1a67a3;
            color: #1a67a3;
          }
          .ws-btn-outline:hover:not(:disabled) {
            background: #f0f7fd;
          }
          .ws-btn-secondary {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #334155;
          }
          .ws-btn-secondary:hover:not(:disabled) {
            background: #e2e8f0;
          }
          .ws-btn-digilocker {
            background: #003366;
            color: #ffffff;
            width: 100%;
          }
          .ws-btn-digilocker:hover {
            background: #002244;
          }
          .ws-btn:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
          .ws-action-card {
            background: #ffffff;
            border: 1px solid #dce4ec;
            border-radius: 12px;
            padding: 18px 24px;
            margin-top: 10px;
            box-shadow: 0 4px 12px rgba(11, 77, 130, 0.08);
          }
          .ws-action-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
          }
          .ws-action-hint {
            flex: 1;
            min-width: 250px;
          }
          .ws-hint-text {
            font-size: 14px;
            font-weight: 600;
          }
          .ws-hint-warning {
            color: #b45309;
          }
          .ws-hint-success {
            color: #047857;
          }
          .ws-btn-next {
            background: #00703c;
            color: #ffffff;
            font-size: 15px;
            padding: 12px 28px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 112, 60, 0.2);
          }
          .ws-btn-next:hover:not(:disabled) {
            background: #005a30;
          }
          .ws-btn-disabled {
            background: #94a3b8 !important;
            color: #f1f5f9 !important;
            cursor: not-allowed !important;
            box-shadow: none !important;
          }
          @media (max-width: 900px) {
            .ws-checklist-grid {
              grid-template-columns: 1fr;
              gap: 20px;
            }
            .ws-prop-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
          }
          @media (max-width: 768px) {
            .ws-info-container {
              padding: 4px;
            }
            .ws-info-header-card, .ws-card, .ws-action-card {
              padding: 16px;
              border-radius: 8px;
            }
            .ws-page-title {
              font-size: 22px;
            }
            .ws-guidance-box {
              flex-direction: column;
              gap: 10px;
              padding: 14px;
            }
            .ws-guidance-chips {
              flex-direction: column;
              align-items: flex-start;
              gap: 6px;
            }
            .ws-chip {
              width: 100%;
              justify-content: flex-start;
            }
            .ws-mobile-input-wrap {
              flex-direction: column;
              align-items: stretch;
            }
            .ws-mobile-input-wrap .ws-btn {
              width: 100%;
            }
            .ws-otp-input-row {
              flex-direction: column;
              align-items: stretch;
            }
            .ws-otp-actions {
              width: 100%;
            }
            .ws-otp-actions .ws-btn {
              flex: 1;
            }
            .ws-action-content {
              flex-direction: column;
              align-items: stretch;
            }
            .ws-action-hint {
              text-align: center;
            }
            .ws-btn-next {
              width: 100%;
              justify-content: center;
            }
          }
          @media (max-width: 480px) {
            .ws-step-header {
              flex-direction: column;
              gap: 10px;
            }
            .ws-verified-banner {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
            .ws-doc-item-card {
              flex-wrap: wrap;
            }
          }
        `}</style>

        {/* 1. Header & Guidance Banner */}
        <div className="ws-info-header-card">
          <div className="ws-header-badge-row">
            <span className="ws-service-tag">{t("Water & Sewerage Services")}</span>
            <span className="ws-portal-tag">{isEmployee ? t("Employee Portal") : t("Citizen Services")}</span>
          </div>
          <h1 className="ws-page-title">{t("Apply For New Connection")}</h1>
          <p className="ws-page-subtitle">
            {t("Submit an application for a new domestic, commercial, or industrial water/sewerage connection with Delhi Jal Board.")}
          </p>

          <div className="ws-guidance-box">
            <div className="ws-guidance-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a67a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div className="ws-guidance-text-wrap">
              <div className="ws-guidance-title">{t("Before You Begin: What You Need To Know")}</div>
              <div className="ws-guidance-desc">
                {t("Applying for a new connection takes about 10–20 minutes. Water and sewerage connections are linked to a registered Property ID. Please verify your property below, review the required information checklist, and ensure you have all supporting documents ready before starting.")}
              </div>
              <div className="ws-guidance-chips">
                <div className="ws-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{t("Estimated time: 10-20 minutes")}</span>
                </div>
                <div className="ws-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                  <span>{t("Requires Registered Property ID")}</span>
                </div>
                <div className="ws-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span>{t("Keep Scanned Documents Ready (≤ 5MB)")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Step 1: Property Verification Card */}
        <div className="ws-card">
          <div className="ws-step-header">
            <div className="ws-step-num-badge">1</div>
            <div>
              <h2 className="ws-step-title">{t("Property Verification & Linking")}</h2>
              <p className="ws-step-subtitle">
                {t("A registered Property ID is required to apply for a water/sewerage connection. Linking your property enables automatic address verification and autofills premises details.")}
              </p>
            </div>
          </div>

          <div className="ws-question-container">
            <label className="ws-question-label">
              <span className="ws-req-dot">*</span> {t("Do you have an existing property?")}
            </label>
            <RadioButtons
              t={t}
              options={radioOptions}
              optionsKey="name"
              value={hasProperty}
              selectedOption={hasProperty}
              onSelect={(val) => {
                setHasProperty(val);
                setSelectedProperty(null);
                setShowOtpVerification(false);
                setOtp("");
              }}
              style={{ display: "flex", gap: "24px" }}
            />
          </div>

          {/* Property YES Flow */}
          {hasProperty?.code === "YES" && (
            <div>
              <div className="ws-prop-guide-banner">
                <span className="ws-guide-step-tag">Step 1.1</span>
                <span>{t("Enter your registered mobile number, verify via OTP, and select your property from the dropdown.")}</span>
              </div>

              <div className="ws-prop-grid">
                {/* Mobile Input */}
                <div className="ws-field-col">
                  <Label>{t("Registered Mobile Number")}</Label>
                  <div className="ws-mobile-input-wrap">
                    <div style={{ flex: 1 }}>
                      <TextInput
                        t={t}
                        type="number"
                        isMandatory={false}
                        name="mobileNumber"
                        value={searchMobileNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setSearchMobileNumber(val);
                          setSelectedProperty(null);
                          setShowOtpVerification(false);
                          setOtp("");
                          setIsMobileVerified(false);
                        }}
                        placeholder={t("Enter 10-digit mobile number")}
                        maxLength={10}
                        disabled={isMobileVerified}
                      />
                    </div>
                    {searchMobileNumber?.length === 10 && !isMobileVerified && !showOtpVerification && (
                      <button
                        type="button"
                        className="ws-btn ws-btn-outline"
                        onClick={handleSendOtp}
                        disabled={isOtpSending}
                      >
                        {isOtpSending ? t("Sending...") : t("Send OTP")}
                      </button>
                    )}
                  </div>
                  <span className="ws-field-helper">{t("Enter the mobile number linked with your property registration.")}</span>
                </div>

                {/* Property Dropdown */}
                <div className="ws-field-col">
                  <Label>{t("Select Existing Property")}</Label>
                  {isLoading ? (
                    <div style={{ padding: "12px 0" }}><Loader /></div>
                  ) : (
                    <div>
                      <Dropdown
                        option={propertyOptions}
                        optionKey="displayName"
                        id="propertyId"
                        selected={selectedProperty}
                        select={(val) => {
                          setSelectedProperty(val);
                          setShowOtpVerification(false);
                          setOtp("");
                        }}
                        t={t}
                        placeholder={isMobileVerified ? t("Select Property from list") : t("Verify mobile number to view properties")}
                        disable={!isMobileVerified || propertyOptions.length === 0}
                      />
                      {selectedProperty && (
                        <div className="ws-selected-prop-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00703c" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{t("Property details & address will be automatically populated in the application.")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* OTP Verification Box */}
              {showOtpVerification && !isMobileVerified && (
                <div className="ws-otp-box">
                  <div className="ws-otp-header">
                    <div className="ws-otp-title-group">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a67a3" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <strong>{t("OTP Verification")}</strong>
                    </div>
                    <span className="ws-otp-subtitle">
                      {t("Enter the 6-digit OTP sent to")} <strong>{getMaskedPhone(searchMobileNumber)}</strong>
                    </span>
                  </div>

                  <div className="ws-otp-input-row">
                    <OTPInput style={{ marginBottom: "0px" }} length={6} onChange={setOtp} value={otp} />
                    <div className="ws-otp-actions">
                      <button
                        type="button"
                        className="ws-btn ws-btn-primary"
                        onClick={handleVerifyOtp}
                        disabled={otp.length < 6 || isOtpVerifying}
                      >
                        {isOtpVerifying ? t("Verifying...") : t("Verify OTP")}
                      </button>
                      <button
                        type="button"
                        className="ws-btn ws-btn-secondary"
                        onClick={handleSendOtp}
                        disabled={timeLeft > 0 || isOtpSending}
                      >
                        {timeLeft > 0 ? `${t("Resend OTP")} (${timeLeft < 10 ? `0${timeLeft}` : timeLeft}s)` : t("Resend OTP")}
                      </button>
                    </div>
                  </div>
                  {timeLeft > 0 && (
                    <div className="ws-otp-timer-note">
                      {t("Didn't receive OTP? You can resend after")} {timeLeft} {t("seconds")}.
                    </div>
                  )}
                </div>
              )}

              {/* Verified Success Banner */}
              {isMobileVerified && (
                <div className="ws-verified-banner">
                  <div className="ws-verified-text">
                    <span className="ws-verified-check">✓</span>
                    <div>
                      <strong>{t("Mobile number verified successfully!")}</strong>
                      <div className="ws-verified-sub">{t("Properties linked to this mobile number are available in the dropdown below.")}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ws-btn-link"
                    onClick={() => {
                      setIsMobileVerified(false);
                      setOtp("");
                      setShowOtpVerification(false);
                    }}
                  >
                    {t("Change Number")}
                  </button>
                </div>
              )}

              {/* No Property Found */}
              {searchMobileNumber?.length === 10 && isMobileVerified && !isLoading && propertyOptions.length === 0 && (
                <div className="ws-no-prop-alert">
                  <div className="ws-no-prop-icon">⚠️</div>
                  <div className="ws-no-prop-content">
                    <strong>{t("No Registered Property Found")}</strong>
                    <p>{t("No property is currently registered with this mobile number. You need a registered property to apply for a connection.")}</p>
                    <button className="ws-btn ws-btn-primary" type="button" onClick={handleCreateProperty}>
                      {t("Register New Property")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Property NO Flow */}
          {hasProperty?.code === "NO" && (
            <div className="ws-prop-no-block">
              <div className="ws-no-prop-notice">
                <div className="ws-notice-icon-circle">ℹ️</div>
                <div>
                  <h4>{t("Property Registration is Mandatory")}</h4>
                  <p>{t("To apply for a new water or sewerage connection with Delhi Jal Board, your premises must first be registered with a Property ID. Please click below to register your property.")}</p>
                </div>
              </div>
              <button className="ws-btn ws-btn-primary" type="button" onClick={handleCreateProperty}>
                {t("Register New Property")}
              </button>
            </div>
          )}
        </div>

        {/* 3. Checklist & Requirements Section */}
        <div className="ws-card">
          <div className="ws-checklist-header">
            <div className="ws-checklist-title-row">
              <span className="ws-section-badge">{t("Application Checklist")}</span>
              <h2 className="ws-checklist-title">{t("What You Will Need During The Application")}</h2>
            </div>

            {/* Clear Explanatory Callout Box directly resolving user confusion */}
            <div className="ws-confused-user-explainer">
              <div className="ws-explainer-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div>
                {/* <strong className="ws-explainer-title">{t("Why are these items listed here?")}</strong> */}
                <p className="ws-explainer-desc">
                  {t("The items below outline the exact information you will enter and the supporting documents you will upload in the upcoming application screens. You do NOT need to fill them in on this screen—this checklist helps you gather all details and keep scanned copies ready in advance for a fast, hassle-free submission.")}
                </p>
              </div>
            </div>
          </div>

          {/* Responsive 2-Column Grid: Information vs Documents */}
          <div className="ws-checklist-grid">
            {/* Left Column: Information to be Entered */}
            <div className="ws-checklist-column">
              <div className="ws-col-header">
                <div className="ws-col-icon-wrap" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="ws-col-title">{t("1. Information You Will Fill In")}</h3>
                  <p className="ws-col-subtitle">{t("Fields asked across the application stages")}</p>
                </div>
              </div>

              <div className="ws-group-cards-list">
                {/* Connection Details Group */}
                <div className="ws-group-card">
                  <div className="ws-group-title">
                    <span>💧</span>
                    <span>{t("Connection Details")}</span>
                  </div>
                  <div className="ws-tag-grid">
                    <span className="ws-tag-item">{t("Request Type")}</span>
                    <span className="ws-tag-item">{t("Applicant Type")}</span>
                    <span className="ws-tag-item">{t("Is Divyangjan / Person with Disability?")}</span>
                  </div>
                </div>

                {/* Connection Holder Details Group */}
                <div className="ws-group-card">
                  <div className="ws-group-title">
                    <span>👤</span>
                    <span>{t("Connection Holder Details")}</span>
                  </div>
                  <div className="ws-tag-grid">
                    <span className="ws-tag-item">{t("Name")}</span>
                    <span className="ws-tag-item">{t("Middle Name")}</span>
                    <span className="ws-tag-item">{t("Last Name")}</span>
                    <span className="ws-tag-item">{t("Gender")}</span>
                    <span className="ws-tag-item">{t("Mobile Number")}</span>
                    <span className="ws-tag-item">{t("Email ID")}</span>
                  </div>
                </div>

                {/* Property Address Group */}
                <div className="ws-group-card">
                  <div className="ws-group-title">
                    <span>📍</span>
                    <span>{t("Property Address & Location")}</span>
                  </div>
                  <div className="ws-tag-grid">
                    <span className="ws-tag-item">{t("Address Type")}</span>
                    <span className="ws-tag-item">{t("City")}</span>
                    <span className="ws-tag-item">{t("Pincode")}</span>
                    <span className="ws-tag-item">{t("Locality")}</span>
                    <span className="ws-tag-item">{t("Sub-Locality")}</span>
                    <span className="ws-tag-item">{t("Street Name / Gali")}</span>
                    <span className="ws-tag-item">{t("Address Line 1")}</span>
                    <span className="ws-tag-item">{t("Address Line 2")}</span>
                    <span className="ws-tag-item">{t("House No.")}</span>
                    <span className="ws-tag-item">{t("Latitude")}</span>
                    <span className="ws-tag-item">{t("Longitude")}</span>
                    <span className="ws-tag-item">{t("Assembly")}</span>
                    <span className="ws-tag-item">{t("Ward")}</span>
                    <span className="ws-tag-item">{t("Zone")}</span>
                    <span className="ws-tag-item">{t("Landmark")}</span>
                  </div>
                </div>

                {/* Property Usage Details Group */}
                <div className="ws-group-card">
                  <div className="ws-group-title">
                    <span>🏢</span>
                    <span>{t("Property & Connection Usage")}</span>
                  </div>
                  <div className="ws-tag-grid">
                    <span className="ws-tag-item">{t("Category Type")}</span>
                    <span className="ws-tag-item">{t("Property Category")}</span>
                    <span className="ws-tag-item">{t("Property Type")}</span>
                    <span className="ws-tag-item">{t("Water Usage Type")}</span>
                    <span className="ws-tag-item">{t("Number of Floors")}</span>
                    <span className="ws-tag-item">{t("Plot Area")}</span>
                    <span className="ws-tag-item">{t("Built-up Area")}</span>
                    <span className="ws-tag-item">{t("Year of Construction")}</span>
                    <span className="ws-tag-item">{t("Dwelling Units")}</span>
                  </div>
                </div>

                {/* DJB Employee Details Group */}
                <div className="ws-group-card">
                  <div className="ws-group-title">
                    <span>🏛️</span>
                    <span>{t("DJB Employee Details (if applicable)")}</span>
                  </div>
                  <div className="ws-tag-grid">
                    <span className="ws-tag-item">{t("Employee ID")}</span>
                    <span className="ws-tag-item">{t("Date of Retirement")}</span>
                    <span className="ws-tag-item">{t("Employee Designation")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Documents to Upload & DigiLocker */}
            <div className="ws-checklist-column">
              <div className="ws-col-header">
                <div className="ws-col-icon-wrap" style={{ background: "#fef3c7", color: "#b45309" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="ws-col-title">{t("2. Documents to Upload")}</h3>
                  <p className="ws-col-subtitle">{t("Keep clear scanned files ready (PDF/JPG/PNG, ≤ 5MB)")}</p>
                </div>
              </div>

              <div className="ws-docs-cards-list">
                {/* Document 1: Identity Proof */}
                <div className="ws-doc-item-card">
                  <div className="ws-doc-badge">🪪</div>
                  <div className="ws-doc-info">
                    <div className="ws-doc-name">{t("Proof of Identity")}</div>
                    <div className="ws-doc-desc">{t("Aadhaar Card, Voter ID, PAN Card, or Passport")}</div>
                  </div>
                  <span className="ws-req-pill">{t("Mandatory")}</span>
                </div>

                {/* Document 2: Address / Ownership Proof */}
                <div className="ws-doc-item-card">
                  <div className="ws-doc-badge">🏠</div>
                  <div className="ws-doc-info">
                    <div className="ws-doc-name">{t("Proof of Address / Ownership")}</div>
                    <div className="ws-doc-desc">{t("Registered Sale Deed, Conveyance Deed, or Allotment Letter")}</div>
                  </div>
                  <span className="ws-req-pill">{t("Mandatory")}</span>
                </div>

                {/* Document 3: Electricity Bill */}
                <div className="ws-doc-item-card">
                  <div className="ws-doc-badge">⚡</div>
                  <div className="ws-doc-info">
                    <div className="ws-doc-name">{t("Electricity Bill")}</div>
                    <div className="ws-doc-desc">{t("Latest paid electricity bill of the premises")}</div>
                  </div>
                  <span className="ws-req-pill">{t("Mandatory")}</span>
                </div>

                {/* Document 4: Plumber Report */}
                <div className="ws-doc-item-card">
                  <div className="ws-doc-badge">🔧</div>
                  <div className="ws-doc-info">
                    <div className="ws-doc-name">{t("Plumber Report")}</div>
                    <div className="ws-doc-desc">{t("Completion certificate from a licensed plumber")}</div>
                  </div>
                  <span className="ws-opt-pill">{t("As Applicable")}</span>
                </div>

                {/* Document 5: Building Plan */}
                <div className="ws-doc-item-card">
                  <div className="ws-doc-badge">📐</div>
                  <div className="ws-doc-info">
                    <div className="ws-doc-name">{t("Building Plan")}</div>
                    <div className="ws-doc-desc">{t("Sanctioned / approved layout plan of the structure")}</div>
                  </div>
                  <span className="ws-opt-pill">{t("As Applicable")}</span>
                </div>

                {/* Document 6: Property Tax Receipt */}
                <div className="ws-doc-item-card">
                  <div className="ws-doc-badge">🧾</div>
                  <div className="ws-doc-info">
                    <div className="ws-doc-name">{t("Property Tax Receipt")}</div>
                    <div className="ws-doc-desc">{t("Latest property tax receipt / assessment notice")}</div>
                  </div>
                  <span className="ws-opt-pill">{t("As Applicable")}</span>
                </div>
              </div>

              {/* DigiLocker Fast-Track Box */}
              <div className="ws-digilocker-box">
                <div className="ws-digilocker-header">
                  <div className="ws-dl-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="ws-dl-title">{t("Fast-Track with DigiLocker")}</div>
                    <div className="ws-dl-sub">{t("Fetch your verified Aadhaar, Electricity Bill, and Identity documents directly without manual upload.")}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="ws-btn ws-btn-digilocker"
                  onClick={handleDigiLockerLogin}
                >
                  <span>🔐</span>
                  <span>{t("Login with DigiLocker")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Action Card */}
        <div className="ws-action-card">
          <div className="ws-action-content">
            <div className="ws-action-hint">
              {!hasProperty ? (
                <span className="ws-hint-text ws-hint-warning">
                  ⚠️ {t("Please select whether you have an existing property in Step 1 to continue.")}
                </span>
              ) : hasProperty?.code === "YES" && !selectedProperty ? (
                <span className="ws-hint-text ws-hint-warning">
                  ⚠️ {t("Please verify your mobile number and select a property from the dropdown to proceed.")}
                </span>
              ) : hasProperty?.code === "NO" ? (
                <span className="ws-hint-text ws-hint-warning">
                  ℹ️ {t("Please register your property using the button in Step 1 before applying.")}
                </span>
              ) : (
                <span className="ws-hint-text ws-hint-success">
                  ✓ {t("All prerequisites verified! You are ready to start the application form.")}
                </span>
              )}
            </div>

            <div className="ws-action-buttons">
              <button
                type="button"
                className={`ws-btn ws-btn-next ${isNextDisabled ? "ws-btn-disabled" : ""}`}
                disabled={isNextDisabled}
                onClick={handleNext}
              >
                <span>{t("Next: Start Application")}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <Toast
          error={showToast.key === "error"}
          warning={showToast.key === "warning"}
          label={t(showToast.message)}
          onClose={() => setShowToast(null)}
          isDleteBtn={true}
        />
      )}
    </React.Fragment>
  );
};

export default WSInfoPage;
