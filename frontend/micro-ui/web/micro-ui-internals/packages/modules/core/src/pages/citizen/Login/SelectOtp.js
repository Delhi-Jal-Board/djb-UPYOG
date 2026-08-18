import React, { useState, useEffect } from "react";
import useInterval from "../../../hooks/useInterval";
import { useHistory, useRouteMatch } from "react-router-dom";

const SelectOtp = ({ mobileNumber, inputRefs, timer, canResend, handleVerifyOtp, otp, handleEditNumber, onResend, setOtp, t }) => {
  const [timeLeft, setTimeLeft] = useState(180);
  const TYPE_REGISTER = { type: "register" };
  const TYPE_LOGIN = { type: "login" };
  const getUserType = () => Digit.UserService.getType();
  const history = useHistory();
  const { path } = useRouteMatch();
  useInterval(
    () => {
      setTimeLeft(timeLeft - 1);
    },
    timeLeft > 0 ? 1000 : null
  );

  useEffect(() => {
    (async () => {
      if (window.location.href.includes("code")) {
        let code = window.location.href.split("=")[1].split("&")[0];
        let TokenReq = {
          code_verifier: sessionStorage.getItem("code_verfier_register"),
          code: code,
          module: "REGISTER",
          redirect_uri: "https://upyog.niua.org/digit-ui/citizen/login/otp",
        };
        const data = await Digit.DigiLockerService.token({ TokenReq });
        registerUser(data);
      } else if (window.location.href.includes("error=")) {
        window.location.href = window.location.href.split("/otp")[0];
      }
    })();
  }, []);

  const registerUser = async (response) => {
    const data = {
      dob: response?.TokenRes?.dob.substring(0, 2) + "/" + response?.TokenRes?.dob.substring(2, 4) + "/" + response?.TokenRes?.dob.substring(4, 8),
      mobileNumber: response?.TokenRes?.mobile,
      name: response?.TokenRes?.name,
      tenantId: "pg",
      userType: getUserType(),
    };
    sessionStorage.setItem("userName", response?.TokenRes?.mobile);
    const [res, err] = await sendOtp({ otp: { ...data, ...TYPE_REGISTER } });
    if (!err) {
      history.replace(`${path}/otp`, { from: getFromLocation(location.state, searchParams) });
      return;
    } else {
      await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });
      sessionStorage.setItem("userName", response?.TokenRes?.mobile);
    }
  };

  const sendOtp = async (data) => {
    try {
      const res = await Digit.UserService.sendOtp(data, "pg");
      return [res, null];
    } catch (err) {
      return [null, err];
    }
  };

  // if (userType === "employee") {
  //   return (
  //     <Fragment>
  //       <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
  //         <OTPInput length={6} onChange={onOtpChange} value={otp} />
  //       </div>
  //       {timeLeft > 0 ? (
  //         <CardText style={{ textAlign: "center", color: "#505A5F" }}>{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t(
  //           "CS_RESEND_SECONDS"
  //         )}`}</CardText>
  //       ) : (
  //         <p
  //           className="card-text-button"
  //           onClick={handleResendOtp}
  //           style={{ textAlign: "center", color: "#3A8DCC", cursor: "pointer", fontWeight: "bold" }}
  //         >
  //           {t("CS_RESEND_OTP")}
  //         </p>
  //       )}
  //       {error && <CardLabelError style={{ textAlign: "center" }}>{t("CS_INVALID_OTP")}</CardLabelError>}
  //     </Fragment>
  //   );
  // }

  const handleContainerClick = () => {
    const firstEmpty = otp.findIndex((d) => !d);
    const index = firstEmpty !== -1 ? firstEmpty : otp.length - 1;
    inputRefs.current[index]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").slice(0, otp.length);

    if (!/^\d+$/.test(pasted)) return;

    const newOtp = pasted.split("");
    setOtp(newOtp);

    inputRefs.current[newOtp.length - 1]?.focus();
  };

  /* OTP HANDLERS */
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault(); // ✅ always prevent

      const newOtp = [...otp];

      // Case 1: current has value → clear it
      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
        return;
      }

      // Case 2: empty → move back AND clear previous
      if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <React.Fragment>
      <div className="registration__header">
        <h1 className="registration__title">Step 2: Verify OTP</h1>
        <span className="registration__step-count">2 of 3</span>
      </div>

      <p className="registration__description">Enter the OTP sent to +91 {mobileNumber}</p>

      <div className="registration__change-phone">
        <button className="registration__change-phone-btn" onClick={handleEditNumber}>
          Change phone number
        </button>
      </div>
      <div className="registration__otp-group" onClick={handleContainerClick} onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            className="registration__otp-input"
            maxLength={1}
            value={digit}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onChange={(e) => handleOtpChange(index, e.target.value)}
          />
        ))}
      </div>

      <div className="registration__otp-footer">
        <span>Resend in {timer}s</span>
        <span onClick={onResend} className={`registration__resend ${canResend ? "registration__resend--active" : "registration__resend--disabled"}`}>
          {t("CORE_OTP_RESEND")}
        </span>
      </div>

      <button className="registration__button" onClick={handleVerifyOtp} disabled={otp.some((d) => !d)}>
        Verify
      </button>
    </React.Fragment>
  );
};

export default SelectOtp;
