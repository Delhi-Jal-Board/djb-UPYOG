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
} from "@djb25/digit-ui-react-components";

const getMaskedPhone = (phone) => {
  if (!phone || phone.length < 10) return "NA";
  return `******${phone.slice(-4)}`;
};

const getAddress = (address, t) => {
  return `${address?.doorNo ? `${address?.doorNo}, ` : ""} ${address?.street ? `${address?.street}, ` : ""}${address?.landmark ? `${address?.landmark}, ` : ""
    }${t(Digit.Utils.pt.getMohallaLocale(address?.locality.code, address?.tenantId))}, ${t(Digit.Utils.pt.getCityLocale(address?.tenantId))}${address?.pincode && t(address?.pincode) ? `, ${address.pincode}` : " "
    }`;
};

const WSInfoPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();
  const isEmployee = window.location.href.includes("/employee");

  const [hasProperty, setHasProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchMobileNumber, setSearchMobileNumber] = useState("");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userMobileNumber = Digit.UserService.getUser()?.info?.mobileNumber;
  const mobileNumberToSearch = isEmployee ? searchMobileNumber : userMobileNumber;

  const { isLoading, data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: { mobileNumber: mobileNumberToSearch }, tenantId: tenantId },
    {
      filters: { mobileNumber: mobileNumberToSearch },
      tenantId: tenantId,
      enabled: hasProperty?.code === "YES" && mobileNumberToSearch?.length === 10 ? true : false,
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
      history.push(`${baseUrl}/old-application?propertyId=${selectedProperty.propertyId}`);
    }
    else {
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
          userType: isEmployee ? "EMPLOYEE" : "CITIZEN"
        }
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
        setShowToast({ key: "error", message: errObj?.fields?.[0]?.message || errObj?.message || "Failed to send OTP" });
        return;
      }
      if (response?.Errors || response?.data?.Errors) {
        const errObj = response?.Errors || response?.data?.Errors;
        setIsOtpSending(false);
        setShowToast({ key: "error", message: errObj?.[0]?.message || "Failed to send OTP" });
        return;
      }

      setIsOtpSending(false);
      setShowOtpVerification(true);
      setShowToast({ key: "success", message: "OTP sent successfully!" });
    } catch (err) {
      setIsOtpSending(false);
      let errMsg = "Failed to send OTP";
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
      setShowToast({ key: "warning", message: "Please enter a valid 6-digit OTP" });
      return;
    }
    setIsOtpVerifying(true);
    try {
      // Intentionally not sending userType in validateOtp as per original mutation code
      const payload = {
        otp: {
          otp: otp,
          identity: mobileNumberToSearch,
          tenantId: "dl"
        }
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
      setShowToast({ key: "success", message: "OTP verified successfully!" });

      // Proceed safely
      proceedToNext();
    } catch (err) {
      setIsOtpVerifying(false);
      let errMsg = err.message || "Failed to verify OTP";
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
      if (!isEmployee) {
        proceedToNext();
      } else {
        handleSendOtp(e);
      }
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

  if (showOtpVerification) {
    return (
      <React.Fragment>
        <Card>
          <form onSubmit={handleVerifyOtp}>
            <CardHeader>{t("WS_VERIFY_OTP_HEADER") || "Verify OTP"}</CardHeader>
            <div style={{ marginBottom: "24px" }}>
              <Label>{t("WS_ENTER_OTP_SENT_TO") || "Enter OTP sent to"} +91 {getMaskedPhone(mobileNumberToSearch)} *</Label>
              <TextInput
                t={t}
                type="number"
                isMandatory={false}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t("WS_ENTER_6_DIGIT_OTP") || "Enter 6-digit OTP"}
                style={{ width: "100%", maxWidth: "300px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isOtpSending}
                style={{ color: "#f47738", background: "none", border: "none", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }}
              >
                {isOtpSending ? (t("WS_SENDING_OTP") || "Sending...") : (t("WS_RESEND_OTP") || "Resend OTP")}
              </button>
              <button
                type="button"
                onClick={() => setShowOtpVerification(false)}
                style={{ color: "#f47738", background: "none", border: "none", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }}
              >
                {t("CS_COMMON_CANCEL") || "Cancel"}
              </button>
            </div>
            <SubmitBar
              label={t("WS_VERIFY_OTP_AND_PROCEED") || "Verify & Proceed"}
              onSubmit={handleVerifyOtp}
              disabled={otp.length < 6 || isOtpVerifying}
              submit={true}
            />
          </form>
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
  }

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
          <div style={{ marginBottom: "24px" }}>
            {isEmployee && (
              <div style={{ display: "flex", gap: "24px", marginBottom: "16px", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Label>{t("CORE_COMMON_MOBILE_NUMBER")}</Label>
                  <TextInput
                    t={t}
                    type={"number"}
                    isMandatory={false}
                    name="mobileNumber"
                    value={searchMobileNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= 10) {
                        setSearchMobileNumber(val);
                        setSelectedProperty(null);
                        setShowOtpVerification(false);
                        setOtp("");
                      }
                    }}
                    placeholder={t("Enter mobile number")}
                    maxLength={10}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>{t("WS_SELECT_EXISTING_PROPERTY")}</Label>
                  <div className="field">
                    <Dropdown
                      className="form-field"
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
                      disable={isLoading || propertyOptions.length === 0}
                    />
                  </div>
                </div>
              </div>
            )}

            {!isEmployee && <Label>{t("WS_SELECT_EXISTING_PROPERTY")}</Label>}
            {isLoading && !isEmployee ? (
              <Loader />
            ) : (
              propertyOptions.length > 0 &&
              !isEmployee && (
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
                  />
                  <span style={{ fontSize: "14px", color: "#505A5F" }}>{t("WS_PROPERTY_AUTOFILL_MSG")}</span>
                </div>
              )
            )}
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

        <CardSubHeader style={{ marginTop: "0", marginBottom: "0" }}>{t("WS_COMMON_CONNECTION_DETAIL")}</CardSubHeader>
        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginBottom: "24px", lineHeight: "2" }}>
          <li>{t("WS_SERVICE_TYPE")}</li>
          <li>{t("WS_CONNECTION_TYPE")}</li>
          <li>{t("WS_WATER_DEMAND_TYPE")}</li>
          <li>{t("WS_APPLICANT_TYPE")}</li>
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

        {!hasProperty || (hasProperty?.code === "YES" && !selectedProperty) ? (
          <SubmitBar label={t("CS_COMMON_NEXT")} onSubmit={() => { }} disabled={true} />
        ) : (
          <SubmitBar label={t("CS_COMMON_NEXT")} onSubmit={handleNext} disabled={(hasProperty?.code === "NO")} />
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
