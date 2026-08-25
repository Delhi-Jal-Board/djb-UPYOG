import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, Switch, Route, useLocation } from "react-router-dom";
import SelectMobileNumber from "./SelectMobileNumber";
import SelectOtp from "./SelectOtp";
import { StatusTable, Row, Toast, Loader, TickMark, SideBar } from "@djb25/digit-ui-react-components";
import SelectName from "./SelectName";
import RegistrationSuccess from "./RegistrationSuccess";
// import Background from "../../../components/Background";

const Register = ({ stateCode }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { path } = useRouteMatch();
  const [params, setParams] = Digit.Hooks.useSessionStorage("CITIZEN_REGISTRATION_DATA", {});
  const [isRegistered, setIsRegistered] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMobileNumberSelect = async (data) => {
    setParams({ ...params, ...data });
    setIsLoading(true);
    try {
      const response = await Digit.UserService.sendOtp(
        {
          otp: {
            mobileNumber: data.mobileNumber,
            type: "register",
            userType: "CITIZEN",
            tenantId: stateCode,
          },
        },
        stateCode
      );
      if (response?.error) {
        setIsLoading(false);
        const errorMessage = response?.data?.error?.fields?.[0]?.message || response?.data?.error?.message || response?.data?.Errors?.[0]?.message || t("CORE_COMMON_OTP_SEND_FAILED", "Failed to send OTP");
        setShowToast({ label: errorMessage, error: true });
        return;
      }
      setIsLoading(false);
      history.push(`${path}/otp`);
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err?.response?.data?.error?.fields?.[0]?.message || err?.response?.data?.error?.message || err?.response?.data?.Errors?.[0]?.message || t("CORE_COMMON_OTP_SEND_FAILED", "Failed to send OTP");
      setShowToast({ label: errorMessage, error: true });
      console.error("OTP send failed:", err);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await Digit.UserService.sendOtp(
        {
          otp: {
            mobileNumber: params.mobileNumber,
            type: "register",
            userType: "CITIZEN",
            tenantId: stateCode,
          },
        },
        stateCode
      );
      if (response?.error) {
        const errorMessage = response?.data?.error?.fields?.[0]?.message || response?.data?.error?.message || response?.data?.Errors?.[0]?.message || t("CORE_COMMON_OTP_RESEND_FAILED", "Failed to resend OTP");
        setShowToast({ label: errorMessage, error: true });
        return;
      }
      setShowToast({ label: t("CORE_COMMON_OTP_RESENT", "OTP Resent Successfully") });
    } catch (err) {
      const errorMessage = err?.response?.data?.error?.fields?.[0]?.message || err?.response?.data?.error?.message || err?.response?.data?.Errors?.[0]?.message || t("CORE_COMMON_OTP_RESEND_FAILED", "Failed to resend OTP");
      setShowToast({ label: errorMessage, error: true });
      console.error("OTP resend failed:", err);
    }
  };

  const handleOtpSelect = (data) => {
    setParams({ ...params, ...data });
    history.push(`${path}/name`);
  };

  const handleNameSelect = async (data) => {
    const finalData = {
      ...params,
      ...data,
      name: data.name,
      username: params.mobileNumber,
      otpReference: params.otp,
      dob: data.dob ? new Date(data.dob).getTime() : null,
      gender: data.gender?.code || data.gender,
      tenantId: stateCode,
      userType: "CITIZEN",
    };
    setIsLoading(true);
    try {
      const response = await Digit.UserService.registerUser(finalData, stateCode);
      setIsLoading(false);
      
      if (response instanceof Error || response?.error) {
        const err = response;
        const isLoginError = err?.response?.data?.Errors?.[0]?.code === "LOGIN_ERROR";
        if (isLoginError) {
          setShowToast({ label: t("CORE_COMMON_REGISTRATION_SUCCESSFUL", "Successfully Registered") });
          setIsRegistered(true);
          Digit.SessionStorage.del("CITIZEN_REGISTRATION_DATA");
        } else {
          const errorMessage = err?.response?.data?.error?.fields?.[0]?.message || err?.response?.data?.error?.message || err?.response?.data?.Errors?.[0]?.message || err?.message || t("CORE_COMMON_REGISTRATION_FAILED", "Registration Failed");
          setShowToast({ label: errorMessage, error: true });
          console.error("Registration failed:", err);
        }
        return;
      }

      setShowToast({ label: t("CORE_COMMON_REGISTRATION_SUCCESSFUL", "Successfully Registered") });
      setIsRegistered(true);
      Digit.SessionStorage.del("CITIZEN_REGISTRATION_DATA");
    } catch (err) {
      setIsLoading(false);

      const isLoginError = err?.response?.data?.Errors?.[0]?.code === "LOGIN_ERROR";
      if (isLoginError) {
        setShowToast({ label: t("CORE_COMMON_REGISTRATION_SUCCESSFUL", "Successfully Registered") });
        setIsRegistered(true);
        Digit.SessionStorage.del("CITIZEN_REGISTRATION_DATA");
      } else {
        const errorMessage = err?.response?.data?.error?.fields?.[0]?.message || err?.response?.data?.error?.message || err?.response?.data?.Errors?.[0]?.message || t("CORE_COMMON_REGISTRATION_FAILED", "Registration Failed");
        setShowToast({ label: errorMessage, error: true });
        console.error("Registration failed:", err);
      }
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isRegistered) {
    return (
      <RegistrationSuccess
        t={t}
        params={params}
        history={history}
        showToast={showToast}
        closeToast={closeToast}
        Toast={Toast}
        StatusTable={StatusTable}
        Row={Row}
        TickMark={TickMark}
      />
    );
  }

  return (
    <div className="Citizen_register registration-page-container">
      <div className="registration-card">
        <Switch>
          <Route path={path}>
            <RegistrationFlow
              t={t}
              handleMobileNumberSelect={handleMobileNumberSelect}
              handleOtpSelect={handleOtpSelect}
              handleNameSelect={handleNameSelect}
              handleResendOtp={handleResendOtp}
              params={params}
            />
          </Route>
        </Switch>
      </div>
      {showToast && <Toast label={showToast.label} error={showToast.error} onClose={closeToast} />}
    </div>
  );
};

export default Register;

function RegistrationFlow({ t, handleMobileNumberSelect, handleOtpSelect, handleNameSelect, params, handleResendOtp }) {
  const location = useLocation();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    dob: "",
    emailId: "",
  });
  const history = useHistory();
  const { path } = useRouteMatch();
  const [toast, setToast] = useState(null);

  const inputRefs = useRef([]);

  const steps = [
    { number: 1, title: "Enter Mobile Number" },
    { number: 2, title: "Verify OTP" },
    { number: 3, title: "Set Profile Details" },
  ];

  const getStep = () => {
    if (location.pathname.includes("mobile-number")) return 1;
    if (location.pathname.includes("otp")) return 2;
    if (location.pathname.includes("name")) return 3;
    return 1;
  };
  const currentStep = getStep();

  /* TIMER */
  useEffect(() => {
    if (currentStep === 2 && timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend, currentStep]);

  const handleSendOtp = () => {
    if (mobileNumber.length >= 10) {
      handleMobileNumberSelect({ mobileNumber });
      setTimer(45);
      setCanResend(false);
    }
  };

  const handleEditNumber = () => {
    history.push(`${path}/mobile-number`);
  };

  const handleVerifyOtp = () => {
    const otpString = otp.join(""); // Chanhe Otp array of 6 numbers to String
    if (otp.every((d) => d !== "" && d !== null && d !== undefined)) {
      handleOtpSelect({ otp: otpString });
    } else {
      setToast({
        type: "warning",
        message: "Please Enter All Digits",
      });
    }
  };

  const handleComplete = () => {
    if (profileData.fullName && profileData.dob) {
      handleNameSelect({ otp: params.otp, mobileNumber: params.mobileNumber, name: profileData.fullName, dob: profileData.dob, emailId: profileData.emailId });
    }
  };

  // const progress = currentStep === 1 ? 16 : currentStep === 2 ? 50 : 83;

  return (
    <div className="registration__wrapper">
      {/* LEFT SIDEBAR */}
      <SideBar steps={steps} currentStep={currentStep} t={t} title="REGISTRATION PROGRESS" />

      {/* RIGHT CONTENT */}
      <div className="registration__content">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <SelectMobileNumber
            t={t}
            handleMobileNumberSelect={handleSendOtp}
            setTimer={setTimer}
            setCanResend={setCanResend}
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
          />
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <SelectOtp
            t={t}
            mobileNumber={mobileNumber || params.mobileNumber}
            inputRefs={inputRefs}
            timer={timer}
            canResend={canResend}
            handleVerifyOtp={handleVerifyOtp}
            handleEditNumber={handleEditNumber}
            onResend={() => {
              setTimer(45);
              handleResendOtp();
            }}
            otp={otp}
            setOtp={setOtp}
          />
        )}

        {/* STEP 3 */}
        {currentStep === 3 && <SelectName profileData={profileData} setProfileData={setProfileData} handleComplete={handleComplete} />}

        {/* PROGRESS BAR */}
        {/* <div className="registration__progress">

        profileData={profileData}
        setProfileData={setProfileData}
        handleComplete={handleComplete}
          <div className="registration__progress-track">
            <div className="registration__progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div> */}
      </div>
      {toast && <Toast warning={toast.type === "warning"} error={toast.type === "error"} label={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
