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
    { code: "YES", i18nKey: "TL_COMMON_YES" },
    { code: "NO", i18nKey: "TL_COMMON_NO" },
  ];

  const proceedToNext = () => {
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
        setShowToast({ key: "error", message: "Failed to send OTP (No response)" });
        return;
      }
      if (response?.error || response?.data?.error) {
        const errObj = response?.error || response?.data?.error;
        setIsOtpSending(false);
        setShowToast({ key: "error", message: errObj?.fields?.[0]?.message || errObj?.message || (t("WS_FAILED_TO_SEND_OTP") || "Failed to send OTP") });
        return;
      }
      if (response?.Errors || response?.data?.Errors) {
        const errObj = response?.Errors || response?.data?.Errors;
        setIsOtpSending(false);
        setShowToast({ key: "error", message: errObj?.[0]?.message || (t("WS_FAILED_TO_SEND_OTP") || "Failed to send OTP") });
        return;
      }

      setIsOtpSending(false);
      setShowOtpVerification(true);
      setTimeLeft(30);
      setShowToast({ key: "success", message: t("PT_SEC_OTP_SENT_SUCEESS") || "OTP sent successfully!" });
    } catch (err) {
      setIsOtpSending(false);
      let errMsg = t("WS_FAILED_TO_SEND_OTP") || "Failed to send OTP";
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
      setShowToast({ key: "warning", message: t("WS_PLEASE_ENTER_VALID_OTP") || "Please enter a valid 6-digit OTP" });
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
      setShowToast({ key: "success", message: t("WS_OTP_VERIFIED_SUCCESSFULLY") || "OTP verified successfully!" });
      setShowOtpVerification(false);
      setIsMobileVerified(true);
    } catch (err) {
      setIsOtpVerifying(false);
      let errMsg = err.message || (t("WS_FAILED_TO_VERIFY_OTP") || "Failed to verify OTP");
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
        setShowToast({ key: "warning", message: t("WS_PLEASE_VERIFY_MOBILE_NUMBER") || "Please verify mobile number first" });
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


  return (
    <React.Fragment>
      <Card>
        <CardHeader>{t("WS_COMMON_APPL_NEW_CONNECTION")}</CardHeader>

        <CitizenInfoLabel
          style={{ margin: "0px", textAlign: "left", marginBottom: "16px" }}
          textStyle={{ color: "#0B0C0C" }}
          text={t("WS_INFO_ESTIMATED_TIME_10_20_MINS")}
          showInfo={false}
        />

        <div style={{ marginBottom: "24px" }}>
          <CardSubHeader>{t("WS_DO_YOU_HAVE_EXISTING_PROPERTY")}</CardSubHeader>
          <RadioButtons
            t={t}
            options={radioOptions}
            optionsKey="i18nKey"
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

        {hasProperty?.code === "YES" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
                <div>
                  <Label>{t("CORE_COMMON_MOBILE_NUMBER")}</Label>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
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
                        placeholder={t("WS_ENTER_MOBILE_NUMBER") || "Enter mobile number"}
                        maxLength={10}
                        disabled={isMobileVerified}
                      />
                    </div>
                    {searchMobileNumber?.length === 10 && !isMobileVerified && !showOtpVerification && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isOtpSending}
                        style={{
                          padding: "8px 16px",
                          border: "1px solid #1a67a3",
                          background: "white",
                          color: "#1a67a3",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {isOtpSending ? (t("WS_SENDING_OTP") || "Sending...") : (t("PTUPNO_SENDOTP") || "Send OTP")}
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>{t("WS_SELECT_EXISTING_PROPERTY")}</Label>
                  {isLoading ? (
                    <Loader />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                        placeholder={t("PT_SELECT_PROPERTY")}
                        disable={!isMobileVerified || propertyOptions.length === 0}
                      />
                      {propertyOptions.length > 0 && (
                        <span style={{ fontSize: "14px", color: "#505A5F" }}>{t("WS_PROPERTY_AUTOFILL_MSG")}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline OTP Verification Box */}
              {showOtpVerification && !isMobileVerified && (
                <div style={{ border: "1px solid #d6d5d4", borderRadius: "4px", background: "#f8f9fa", padding: "12px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "8px" }}>{t("WS_VERIFY_OTP_HEADER") || "OTP Verification"}</div>
                  <div style={{ color: "#505A5F", marginBottom: "16px" }}>
                    {t("WS_ENTER_OTP_SENT_TO") || "Enter the 6-digit OTP sent to"} {getMaskedPhone(searchMobileNumber)}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
                    <OTPInput style={{marginBottom: "0px" }} length={6} onChange={setOtp} value={otp} />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otp.length < 6 || isOtpVerifying}
                      style={{
                        padding: "6px 20px",
                        background: otp.length < 6 || isOtpVerifying ? "#ccc" : "#1a67a3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: otp.length < 6 || isOtpVerifying ? "not-allowed" : "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {isOtpVerifying ? (t("WS_VERIFYING_OTP") || "Verifying...") : (t("WS_VERIFY_OTP_AND_PROCEED") || "Verify OTP")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={timeLeft > 0 || isOtpSending}
                      style={{
                        padding: "6px 20px",
                        background: "white",
                        color: timeLeft > 0 || isOtpSending ? "#ccc" : "#1a67a3",
                        border: `1px solid ${timeLeft > 0 || isOtpSending ? "#ccc" : "#1a67a3"}`,
                        borderRadius: "4px",
                        cursor: timeLeft > 0 || isOtpSending ? "not-allowed" : "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {timeLeft > 0 ? `${t("WS_RESEND_OTP") || "Resend OTP"} (00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft})` : (t("WS_RESEND_OTP") || "Resend OTP")}
                    </button>
                  </div>
                  {timeLeft > 0 && (
                    <div style={{ marginTop: "12px", color: "#505A5F", fontSize: "14px" }}>
                      {t("WS_DIDNT_RECEIVE_OTP_RESEND") || "Didn't receive OTP? You can resend after"} {timeLeft} {t("WS_SECONDS") || "seconds"}.
                    </div>
                  )}
                </div>
              )}

              {/* Inline Success Banner */}
              {isMobileVerified && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#d4edda", border: "1px solid #c3e6cb", color: "#155724", padding: "12px 16px", borderRadius: "4px"}}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#28a745", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "inline-flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>✓</span>
                    <span style={{ fontWeight: "bold" }}>{t("WS_MOBILE_VERIFIED_SUCCESSFULLY") || "Mobile number verified successfully!"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileVerified(false);
                      setOtp("");
                      setShowOtpVerification(false);
                    }}
                    style={{ color: "#1a67a3", background: "none", border: "none", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }}
                  >
                    {t("WS_CHANGE_NUMBER") || "Change Number"}
                  </button>
                </div>
              )}
              
              {searchMobileNumber?.length === 10 && isMobileVerified && !isLoading && propertyOptions.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                  <span style={{ color: "#d63031", fontWeight: "bold" }}>
                    {t("WS_NO_PROPERTY_FOUND_ON_THIS_NUMBER") || "No property found on this number, please create the property first."}
                  </span>
                  <span onClick={handleCreateProperty}>
                    <button className="submit-bar" type="button" style={{ color: "white", margin: 0 }}>
                      {t("CPT_CREATE_PROPERTY")}
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {hasProperty?.code === "NO" && (
          <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <span onClick={handleCreateProperty}>
              <button className="submit-bar" type="button" style={{ color: "white", margin: 0 }}>
                {t("CPT_CREATE_PROPERTY")}
              </button>
            </span>
          </div>
        )}

        <div>
          <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_COMMON_CONNECTION_DETAIL")}</CardSubHeader>
          <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
            <li>{t("WS_SERVICE_TYPE")}</li>
            <li>{t("WS_CONNECTION_TYPE")}</li>
            <li>{t("WS_WATER_DEMAND_TYPE")}</li>
            <li>{t("WS_APPLICANT_TYPE")}</li>
            <li>{t("WS_DIVYANGJAN")}</li>
            <li>{t("WS_DOMESTIC_TYPE")}</li>
          </ul>

          <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_COMMON_CONNECTION_HOLDER_DETAILS_HEADER")}</CardSubHeader>
          <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
            <li>{t("WS_OWN_DETAIL_NAME")}</li>
            <li>{t("WS_OWN_DETAIL_MIDDLE_NAME")}</li>
            <li>{t("WS_OWN_DETAIL_LAST_NAME")}</li>
            <li>{t("WS_CONN_HOLDER_OWN_DETAIL_GENDER_LABEL")}</li>
            <li>{t("WS_OWN_DETAIL_GUARDIAN_LABEL")}</li>
            <li>{t("CORE_COMMON_MOBILE_NUMBER")}</li>
            <li>{t("WS_EMAIL_ID")}</li>
          </ul>

          <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("PT_LOCATION_DETAILS")}</CardSubHeader>
          <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
            <li>{t("WS_ZRO_LOCATION")}</li>
            <li>{t("COMMON_ADDRESS_TYPE")}</li>
            <li>{t("CITY")}</li>
            <li>{t("PINCODE")}</li>
            <li>{t("LOCALITY")}</li>
            <li>{t("SubLocality")}</li>
            <li>{t("STREET_NAME")}</li>
            <li>{t("ADDRESS_LINE1")}</li>
            <li>{t("ADDRESS_LINE2")}</li>
            <li>{t("HOUSE_NO")}</li>
            <li>{t("LATITUDE")}</li>
            <li>{t("LONGITUDE")}</li>
            <li>{t("ASSEMBLY")}</li>
            <li>{t("WARD")}</li>
            <li>{t("ZONE")}</li>
            <li>{t("LANDMARK")}</li>
          </ul>

          <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS")}</CardSubHeader>
          <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
            <li>{t("WS_CATEGORY_TYPE")}</li>
            <li>{t("WS_PROPERTY_CATEGORY")}</li>
            <li>{t("WS_PROPERTY_TYPE")}</li>
            <li>{t("WS_WATER_CONNECTION_USAGE_TYPE")}</li>
            <li>{t("WS_NUMBER_OF_FLOORS")}</li>
            <li>{t("WS_PLOT_AREA")}</li>
            <li>{t("WS_BUILT_UP_AREA")}</li>
            <li>{t("WS_SELECT_YEAR_OF_CONSTRUCTION")}</li>
            <li>{t("WS_NUMBER_OF_DWELLING_UNITS")}</li>
          </ul>

          <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_DJB_EMPLOYEE")}</CardSubHeader>
          <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
            <li>{t("WS_EMPLOYEE_ID")}</li>
            <li>{t("WS_DATE_OF_RETIREMENT")}</li>
            <li>{t("WS_EMPLOYEE_DESIGNATION")}</li>
          </ul>

          <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_BANK_DETAILS")}</CardSubHeader>
          <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
            <li>{t("WS_NAME_OF_BANK")}</li>
            <li>{t("WS_NAME_OF_BRANCH")}</li>
            <li>{t("WS_IFSC_CODE")}</li>
            <li>{t("WS_BANK_ACCOUNT_NO")}</li>
          </ul>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0", marginBottom: "16px" }}>
            <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_DOCUMENTS")}</CardSubHeader>
          </div>
          <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
            <li>{t("WS_DOC_IDENTITY_PROOF")}</li>
            <li>{t("WS_DOC_ADDRESS_PROOF")}</li>
            <li>{t("WS_DOC_ELECTRICITY_BILL")}</li>
            <li>{t("WS_DOC_PLUMBER_REPORT")}</li>
            <li>{t("WS_DOC_BUILDING_PLAN")}</li>
            <li>{t("WS_DOC_PROPERTY_TAX_RECEIPT")}</li>
            <li>{t("WS_DOC_APPLICANT_PHOTOGRAPH")}</li>
          </ul>
        </div>

        {!hasProperty || (hasProperty?.code === "YES" && !selectedProperty) ? (
          <SubmitBar label={t("CS_COMMON_NEXT")} onSubmit={() => {}} disabled={true} />
        ) : (
          <SubmitBar label={t("CS_COMMON_NEXT")} onSubmit={handleNext} disabled={hasProperty?.code === "NO"} />
        )}
        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "12px" }}>
          <SubmitBar
            label={t("WS_LOGIN_WITH_DIGILOCKER")}
            onSubmit={async (e) => {
              e.preventDefault();
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
            }}
          />
        </div>
      </Card>
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
