import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { TextInput, SubmitBar, LinkLabel, CloseSvg, DatePicker, Menu, AddIcon, Dropdown } from "@djb25/digit-ui-react-components";
import DropdownStatus from "./inbox/DropdownStatus";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

const RegisteredVendorSearch = ({
  onSearch,
  type,
  onClose,
  onTabChange,
  isFstpOperator,
  searchFields,
  searchParams,
  isInboxPage,
  selectedTab,
  matchedRoles,
}) => {
  const storedSearchParams = isInboxPage
    ? Digit.SessionStorage.get("vendor/inbox/searchParams")
    : Digit.SessionStorage.get("vendor/search/searchParams");

  const { t } = useTranslation();
  const history = useHistory();
  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues: storedSearchParams || searchParams,
  });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const mobileView = window.Digit.Utils.browser.isMobile();
  const FSTP = Digit.UserService.hasAccess("FSM_EMP_FSTPO") || false;

  const onSubmitInput = (data) => {
    if (!data.mobileNumber) {
      delete data.mobileNumber;
    }
    onSearch(data);
    if (type === "mobile") {
      onClose();
    }
  };

  function clearSearch() {
    const resetValues = searchFields.reduce((acc, field) => ({ ...acc, [field?.name]: "" }), {});
    reset(resetValues);
    if (isInboxPage) {
      Digit.SessionStorage.del("fsm/inbox/searchParams");
    } else {
      Digit.SessionStorage.del("fsm/search/searchParams");
    }
    onSearch({});
  }

  const clearAll = (mobileView) => {
    const mobileViewStyles = mobileView ? { margin: 0, display: "inline" } : {};
    return (
      <LinkLabel style={{ ...mobileViewStyles }} onClick={clearSearch}>
        {t("ES_COMMON_CLEAR_SEARCH")}
      </LinkLabel>
    );
  };

  const onAddClick = () => {
    setShowAddMenu(!showAddMenu);
  };

  const searchValidation = (data) => {
    return null;
  };

  function onActionSelect(action) {
    const userPath = userType?.toLowerCase();
    switch (action) {
      case "VENDOR":
        return history.push(`/digit-ui/${userPath}/vendor/registry/new-vendor`);
      case "VEHICLE":
        return history.push(`/digit-ui/${userPath}/vendor/registry/new-vehicle`);
      case "DRIVER":
        return history.push(`/digit-ui/${userPath}/vendor/registry/new-driver`);
      case "SUPERVISOR":
        return history.push(`/digit-ui/${userPath}/vendor/registry/new-supervisor`);
      case "SURVEYOR":
        return history.push(`/digit-ui/${userPath}/vendor/registry/new-surveyor`);
      default:
        break;
    }
  }

  const getFields = (input) => {
    switch (input.type) {
      case "date":
        return (
          <Controller
            render={(props) => <DatePicker date={props.value} onChange={props.onChange} />}
            name={input.name}
            control={control}
            defaultValue={null}
          />
        );
      case "status":
        return (
          <Controller
            render={(props) => (
              <DropdownStatus
                onAssignmentChange={props.onChange}
                value={props.value}
                // applicationStatuses={applicationStatuses}
                // areApplicationStatus={areApplicationStatus}
              />
            )}
            name={input.name}
            control={control}
            defaultValue={null}
          />
        );
      case "dropdown":
        return (
          <Controller
            render={(props) => (
              <Dropdown
                option={input.options}
                optionKey={input.optionsKey}
                value={props.value}
                selected={props.value}
                select={props.onChange}
                t={t}
                placeholder={input.label}
              />
            )}
            name={input.name}
            control={control}
            defaultValue={null}
          />
        );
      default:
        return (
          <TextInput
            {...input}
            inputRef={register}
            {...register(input.name, {
              validate: searchValidation,
            })}
            watch={watch}
            shouldUpdate={true}
            placeholder={input.label}
          />
        );
    }
  };
  const userInfo = Digit.SessionStorage.get("User");
  const userType = userInfo.info.type;
  const vendorItems = [
    ...(matchedRoles?.wt?.includes("WT_VENDOR") ? ["VENDOR"] : []),
    ...(matchedRoles?.wt?.includes("WT_VENDOR") ? ["DRIVER", "VEHICLE"] : []),
    ...(matchedRoles?.ekyc?.includes("EKYC_VENDOR") ? ["SUPERVISOR"] : []),
    // ...(matchedRoles?.ekyc?.includes("EKYC_SUPERVISOR") || matchedRoles?.ekyc?.includes("EKYC_VENDOR") ? ["SURVEYOR"] : []),
    ...(matchedRoles?.ekyc?.includes("EKYC_SUPERVISOR") ? ["SURVEYOR"] : []),
  ];
  return (
    <React.Fragment>
      <div className="search-container">
        <div className="search-complaint-container">
          {(type === "mobile" || mobileView) && (
            <div className="complaint-header">
              <h2>{t("ES_COMMON_SEARCH_BY")}</h2>
              <span
                style={{
                  position: "absolute",
                  top: "2%",
                  right: "8px",
                }}
                onClick={onClose}
              >
                <CloseSvg />
              </span>
            </div>
          )}
          <div className="search-tabs-container">
            <div>
              <button
                className={selectedTab === "VENDOR" ? "search-tab-head-selected" : "search-tab-head"}
                onClick={() => {
                  clearSearch({});
                  onTabChange("VENDOR");
                }}
              >
                {t("ES_FSM_REGISTRY_INBOX_TAB_VENDOR")}
              </button>

              {matchedRoles?.wt?.includes("WT_VENDOR") && (
                <button
                  className={selectedTab === "VEHICLE" ? "search-tab-head-selected" : "search-tab-head"}
                  onClick={() => {
                    clearSearch({});
                    onTabChange("VEHICLE");
                  }}
                >
                  {t("ES_FSM_REGISTRY_INBOX_TAB_VEHICLE")}
                </button>
              )}
              {matchedRoles?.wt?.includes("WT_VENDOR") && (
                <button
                  className={selectedTab === "DRIVER" ? "search-tab-head-selected" : "search-tab-head"}
                  onClick={() => {
                    clearSearch({});
                    onTabChange("DRIVER");
                  }}
                >
                  {t("ES_FSM_REGISTRY_INBOX_TAB_DRIVER")}
                </button>
              )}
              {(matchedRoles?.ekyc?.includes("EKYC_VENDOR") || matchedRoles?.ekyc?.includes("EKYC_SUPERVISOR")) && (
                <button
                  className={selectedTab === "SUPERVISOR" ? "search-tab-head-selected" : "search-tab-head"}
                  onClick={() => {
                    clearSearch({});
                    onTabChange("SUPERVISOR");
                  }}
                >
                  {t("ES_FSM_REGISTRY_INBOX_TAB_SUPERVISOR")}
                </button>
              )}
              {/* {(matchedRoles?.ekyc?.includes("EKYC_SUPERVISOR") || matchedRoles?.ekyc?.includes("EKYC_VENDOR")) && ( */}
              {(matchedRoles?.ekyc?.includes("EKYC_SUPERVISOR") || matchedRoles?.ekyc?.includes("EKYC_VENDOR")) && (
                <button
                  className={selectedTab === "SURVEYOR" ? "search-tab-head-selected" : "search-tab-head"}
                  onClick={() => {
                    clearSearch({});
                    onTabChange("SURVEYOR");
                  }}
                >
                  {t("ES_FSM_REGISTRY_INBOX_TAB_SURVEYOR")}
                </button>
              )}
            </div>
            <div className="action-bar-wrap-registry">
              <div className="search-add" onClick={onAddClick}>
                {t("ES_VENDOR_REGISTRY_INBOX_HEADER_ADD")}
                <div className="search-add-icon">
                  <AddIcon className="" />
                </div>
              </div>
              {showAddMenu && <Menu localeKeyPrefix={"ES_FSM_ACTION_CREATE"} options={vendorItems} t={t} onSelect={onActionSelect} />}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmitInput)}>
            <div className={FSTP ? "for-pt for-search flex-box" : "flex-box"} style={{ gap: "16px" }}>
              {searchFields?.map((input, index) => (
                <span key={index} className={index === 0 ? "finance-mainlayout-col1 complaint-input" : "finance-mainlayout-col1 mobile-input"}>
                  {getFields(input)}
                </span>
              ))}
              <div style={{ display: "flex", justifyContent: "end", gap: "16px", alignItems: "center" }}>
                {type === "desktop" && !mobileView && <span className="clear-search generic-button">{clearAll()}</span>}
                {type === "desktop" && !mobileView && <SubmitBar className="submit-bar-search" label={t("ES_COMMON_SEARCH")} submit />}
              </div>
            </div>
            {/* {error ? <CardLabelError className="search-error-label">{t("ES_SEARCH_APPLICATION_ERROR")}</CardLabelError> : null} */}
          </form>
        </div>
      </div>
    </React.Fragment>
  );
};

export default RegisteredVendorSearch;
