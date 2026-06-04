import React from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon, TextInput, SubmitBar } from "@djb25/digit-ui-react-components";

const SearchBar = () => {
  const { t } = useTranslation();
  return (
    <div className="upyog-search-wrapper">
      <div className="upyog-search-box">
        <span className="upyog-search-icon">
          <SearchIcon />
        </span>

        <TextInput
          placeholder={t("Search for Services (eg. Water bill, connection...)")}
          style={{ border: "none", width: "100%", outline: "none", boxShadow: "none" }}
        />
        <SubmitBar label={t("Search")} className="upyog-search-btn" style={{ height: "100%", margin: 0 }} />
      </div>
    </div>
  );
};

export default SearchBar;
