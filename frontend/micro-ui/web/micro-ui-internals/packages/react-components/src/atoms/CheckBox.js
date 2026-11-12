import React from "react";
import PropTypes from "prop-types";

// SVG Check Icon
const CheckSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckBox = ({
  onChange,
  label,
  value,
  disable,
  checked,
  inputRef,
  pageType,
  index,
  isLabelFirst,
  errorStyle, // 👈 explicitly remove it
  ...props
}) => {
  const userType = pageType || (typeof Digit !== "undefined" ? Digit.SessionStorage.get("userType") : "citizen");

  const isEmployee = userType === "employee";

  const wrapperClass = `checkbox-wrap ${isEmployee ? "checkbox-wrap-emp" : ""}`;

  const inputClass = isEmployee ? "input-emp" : "";

  const customClass = isEmployee ? "custom-checkbox-emp" : "custom-checkbox";

  return (
    <div className={wrapperClass}>
      {isLabelFirst && (
        <React.Fragment>
          {typeof index === "number" && <span className="checkbox-index">{index + 1}.</span>}
          <span className="label label-left">{label}</span>
        </React.Fragment>
      )}
      <div className={customClass}>
      <input
        type="checkbox"
        className={`${inputClass} ${errorStyle && "employee-card-input-error"}`}
        onChange={onChange}
        value={value || label}
        ref={inputRef}
        disabled={disable}
        checked={checked}
        {...props}
      />
        <CheckSvg />
      </div>

      {!isLabelFirst && <span className="label">{label}</span>}
    </div>
  );
};

CheckBox.propTypes = {
  label: PropTypes.node.isRequired,
  onChange: PropTypes.func,
  checked: PropTypes.bool,
  value: PropTypes.any,
  disable: PropTypes.bool,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  pageType: PropTypes.string,
  index: PropTypes.number,
  isLabelFirst: PropTypes.bool,
};

CheckBox.defaultProps = {
  checked: false,
  disable: false,
  isLabelFirst: false,
};

export default CheckBox;
