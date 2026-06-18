import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ArrowDown } from "./svgindex";

const TextField = (props) => {
  const {
    selectedVal,
    keepNull,
    setFilter,
    forceSet,
    freeze,
    dropdownDisplay,
    disable,
    closeOnBlur,
    setOptionIndex,
    addProps,
    dropdownRef,
    inputRef,
    onClick,
    onBlur,
    filterVal,
    setforceSet,
    autoFocus,
    placeholder,
    style,
  } = props;
  const [value, setValue] = useState(selectedVal ? selectedVal : "");

  useEffect(() => {
    if (!keepNull) {
      if (selectedVal) setValue(selectedVal);
      else {
        setValue("");
        setFilter("");
      }
    } else {
      setValue("");
    }
  }, [selectedVal, forceSet, keepNull, setFilter]);

  function inputChange(e) {
    if (freeze) return;

    setValue(e.target.value);
    setFilter(e.target.value);
  }

  function broadcastToOpen() {
    if (!disable) {
      dropdownDisplay(true);
    }
  }

  function broadcastToClose() {
    if (closeOnBlur) {
      dropdownDisplay(false);
    }
  }

  /* Custom function to scroll and select in the dropdowns while using key up and down */
  const keyChange = (e) => {
    if (e.key === "ArrowDown") {
      setOptionIndex((state) => (state + 1 === addProps.length ? 0 : state + 1));
      if (addProps.currentIndex + 1 === addProps.length) {
        dropdownRef?.current?.scrollTo?.(0, 0);
      } else {
        addProps.currentIndex > 2 && dropdownRef?.current?.scrollBy?.(0, 45);
      }
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setOptionIndex((state) => (state !== 0 ? state - 1 : addProps.length - 1));
      if (addProps.currentIndex === 0) {
        dropdownRef?.current?.scrollTo?.(100000, 100000);
      } else {
        addProps.currentIndex > 2 && dropdownRef?.current?.scrollBy?.(0, -45);
      }
      e.preventDefault();
    } else if (e.key === "Enter") {
      addProps.selectOption(addProps.currentIndex);
    }
  };

  return (
    <input
      ref={inputRef}
      className={`${disable && "disabled"}`}
      type="text"
      value={value}
      onChange={inputChange}
      onClick={onClick}
      onFocus={broadcastToOpen}
      onBlur={(e) => {
        onBlur?.(e);
        if (selectedVal !== filterVal) {
          setTimeout(() => {
            setforceSet((val) => val + 1);
          }, 1000);
        }
        broadcastToClose();
      }}
      onKeyDown={keyChange}
      readOnly={disable}
      autoFocus={autoFocus}
      placeholder={placeholder}
      autoComplete={"off"}
      style={{ ...style, zIndex: "auto" }}
    />
  );
};

const translateDummy = (text) => {
  return text;
};

const Dropdown = (props) => {
  const [dropdownStatus, setDropdownStatus] = useState(false);
  const [selectedOption, setSelectedOption] = useState(props.selected ? props.selected : null);
  const [filterVal, setFilterVal] = useState("");
  const [forceSet, setforceSet] = useState(0);
  const [optionIndex, setOptionIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const hasCustomSelector = !!props.customSelector;
  const t = props.t || translateDummy;

  useEffect(() => {
    setSelectedOption(props.selected);
  }, [props.selected]);

  useEffect(() => {
    if (!props.isBPAREG || !selectedOption) return;
    const isSelectedSameAsOptions = props.option?.some((ob) => ob?.code === selectedOption?.code);
    if (!isSelectedSameAsOptions) {
      setSelectedOption(null);
    }
  }, [props.isBPAREG, props.option, selectedOption]);

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;

    window.requestAnimationFrame(() => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const width = triggerRect.width;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const openUp = spaceBelow < dropdownRect.height && spaceAbove > spaceBelow;
      const top = openUp ? triggerRect.top + window.scrollY - dropdownRect.height : triggerRect.bottom + window.scrollY;

      setOpenUpward(openUp);
      setDropdownStyles({
        position: "absolute",
        top: `${top}px`,
        left: `${triggerRect.left + window.scrollX}px`,
        width: `${width}px`,
        minWidth: `${width}px`,
        zIndex: 10000000,
      });
    });
  }, []);

  useEffect(() => {
    if (!dropdownStatus) return;

    updateDropdownPosition();
    const handleScrollOrResize = () => updateDropdownPosition();

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("orientationchange", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("orientationchange", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [dropdownStatus, updateDropdownPosition]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownStatus) return;
      if (triggerRef.current?.contains(event.target)) return;
      if (dropdownRef.current?.contains(event.target)) return;
      setDropdownStatus(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dropdownStatus]);

  useEffect(() => {
    if (dropdownStatus) {
      setOptionIndex(0);
    } else {
      setFilterVal("");
    }
  }, [dropdownStatus]);

  const openDropdown = () => {
    if (props.disable) return;
    setDropdownStatus(true);
  };

  const dropdownSwitch = () => {
    if (props.disable) return;
    setDropdownStatus((prev) => !prev);
    props?.onBlur?.();
  };

  const onSelect = useCallback(
    (val) => {
      if (val !== selectedOption || props.allowMultiselect) {
        props.select(val);
        setSelectedOption(val);
        setDropdownStatus(false);
      } else {
        setSelectedOption(val);
        setforceSet((prev) => prev + 1);
      }
    },
    [selectedOption, props.allowMultiselect, props.select]
  );

  const onSearchRef = useRef(props.onSearch);
  onSearchRef.current = props.onSearch;

  const setFilter = useCallback((val) => {
    setFilterVal(val);
    if (onSearchRef.current) {
      onSearchRef.current(val);
    }
  }, []);

  const filteredOption = useMemo(
    () => (props.option && props.option.filter((option) => t(option[props.optionKey])?.toUpperCase()?.indexOf(filterVal?.toUpperCase()) > -1)) || [],
    [props.option, props.optionKey, filterVal, t]
  );

  const selectOption = useCallback(
    (ind) => {
      onSelect(filteredOption[ind]);
    },
    [filteredOption, onSelect]
  );

  const dropdownContent = (
    <div
      className={`options-card ${openUpward ? "open-up" : ""}`}
      style={{
        ...props.optionCardStyles,
        ...dropdownStyles,
        overflowY: "auto",
        maxHeight: "200px",
        border: "1px solid #ccc",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
      ref={dropdownRef}
    >
      {/* Search is handled by the main TextField trigger */}
      {filteredOption && filteredOption.length > 0 ? (
        filteredOption.map((option, index) => (
          <div
            className={`cp profile-dropdown--item`}
            style={
              index === optionIndex
                ? {
                    opacity: 1,
                    backgroundColor: "rgba(238, 238, 238, var(--bg-opacity))",
                  }
                : {}
            }
            key={index}
            onClick={() => onSelect(option)}
          >
            {option.icon && <span className="icon"> {option.icon} </span>}
            {props.isPropertyAssess ? (
              <div>{props.t ? props.t(option[props.optionKey]) : option[props.optionKey]}</div>
            ) : (
              <span>{props.t ? props.t(option[props.optionKey]) : option[props.optionKey]}</span>
            )}
          </div>
        ))
      ) : (
        <div className={`cp profile-dropdown--item`} key="-1">
          <span>{props.t ? props.t("CMN_NOOPTION") : "CMN_NOOPTION"}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className={`employee-select-wrap ${props?.className ? props?.className : ""}`} style={{ ...props.style }} ref={triggerRef}>
      {hasCustomSelector && (
        <div className={props.showArrow ? "cp flex-right column-gap-5" : "cp"} onClick={dropdownSwitch}>
          {props.customSelector}
          {props.showArrow && <ArrowDown onClick={dropdownSwitch} className={props.disable && "disabled"} />}
        </div>
      )}
      {!hasCustomSelector && (
        <div
          className={`${dropdownStatus ? "select-active" : "select"} ${props.disable ? "disabled" : ""}`}
          style={props.errorStyle ? { border: "1px solid red" } : {}}
        >
          <TextField
            autoComplete={props.autoComplete}
            setFilter={setFilter}
            forceSet={forceSet}
            setforceSet={setforceSet}
            setOptionIndex={setOptionIndex}
            keepNull={props.keepNull}
            selectedVal={
              selectedOption
                ? props.t
                  ? props.isMultiSelectEmp
                    ? `${selectedOption} ${t("BPA_SELECTED_TEXT")}`
                    : t(props.optionKey ? selectedOption[props.optionKey] : selectedOption)
                  : props.optionKey
                  ? selectedOption[props.optionKey]
                  : selectedOption
                : null
            }
            filterVal={filterVal}
            addProps={{ length: filteredOption.length, currentIndex: optionIndex, selectOption }}
            dropdownDisplay={setDropdownStatus}
            dropdownRef={dropdownRef}
            disable={props.disable}
            freeze={props.freeze ? true : false}
            autoFocus={props.autoFocus}
            placeholder={props.placeholder}
            onBlur={props?.onBlur}
            inputRef={triggerRef}
            closeOnBlur={false}
            onClick={openDropdown}
          />
          <ArrowDown onClick={dropdownSwitch} className="cp" disable={props.disable} color={dropdownStatus ? "#a1a1aa" : "#e5e5e7"} />
        </div>
      )}
      {dropdownStatus && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

Dropdown.propTypes = {
  customSelector: PropTypes.any,
  showArrow: PropTypes.bool,
  selected: PropTypes.any,
  style: PropTypes.object,
  option: PropTypes.array,
  optionKey: PropTypes.any,
  select: PropTypes.any,
  t: PropTypes.func,
  isSearchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
};

Dropdown.defaultProps = {
  customSelector: null,
  showArrow: true,
  isSearchable: true,
};

export default Dropdown;
