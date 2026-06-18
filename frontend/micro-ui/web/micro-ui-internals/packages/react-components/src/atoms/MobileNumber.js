import React from "react";
import PropTypes from "prop-types";

const MobileNumber = (props) => {
  const onChange = (e) => {
    let val = e.target.value;
    if (isNaN(val) || [" ", "e", "E"].some((e) => val.includes(e)) || val.length > (props.maxLength || 10)) {
      val = val.slice(0, -1);
    }
    props?.onChange?.(val);
  };

  return (
    <React.Fragment>
      <div className="phone-input-wrapper">
        {!props.hideSpan ? (
          <span
            style={{ ...props.labelStyle }}
            className={`employee-card-input employee-card-input--front phone-country-code ${props.disable && "disabled"} focus-visible ${
              props.errorStyle && "employee-card-input-error"
            }`}
          >
            +91
          </span>
        ) : null}
        <div className={`text-input field desktop-w-full ${props.className}`}>
          <input
            type={"text"}
            name={props.name}
            id={props.id || "Mobile"}
            className={`employee-card-input ${props.disable && "disabled"} focus-visible ${props.errorStyle && "employee-card-input-error"}`}
            placeholder={props.placeholder}
            onChange={onChange}
            ref={props.inputRef}
            value={props.value}
            style={{ ...props.style, borderRadius: "0 6px 6px 0" }}
            // defaultValue={props.defaultValue || ""}
            minLength={props.minlength}
            maxLength={props.maxlength}
            max={props.max}
            pattern={props.pattern}
            min={props.min}
            readOnly={props.disable}
            title={props.title}
            step={props.step}
            autoFocus={props.autoFocus}
            onBlur={props.onBlur}
            autoComplete="off"
          />
        </div>
      </div>
    </React.Fragment>
  );
};

MobileNumber.propTypes = {
  userType: PropTypes.string,
  isMandatory: PropTypes.bool,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  ref: PropTypes.func,
  value: PropTypes.any,
};

MobileNumber.defaultProps = {
  isMandatory: false,
};

export default MobileNumber;
