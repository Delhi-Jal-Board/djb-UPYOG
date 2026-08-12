import React, { useState, useEffect } from "react";
import { CitizenConsentForm, Loader, CheckBox } from "@djb25/digit-ui-react-components";

const SelectMobileNumber = ({ t, handleMobileNumberSelect, mobileNumber, setMobileNumber }) => {
  const [isCheckBox, setIsCheckBox] = useState(false);
  const [mdmsConfig, setMdmsConfig] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isCCFEnabled, setisCCFEnabled] = useState(false);
  const { isLoading, data } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "common-masters", [{ name: "CitizenConsentForm" }]);

  useEffect(() => {
    if (data?.["common-masters"]?.CitizenConsentForm?.[0]?.isCitizenConsentFormEnabled) {
      setisCCFEnabled(data?.["common-masters"]?.CitizenConsentForm?.[0]);
    }
  }, [data]);

  const checkLabels = () => {
    return (
      <span>
        {isCCFEnabled?.checkBoxLabels?.map((data, index) => {
          return (
            <span key={index}>
              {data?.linkPrefix && <span>{t(`${data?.linkPrefix}`, "I agree to the ")}</span>}
              {data?.link && (
                <span
                  id={data?.linkId}
                  className="privacy-link"
                  onClick={(e) => {
                    setMdmsConfig(e.target.id);
                  }}
                >
                  {t(`${data?.link}`, "Privacy Policy")}
                </span>
              )}
              {data?.linkPostfix && <span>{t(`${data?.linkPostfix}`, "")}</span>}
              {index === isCCFEnabled?.checkBoxLabels?.length - 1 && t("LABEL", "")}
            </span>
          );
        })}
      </span>
    );
  };

  if (isLoading) return <Loader />;

  const register = async (e) => {
    e.preventDefault();
    const tenantId = Digit.ULBService.getStateId();
    const data = await Digit.DigiLockerService.register({ module: "REGISTER", tenantId });
    const redirectUrl = data.redirectURL;
    sessionStorage.setItem("code_verfier_register", data?.codeverifier);
    window.location.href = redirectUrl;
  };

  const isValidIndianMobile = (num) => {
    return /^[6-9]\d{9}$/.test(num);
  };

  const getErrorMessage = () => {
    if (!mobileNumber) return "Enter mobile number";
    if (mobileNumber.length < 10) return "Must be 10 digits";
    if (!/^[6-9]/.test(mobileNumber)) return "Must start with 6-9";
    if (!isCheckBox) return "Please Agree to Privacy Policy";
    return "";
  };

  return (
    <form onSubmit={() => handleMobileNumberSelect()}>
      <div className="registration__header">
        <h1 className="registration__title">Step 1: Enter Mobile Number</h1>
        <span className="registration__step-count">1 of 3</span>
      </div>

      <p className="registration__description">Enter your mobile number to receive OTP.</p>

      <div className="registration__field">
        <label name="mobile-number" for="mobile-number" className="registration__label">
          Mobile Number
        </label>

        <div className="registration__input-group">
          <select
            id="mobile-number"
            name="mobile-number"
            className="registration__select"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled
          >
            <option>+91</option>
            <option>+1</option>
          </select>
          <div className="registration__input">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#90a1b9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-phone-icon lucide-phone"
            >
              <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
            </svg>
            <input
              name="mobileNumber"
              className="phone"
              value={mobileNumber}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, ""); // remove non-digits
                if (value.length > 10) value = value.slice(0, 10); // limit to 10
                setMobileNumber(value);
              }}
              placeholder="Enter mobile number"
              inputMode="numeric"
            />
          </div>
        </div>
        <p className="registration__hint">We will send a 6-digit code</p>
      </div>

      {isCCFEnabled?.isCitizenConsentFormEnabled && (
        <div className="consent-form-wrapper">
          <CheckBox
            label={checkLabels()}
            value={isCheckBox}
            checked={isCheckBox}
            onChange={(e) => setIsCheckBox(e.target.checked)}
            styles={{ marginBottom: "20px" }}
          />

          <CitizenConsentForm
            t={t}
            isCheckBoxChecked={(e) => setIsCheckBox(e.target.checked)}
            labels={isCCFEnabled?.checkBoxLabels}
            mdmsConfig={mdmsConfig}
            setMdmsConfig={setMdmsConfig}
          />
        </div>
      )}

      <div className="or-separator-container">
        <div className="or-text">{t("OR_CONTINUE_WITH", "OR CONTINUE WITH")}</div>
        <button className="digilocker-btn" type="button" onClick={(e) => register(e)}>
          <img src="https://meripehchaan.gov.in/assets/img/icon/digi.png" alt="DigiLocker" />
          {t("CS_REGISTER_WITH_DIGILOCKER", "Register with DigiLocker")}
        </button>
      </div>

      <div className="btn-tooltip-wrapper">
        <button className="registration__button" disabled={!isValidIndianMobile(mobileNumber) || !isCheckBox} type="submit">
          Send OTP
        </button>

        {(!isValidIndianMobile(mobileNumber) || !isCheckBox) && <div className="btn-tooltip">{getErrorMessage()}</div>}
      </div>
    </form>
  );
};

export default SelectMobileNumber;
