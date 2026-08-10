import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { LuCalendarIcon } from "./svgindex";
import Toast from "./Toast";

const DatePicker = ({ date, onChange, disabled, style, isDOB, minAge = 18, min }) => {
  const [toast, setToast] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const hiddenDateRef = useRef();

  useEffect(() => {
    setInputValue(date ? formatDisplay(date) : "");
  }, [date]);

  // yyyy-mm-dd → dd/mm/yyyy
  const formatDisplay = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // dd/mm/yyyy → yyyy-mm-dd
  const toInputFormat = (date) => {
    if (!date) return "";
    if (date.includes("-")) return date;

    const [day, month, year] = date.split("/");
    return `${year}-${month}-${day}`;
  };

  // 18+ validation
  const isValidAge = (dateStr) => {
    const today = new Date();
    const dob = new Date(dateStr);

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age >= minAge;
  };

  // Auto format while typing
  const handleTextChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // numbers only

    value = value.slice(0, 8); // ddmmyyyy max

    let formatted = "";

    if (value.length <= 2) {
      formatted = value;
    } else if (value.length <= 4) {
      formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
    } else {
      formatted = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    }

    setInputValue(formatted);
  };

  const handleBlur = () => {
    if (!inputValue) {
      onChange?.("");
      return;
    }

    const regex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (regex.test(inputValue)) {
      const [d, m, y] = inputValue.split("/");

      const day = Number(d);
      const month = Number(m);
      const year = Number(y);

      // basic validation
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
        setInputValue(date ? formatDisplay(date) : "");
        return;
      }

      const isoDate = `${y}-${m}-${d}`;
      const dateObj = new Date(isoDate);

      if (!isNaN(dateObj.getTime())) {
        if (isDOB && !isValidAge(isoDate)) {
          setToast({
            type: "warning",
            message: `User must be at least ${minAge} years old`,
          });

          setInputValue(date ? formatDisplay(date) : "");
          return;
        }

        // Enforce min date if provided
        if (min && isoDate < min) {
          setInputValue(date ? formatDisplay(date) : "");
          return;
        }

        onChange?.(isoDate);
      } else {
        setInputValue(date ? formatDisplay(date) : "");
      }
    } else {
      setInputValue(date ? formatDisplay(date) : "");
    }
  };

  const handleDateChange = (e) => {
    const raw = e.target.value;

    if (!raw) {
      onChange?.("");
      return;
    }

    if (isDOB && !isValidAge(raw)) {
      setToast({
        type: "warning",
        message: `User must be at least ${minAge} years old`,
      });
      return;
    }

    onChange?.(raw);
  };

  return (
    <React.Fragment>
      <div
        className="date-picker"
        style={{
          position: "relative",
          width: "100%",
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
      >
        {/* Visible Input */}
        <input
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="DD/MM/YYYY"
          maxLength="10"
          className={`registration__input employee-card-input ${disabled ? "disabled" : ""}`}
        />

        {/* Hidden Date Picker */}
        <input
          type="date"
          ref={hiddenDateRef}
          value={toInputFormat(date)}
          min={min || ""}
          onChange={handleDateChange}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Calendar Icon */}
        <LuCalendarIcon
          color="#d1d1d1"
          onClick={() => hiddenDateRef.current?.showPicker?.()}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
          }}
        />
      </div>

      {toast && <Toast warning={toast.type === "warning"} error={toast.type === "error"} label={toast.message} onClose={() => setToast(null)} />}
    </React.Fragment>
  );
};

DatePicker.propTypes = {
  date: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  isDOB: PropTypes.bool,
  minAge: PropTypes.number,
  min: PropTypes.string,
};

export default DatePicker;
