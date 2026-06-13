import React, { Fragment, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { TextInput, Label, SubmitBar, LinkLabel, ActionBar, CloseSvg, DatePicker, MobileNumber, Dropdown } from "@djb25/digit-ui-react-components";
import CollapsibleCardPage from "../CollapseCard";

import { useTranslation } from "react-i18next";

const fieldComponents = {
  mobileNumber: MobileNumber,
};

const FIXED_POINT_ADVANCED_FIELDS = ["vendorName", "vehicleName", "driverName", "fillingPointId"];

const normalizeValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

const getVendorLabel = (vendor) => vendor?.name || vendor?.vendor_id || "";
const getVehicleLabel = (vehicle) => vehicle?.registrationNumber || vehicle?.name || vehicle?.type || "";
const getDriverLabel = (driver) => driver?.name || driver?.owner?.name || driver?.licenseNumber || "";
const getFillingPointLabel = (fillingPoint) => fillingPoint?.fillingPointName || fillingPoint?.name || "";
const getFillingPointValue = (fillingPoint) =>
  typeof fillingPoint === "object" ? fillingPoint?.id || fillingPoint?.fillingPointId || fillingPoint?.bookingId || "" : normalizeValue(fillingPoint);

const findSelectedOption = (options = [], value, getLabel, extraKeys = []) => {
  if (!value) return null;

  const selectedValues =
    typeof value === "object"
      ? [getLabel(value), ...extraKeys.map((key) => value?.[key])]
      : [value];

  const normalizedSelectedValues = selectedValues.map(normalizeValue).filter(Boolean);

  return (
    options.find((option) => {
      const optionValues = [getLabel(option), ...extraKeys.map((key) => option?.[key])].map(normalizeValue).filter(Boolean);
      return optionValues.some((optionValue) => normalizedSelectedValues.includes(optionValue));
    }) || (typeof value === "object" ? value : null)
  );
};

/*
    A dynamic search form for applications, allowing users to filter by various fields
    such as mobile number, and hall codes,booking no. 
    The form adapts to both mobile and desktop views, with input validation and error handling.
    It also includes functionality for clearing search filters.
  */

const SearchApplication = ({ onSearch, type, onClose, searchFields, searchParams, isInboxPage, defaultSearchParams, clearSearch: _clearSearch }) => {
  const { t } = useTranslation();
  const { handleSubmit, reset, watch, control, setError, clearErrors, formState, setValue } = useForm({
    defaultValues: isInboxPage ? searchParams : { locality: null, city: null, ...searchParams },
  });
  const form = watch();

  const formValueEmpty = () => {
    let isEmpty = true;
    Object.keys(form).forEach((key) => {
      if (!["locality", "city"].includes(key) && form[key]) isEmpty = false;
    });

    if (searchFields?.find((e) => e.name === "locality") && !form?.locality?.code) isEmpty = true;
    return isEmpty;
  };

  const mobileView = window.innerWidth <= 640;

  const onSubmitInput = (data) => {
    const updatedData = { ...data };

    if (!data.mobileNumber) {
      delete updatedData.mobileNumber;
    }

    if (isFixedPoint) {
      const vendorName = typeof updatedData.vendorName === "object" ? getVendorLabel(updatedData.vendorName) : normalizeValue(updatedData.vendorName);
      const vehicleName = typeof updatedData.vehicleName === "object" ? getVehicleLabel(updatedData.vehicleName) : normalizeValue(updatedData.vehicleName);
      const driverName = typeof updatedData.driverName === "object" ? getDriverLabel(updatedData.driverName) : normalizeValue(updatedData.driverName);
      const fillingPointId =
        typeof updatedData.fillingPointId === "object" ? getFillingPointValue(updatedData.fillingPointId) : normalizeValue(updatedData.fillingPointId);

      if (vendorName) updatedData.vendorName = vendorName;
      else delete updatedData.vendorName;

      if (vehicleName) updatedData.vehicleName = vehicleName;
      else delete updatedData.vehicleName;

      if (driverName) updatedData.driverName = driverName;
      else delete updatedData.driverName;

      if (fillingPointId) updatedData.fillingPointId = fillingPointId;
      else delete updatedData.fillingPointId;
    }

    updatedData.delete = [];

    searchFields.forEach((field) => {
      if (!updatedData[field.name]) updatedData.delete.push(field.name);
    });

    if (isFixedPoint) {
      FIXED_POINT_ADVANCED_FIELDS.forEach((fieldName) => {
        if (!updatedData[fieldName]) updatedData.delete.push(fieldName);
      });
    }

    onSearch(updatedData);
    if (type === "mobile") {
      onClose();
    }
  };

  function clearSearch() {
    const resetValues = searchFields.reduce((acc, field) => ({ ...acc, [field?.name]: "" }), {});
    if (isFixedPoint) {
      FIXED_POINT_ADVANCED_FIELDS.forEach((fieldName) => {
        resetValues[fieldName] = "";
      });
    }
    reset(resetValues);
    if (isInboxPage) {
      const _newParams = { ...searchParams };
      _newParams.delete = [];
      searchFields.forEach((e) => {
        _newParams.delete.push(e?.name);
      });
      if (isFixedPoint) {
        FIXED_POINT_ADVANCED_FIELDS.forEach((fieldName) => {
          _newParams.delete.push(fieldName);
        });
      }
      onSearch({ ..._newParams });
    } else {
      _clearSearch();
    }
  }

  const clearAll = (mobileView) => {
    const mobileViewStyles = mobileView ? { margin: 0 } : {};
    return (
      <LinkLabel style={{ display: "inline", ...mobileViewStyles }} onClick={clearSearch}>
        {t("ES_COMMON_CLEAR_SEARCH")}
      </LinkLabel>
    );
  };

  const isFixedPoint = window.location.href.includes("fixed-point");
  const { data: fillingPointsData } = Digit.Hooks.wt.useFillPointSearch(
    { tenantId: Digit.ULBService.getCurrentTenantId(), filters: { limit: 1000 } },
    { enabled: !!isFixedPoint }
  );
  const fillingPoints = fillingPointsData?.fillingPoints || [];
  const fillingPointOptions = useMemo(
    () => fillingPoints.map((fillingPoint) => ({ ...fillingPoint, name: getFillingPointLabel(fillingPoint) || "NA" })),
    [fillingPoints]
  );

  const selectedFillingPoint = useMemo(
    () => findSelectedOption(fillingPointOptions, form?.fillingPointId, getFillingPointLabel, ["id", "fillingPointId", "bookingId", "name"]),
    [fillingPointOptions, form?.fillingPointId]
  );

  const selectedFillingPointId = getFillingPointValue(selectedFillingPoint || form?.fillingPointId);

  const { data: vendorData } = Digit.Hooks.fsm.useVendorSearch({
    tenantId: Digit.ULBService.getCurrentTenantId(),
    filters: {
      limit: 1000,
      ...(selectedFillingPointId ? { fillingPointId: selectedFillingPointId } : {}),
    },
    config: { enabled: !!isFixedPoint },
  });

  const vendorOptions = useMemo(
    () => (vendorData?.vendor || []).map((vendor) => ({ ...vendor, name: getVendorLabel(vendor) || "NA" })),
    [vendorData]
  );

  const selectedVendor = useMemo(
    () => findSelectedOption(vendorOptions, form?.vendorName, getVendorLabel, ["id", "vendor_id", "name"]),
    [vendorOptions, form?.vendorName]
  );

  const allVehicleOptions = useMemo(
    () =>
      vendorOptions.flatMap((vendor) =>
        (vendor?.vehicles || []).map((vehicle) => ({
          ...vehicle,
          name: getVehicleLabel(vehicle) || "NA",
          vendorId: vendor?.id,
        }))
      ),
    [vendorOptions]
  );

  const allDriverOptions = useMemo(
    () =>
      vendorOptions.flatMap((vendor) =>
        (vendor?.drivers || []).map((driver) => ({
          ...driver,
          name: getDriverLabel(driver) || "NA",
          vendorId: vendor?.id,
        }))
      ),
    [vendorOptions]
  );

  const vehicleOptions = useMemo(() => {
    if (!selectedVendor) return allVehicleOptions;
    return (selectedVendor?.vehicles || []).map((vehicle) => ({
      ...vehicle,
      name: getVehicleLabel(vehicle) || "NA",
      vendorId: selectedVendor?.id,
    }));
  }, [allVehicleOptions, selectedVendor]);

  const driverOptions = useMemo(() => {
    if (!selectedVendor) return allDriverOptions;
    return (selectedVendor?.drivers || []).map((driver) => ({
      ...driver,
      name: getDriverLabel(driver) || "NA",
      vendorId: selectedVendor?.id,
    }));
  }, [allDriverOptions, selectedVendor]);

  return (
    <form id="search-form" onSubmit={handleSubmit(onSubmitInput)} className=" search-complaint-container">
      <React.Fragment>
        {(type === "mobile" || mobileView) && (
          <div className="complaint-header">
            <h2>{t("ES_COMMON_SEARCH_BY")}</h2>
            <span onClick={onClose}>
              <CloseSvg />
            </span>
          </div>
        )}
        {isFixedPoint ? (
          <CollapsibleCardPage
            title={t("WT_SEARCH_FILTERS_LABEL") || "Search Filters"}
            defaultOpen={true}
            tabs={[t("WT_SMART_SEARCH"), t("WT_ADVANCED_SEARCH")]}
            defaultTab={t("WT_SMART_SEARCH")}
          >
            {(activeTab) => (
              <div className="formcomposer-section-grid">
                {activeTab === t("WT_SMART_SEARCH") && (
                  <Fragment>
                    {searchFields?.map((input) => {
                      if (input.name !== "bookingNo" && input.name !== "mobileNumber") return null;
                      return (
                        <div key={input.name} className="input-fields">
                          <span className={"mobile-input"}>
                            <Label>{t(input.label) + ` ${input.isMendatory ? "*" : ""}`}</Label>
                            {!input.type ? (
                              <Controller
                                render={(props) => <TextInput onChange={props.onChange} value={props.value} />}
                                name={input.name}
                                control={control}
                                defaultValue={""}
                              />
                            ) : (
                              <Controller
                                render={(props) => {
                                  const Comp = fieldComponents?.[input.type];
                                  return <Comp formValue={form} setValue={setValue} onChange={props.onChange} value={props.value} />;
                                }}
                                name={input.name}
                                control={control}
                                defaultValue={""}
                              />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </Fragment>
                )}
                {activeTab === t("WT_ADVANCED_SEARCH") && (
                  <Fragment>
                    {searchFields?.map((input) => (
                      <div key={input.name} className="input-fields">
                        <span className={"mobile-input"}>
                          <Label>{t(input.label) + ` ${input.isMendatory ? "*" : ""}`}</Label>
                          {!input.type ? (
                            <Controller
                              render={(props) => <TextInput onChange={props.onChange} value={props.value} />}
                              name={input.name}
                              control={control}
                              defaultValue={""}
                            />
                          ) : (
                            <Controller
                              render={(props) => {
                                const Comp = fieldComponents?.[input.type];
                                return <Comp formValue={form} setValue={setValue} onChange={props.onChange} value={props.value} />;
                              }}
                              name={input.name}
                              control={control}
                              defaultValue={""}
                            />
                          )}
                        </span>
                      </div>
                    ))}
                     <div className="input-fields">
                      <span className="mobile-input">
                        <Label>{t("WT_FILLING_POINT")}</Label>
                        <Controller
                          control={control}
                          name="fillingPointId"
                          render={(props) => (
                            <Dropdown
                              selected={findSelectedOption(fillingPointOptions, props.value, getFillingPointLabel, ["id", "fillingPointId", "bookingId", "name"])}
                              select={(value) => {
                                props.onChange(value);
                                setValue("vendorName", "");
                                setValue("vehicleName", "");
                                setValue("driverName", "");
                              }}
                              onBlur={props.onBlur}
                              option={fillingPointOptions}
                              optionKey="name"
                              t={t}
                            />
                          )}
                        />
                      </span>
                    </div>
                    <div className="input-fields">
                      <span className="mobile-input">
                        <Label>{t("WT_VENDOR_NAME")}</Label>
                        <Controller
                          control={control}
                          name="vendorName"
                          render={(props) => (
                            <Dropdown
                              selected={findSelectedOption(vendorOptions, props.value, getVendorLabel, ["id", "vendor_id", "name"])}
                              select={(value) => {
                                props.onChange(value);
                                setValue("vehicleName", "");
                                setValue("driverName", "");
                              }}
                              onBlur={props.onBlur}
                              option={vendorOptions}
                              optionKey="name"
                              t={t}
                            />
                          )}
                        />
                      </span>
                    </div>
                    <div className="input-fields">
                      <span className="mobile-input">
                        <Label>{t("WT_VEHICLE_NO")}</Label>
                        <Controller
                          control={control}
                          name="vehicleName"
                          render={(props) => (
                            <Dropdown
                              selected={findSelectedOption(vehicleOptions, props.value, getVehicleLabel, ["id", "registrationNumber", "name"])}
                              select={props.onChange}
                              onBlur={props.onBlur}
                              option={vehicleOptions}
                              optionKey="name"
                              t={t}
                            />
                          )}
                        />
                      </span>
                    </div>
                    <div className="input-fields">
                      <span className="mobile-input">
                        <Label>{t("WT_DRIVER_NAME")}</Label>
                        <Controller
                          control={control}
                          name="driverName"
                          render={(props) => (
                            <Dropdown
                              selected={findSelectedOption(driverOptions, props.value, getDriverLabel, ["id", "ownerId", "licenseNumber", "name"])}
                              select={props.onChange}
                              onBlur={props.onBlur}
                              option={driverOptions}
                              optionKey="name"
                              t={t}
                            />
                          )}
                        />
                      </span>
                    </div>
                   
                  </Fragment>
                )}
              </div>
            )}
          </CollapsibleCardPage>
        ) : (
          <div className="formcomposer-section-grid">
            {searchFields
              ?.filter((e) => true)
              ?.map((input, index) => (
                <div key={input.name} className="input-fields">
                  {/* <span className={index === 0 ? "complaint-input" : "mobile-input"}> */}
                  <span className={"mobile-input"}>
                    <Label>{t(input.label) + ` ${input.isMendatory ? "*" : ""}`}</Label>
                    {!input.type ? (
                      <Controller
                        render={(props) => {
                          return <TextInput onChange={props.onChange} value={props.value} />;
                        }}
                        name={input.name}
                        control={control}
                        defaultValue={""}
                      />
                    ) : (
                      <Controller
                        render={(props) => {
                          const Comp = fieldComponents?.[input.type];
                          return <Comp formValue={form} setValue={setValue} onChange={props.onChange} value={props.value} />;
                        }}
                        name={input.name}
                        control={control}
                        defaultValue={""}
                      />
                    )}
                  </span>
                  {formState?.dirtyFields?.[input.name] && formState?.errors?.[input.name]?.message ? (
                    <span
                      style={{ fontWeight: "700", color: "rgba(212, 53, 28)", paddingLeft: "8px", marginTop: "-20px", fontSize: "12px" }}
                      className="inbox-search-form-error"
                    >
                      {formState?.errors?.[input.name]?.message}
                    </span>
                  ) : null}
                </div>
              ))}
          </div>
        )}
        <div className="formcomposer-section-button">
          {isInboxPage ? (
            <div className="generic-button clear-search">
              <p onClick={clearSearch}>{t("ES_COMMON_CLEAR_SEARCH")}</p>
            </div>
          ) : (
            <div>{clearAll()}</div>
          )}
          {type === "desktop" && !mobileView && (
            <SubmitBar
              className="generic-button"
              disabled={!!Object.keys(formState.errors).length || formValueEmpty()}
              label={t("ES_COMMON_SEARCH")}
              onClick={handleSubmit(onSubmitInput)}
              submit
              form="search-form"
            />
          )}
        </div>

        {(type === "mobile" || mobileView) && (
          <ActionBar className="clear-search-container">
            <button className="clear-search" style={{ flex: 1 }}>
              {clearAll(mobileView)}
            </button>
            <SubmitBar
              disabled={!!Object.keys(formState.errors).length}
              label={t("ES_COMMON_SEARCH")}
              style={{ flex: 1 }}
              onClick={handleSubmit(onSubmitInput)}
              submit={true}
            />
          </ActionBar>
        )}
      </React.Fragment>
    </form>
  );
};

export default SearchApplication;
