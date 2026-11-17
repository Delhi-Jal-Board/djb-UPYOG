import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { RoundedCheck, DeleteBtn, ErrorIcon } from "./svgindex";
import ButtonSelector from "./ButtonSelector";

const Toast = (props) => {
  const {
    duration = 3000, // ✅ default 3 sec
    onClose,
    error,
    warning,
    isDleteBtn = true,
  } = props;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ✅ Auto dismiss logic
  useEffect(() => {
    if (!onClose) return;

    const timer = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, !onClose]);

  const showCloseBtn = (isDleteBtn !== false && props.isDleteBtn !== false) && typeof onClose === "function";

  // ❌ ERROR TOAST
  if (error) {
    return (
      <div className="toast-error" style={{ ...props.style }}>
        <ErrorIcon />
        <h2 style={{ ...props.labelstyle }}>{props.label}</h2>
        {showCloseBtn && (
          <span style={{ cursor: "pointer", marginLeft: "auto", display: "inline-flex", alignItems: "center" }} onClick={onClose}>
            <DeleteBtn fill="none" className="toast-close-btn" />
          </span>
        )}
      </div>
    );
  }

  // ⚠️ WARNING TOAST
  if (warning) {
    return (
      <div
        className="toast-success"
        style={{
          backgroundColor: "#EA8A3B",
          ...(props?.isWarningButtons && { display: "block" }),
          ...props.style,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <ErrorIcon />
          <h2 style={{ marginLeft: "10px" }}>{props.label}</h2>
          {showCloseBtn && (
            <span style={{ cursor: "pointer", marginLeft: "auto", display: "inline-flex", alignItems: "center" }} onClick={onClose}>
              <DeleteBtn fill="none" className="toast-close-btn" />
            </span>
          )}
        </div>

        {props?.isWarningButtons && (
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
            <ButtonSelector theme="border" label="NO" onSubmit={props.onNo} style={{ marginLeft: "10px" }} />
            <ButtonSelector label="YES" onSubmit={props.onYes} style={{ marginLeft: "10px" }} />
          </div>
        )}
      </div>
    );
  }

  // ✅ SUCCESS TOAST
  return (
    <div className="toast-success" style={{ ...props.style }}>
      <RoundedCheck />
      <h2>{props.label}</h2>
      {showCloseBtn && (
        <span style={{ cursor: "pointer", marginLeft: "auto", display: "inline-flex", alignItems: "center" }} onClick={onClose}>
          <DeleteBtn fill="none" className="toast-close-btn" />
        </span>
      )}
    </div>
  );
};

Toast.propTypes = {
  label: PropTypes.string,
  onClose: PropTypes.func,
  isDleteBtn: PropTypes.bool,
  duration: PropTypes.number, // ✅ NEW PROP
};

Toast.defaultProps = {
  label: "",
  onClose: undefined,
  isDleteBtn: true,
  duration: 3000, // ✅ default 3 sec
};

export default Toast;
