import { DatePicker } from "@djb25/digit-ui-react-components";
import React, { useState } from "react";

const SelectName = ({ profileData, setProfileData, handleComplete }) => {
  const [emailError, setEmailError] = useState(false);

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
        <h1 className="registration__title">Step 3: Profile Details</h1>
        <span className="registration__step-count">3 of 3</span>
      </div>

      <p className="registration__description">Complete your profile</p>

      <div className="registration__field">
        <label className="registration__label">Full Name</label>
        <input
          className="registration__input"
          value={profileData.fullName}
          onChange={(e) =>
            setProfileData({
              ...profileData,
              fullName: e.target.value,
            })
          }
          placeholder="Enter Your Name"
        />
      </div>

      <div className="registration__field">
        <label className="registration__label">Email Id (Optional)</label>
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
          placeholder="Enter Your Email Id"
        />
        {emailError && <span className="registration__error-msg" style={{ color: "red", fontSize: "12px", marginTop: "4px", display: "block" }}>Please enter a valid email address</span>}
      </div>

      <div className="registration__field">
        <label className="registration__label">Date of birth</label>
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
        />
      </div>

      <button className="registration__button" onClick={handleComplete} disabled={!profileData.fullName || !profileData.dob || emailError}>
        Complete Registration
      </button>
    </React.Fragment>
  );
};

export default SelectName;
