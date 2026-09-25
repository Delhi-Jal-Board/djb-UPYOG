import { DatePicker, Dropdown } from "@djb25/digit-ui-react-components";
import React, { useState } from "react";

const SelectName = ({ t, profileData, setProfileData, handleComplete, stateCode }) => {
  const [emailError, setEmailError] = useState(false);

  const { data: applicantGender } = Digit.Hooks.useEnabledMDMS(
    stateCode || Digit.ULBService.getStateId(),
    "common-masters",
    [{ name: "GenderType" }],
    {
      select: (data) => {
        const formattedData = data?.["common-masters"]?.["GenderType"];
        return formattedData;
      },
    }
  );

  let genderOptions = [];
  applicantGender &&
    applicantGender.forEach((genderoption) => {
      if (genderoption.active) {
        genderOptions.push({ i18nKey: `COMMON_GENDER_${genderoption.code}`, code: `${genderoption.code}`, name: `${genderoption.code}` });
      }
    });

  const validateEmail = (email) => {
    if (!email) {
      setEmailError(false);
      return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(!re.test(email));
  };

  return (
    <React.Fragment>
      <div className="registration__header">
        <h1 className="registration__title">{t("CORE_REGISTER_HEADER")}</h1>
        <span className="registration__step-count">3 of 3</span>
      </div>

      <p className="registration__description">{t("CORE_COMPLETE_PROFILE")}</p>

      <div className="registration__field">
        <label className="registration__label">{t("ES_VENDOR_SUPERVISOR_FULL_NAME")}</label>
        <input
          className="registration__input"
          value={profileData.fullName}
          onChange={(e) =>
            setProfileData({
              ...profileData,
              fullName: e.target.value,
            })
          }
          placeholder={t("CORE_COMMON_NAME_PLACEHOLDER")}
        />
      </div>

      <div className="registration__field">
        <label className="registration__label">{t("COMMON_EMAIL_ID")}(optional)</label>
        <input
          className={`registration__input ${emailError ? "registration__input--error" : ""}`}
          value={profileData.emailId || ""}
          onChange={(e) => {
            const value = e.target.value;
            setProfileData({
              ...profileData,
              emailId: value,
            });
            validateEmail(value);
          }}
          placeholder={t("CS_PROFILE_EMAIL_PLACEHOLDER")}
        />
        {emailError && (
          <span className="registration__error-msg" style={{ color: "red", fontSize: "12px", marginTop: "4px", display: "block" }}>
            {t("PT_EMAIL_ID_ERROR_MESSAGE")}
          </span>
        )}
      </div>

      <div className="registration__field">
        <label className="registration__label">{t("CS_COMMON_SELECT_GENDER")}</label>
        <Dropdown
          t={t}
          option={genderOptions}
          optionKey="i18nKey"
          id="gender"
          selected={profileData.gender}
          select={(value) =>
            setProfileData({
              ...profileData,
              gender: value,
            })
          }
          placeholder={t("CS_COMMON_SELECT_GENDER")}
          style={{ width: "100%" }}
        />
      </div>

      <div className="registration__field">
        <label className="registration__label">{t("CORE_COMMON_PROFILE_DOB")}</label>
        <DatePicker
          date={profileData.dob}
          onChange={(value) =>
            setProfileData({
              ...profileData,
              dob: value,
            })
          }
          enableAgeValidation
          minAge={22}
          placeholder={t("TL_NEW_OWNER_DETAILS_DOB_PLACEHOLDER")}
        />
      </div>

      <button
        className="registration__button"
        onClick={handleComplete}
        disabled={!profileData.fullName || !profileData.dob || !profileData.gender || emailError}
      >
        {t("CORE_COMPLETE_REGISTRATION")}
      </button>
    </React.Fragment>
  );
};

export default SelectName;
