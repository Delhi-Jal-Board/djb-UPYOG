import { ActionBar, Button, Dropdown, ArrowDown } from "@djb25/digit-ui-react-components";
import React, { useState } from "react";
import { CustomButton, Menu } from "@djb25/digit-ui-react-components";

const FlagIcon = () => (
  <svg width="22" height="14" viewBox="0 0 90 60" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: "2px", border: "0.5px solid #e2e8f0" }}>
    <rect width="90" height="20" fill="#f4a523" />
    <rect y="20" width="90" height="20" fill="#fff" />
    <rect y="40" width="90" height="20" fill="#128807" />
    <g transform="translate(45 30)">
      <circle r="9" fill="none" stroke="#000080" strokeWidth="0.5" />
      <circle r="1.5" fill="#000080" />
      <path d="M0-9V9M-9 0h18M-6.36-6.36l12.72 12.72M-6.36 6.36L6.36-6.36" stroke="#000080" strokeWidth="0.5" />
    </g>
  </svg>
);

const ChangeLanguage = (prop) => {
  const isDropdown = prop.dropdown || false;
  const { data: storeData, isLoading } = Digit.Hooks.useStore.getInitData();
  const { languages, stateInfo } = storeData || {};
  const selectedLanguage = Digit.StoreData.getCurrentLanguage();
  const [selected, setselected] = useState(selectedLanguage);
  const handleChangeLanguage = (language) => {
    setselected(language.value);
    Digit.LocalizationService.changeLanguage(language.value, stateInfo.code);
  };

  if (isLoading || !languages) return null;

  if (isDropdown) {
    const languageCode = selected.toUpperCase().split("_")[0];

    return (
      <div className="language-selector-container">
        <Dropdown
          option={languages}
          selected={languages?.find((language) => language.value === selectedLanguage)}
          optionKey={"label"}
          select={handleChangeLanguage}
          freeze={true}
          showArrow={false}
          customSelector={
            <div className="topbar-item-wrapper">
              <div className="flag-container">
                <FlagIcon />
              </div>
              <span className="language-code">{languageCode}</span>
              <ArrowDown className="chevron-icon" />
            </div>
          }
        />
      </div>
    );
  } else {
    return (
      <React.Fragment>
        <div style={{ marginBottom: "5px" }}>Language</div>
        <div className="language-selector">
          {languages.map((language, index) => (
            <div className="language-button-container" key={index}>
              <CustomButton
                selected={language.value === selected}
                text={language.label}
                onClick={() => handleChangeLanguage(language)}
              ></CustomButton>
            </div>
          ))}
        </div>
      </React.Fragment>
    );
  }
};

export default ChangeLanguage;
