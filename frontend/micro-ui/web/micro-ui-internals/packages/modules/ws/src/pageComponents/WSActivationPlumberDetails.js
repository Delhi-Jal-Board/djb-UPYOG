import {
  CardLabel,
  Dropdown,
  LabelFieldPair,
  TextInput,
  CardLabelError,
  WrapUnMaskComponent,
  FieldLabelWithTooltip,
} from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import * as func from "../utils";
import { useForm, Controller } from "react-hook-form";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { getPattern } from "../utils";

const options = [
  { name: "Self", code: "Self", i18nKey: "WS_PLUMBER_SELF" },
  { name: "Delhi Jal Board", code: "DJB", i18nKey: "WS_PLUMBER_DJB" },
];

const getAppPlumberInfo = (formData) => {
  return (
    formData?.formDetails?.applicationData?.plumberInfo?.[0] ||
    formData?.connectionDetails?.[0]?.formDetails?.applicationData?.plumberInfo?.[0] ||
    formData?.plumberInfo?.[0] ||
    null
  );
};

const createPlumberDetails = (formData) => {
  const appPlumber = getAppPlumberInfo(formData);
  const existingPref = formData?.formDetails?.applicationData?.additionalDetails?.detailsProvidedBy || formData?.additionalDetails?.detailsProvidedBy;

  let defaultPref = null;
  if (existingPref === "DJB" || existingPref === "ULB" || existingPref === "Delhi Jal Board") {
    defaultPref = options[1];
  } else if (existingPref === "Self" || appPlumber?.name) {
    defaultPref = options[0];
  }

  return {
    detailsProvidedBy: defaultPref,
    plumberName: appPlumber?.name || "",
    plumberMobileNo: appPlumber?.mobileNumber || "",
    plumberLicenseNo: appPlumber?.licenseNo || "",
    jeOrFirmName:
      formData?.formDetails?.applicationData?.additionalDetails?.nameOfJEOrFirm ||
      formData?.formDetails?.applicationData?.additionalDetails?.jeOrFirmName ||
      "",
    key: Date.now(),
  };
};

const WSActivationPlumberDetails = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const filters = func.getQueryStringParams(location.search);

  const [plumberDetails, setPlumberDetails] = useState(() => {
    if (formData?.plumberDetails?.length > 0) {
      return formData.plumberDetails;
    }
    return [createPlumberDetails(formData)];
  });

  const [focusIndex, setFocusIndex] = useState({ index: -1, type: "" });
  const [isErrors, setIsErrors] = useState(true);

  useEffect(() => {
    const data =
      plumberDetails.length &&
      plumberDetails.map((e) => {
        return e;
      });
    if (data && !_.isEqual(formData?.[config?.key], data)) {
      onSelect(config?.key, data);
    }
  }, [plumberDetails, formData?.connectionDetails?.[0]?.connectionType, config?.key]);

  const commonProps = {
    focusIndex,
    allOwners: plumberDetails,
    setFocusIndex,
    formData,
    formState,
    t,
    setError,
    clearErrors,
    config,
    setPlumberDetails,
    setIsErrors,
    isErrors,
    plumberDetails,
    filters,
    options,
  };

  return (
    <React.Fragment>
      {plumberDetails?.length &&
        plumberDetails.map((plumberDetail, index) => (
          <PlumberDetails key={plumberDetail.key || index} index={index} plumberDetail={plumberDetail} {...commonProps} />
        ))}
    </React.Fragment>
  );
};

const PlumberDetails = (_props) => {
  const {
    plumberDetail,
    index,
    focusIndex,
    allOwners,
    setFocusIndex,
    t,
    formData,
    config,
    setError,
    clearErrors,
    formState,
    isEdit,
    plumberDetails,
    setIsErrors,
    isErrors,
    filters,
    options,
    setPlumberDetails,
  } = _props;

  
  const appPlumber = getAppPlumberInfo(formData);

  const initialPref =
    plumberDetail?.detailsProvidedBy?.code === "DJB" ||
    plumberDetail?.detailsProvidedBy?.code === "ULB" ||
    plumberDetail?.detailsProvidedBy?.name === "Delhi Jal Board"
      ? options[1]
      : plumberDetail?.detailsProvidedBy?.code === "Self" || appPlumber?.name
      ? options[0]
      : plumberDetail?.detailsProvidedBy || null;

  const { control, formState: localFormState, watch, setError: setLocalError, clearErrors: clearLocalErrors, setValue, getValues } = useForm(
    {
      mode: "all",
      reValidateMode: "onChange",
      defaultValues: {
        detailsProvidedBy: initialPref,
        plumberName: plumberDetail?.plumberName || appPlumber?.name || "",
        plumberLicenseNo: plumberDetail?.plumberLicenseNo || appPlumber?.licenseNo || "",
        plumberMobileNo: plumberDetail?.plumberMobileNo || appPlumber?.mobileNumber || "",
        jeOrFirmName: plumberDetail?.jeOrFirmName || "",
      },
    }
  );

  const formValue = watch();
  const isMobile = window.Digit.Utils.browser.isMobile();
  let isEmployee = window.location.href.includes("/employee");

  const currentPref = formValue?.detailsProvidedBy?.code || plumberDetail?.detailsProvidedBy?.code;
  const isDJB =
    currentPref === "DJB" ||
    currentPref === "ULB" ||
    formValue?.detailsProvidedBy?.name === "Delhi Jal Board" ||
    plumberDetail?.detailsProvidedBy?.name === "Delhi Jal Board";
  const isSelf = currentPref === "Self" || (!isDJB && (currentPref === undefined || currentPref === null) && appPlumber?.name);

  const [touchedFields, setTouchedFields] = useState({});
  const markTouched = (fieldName) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const isFieldTouched = (fieldName) => {
    return Boolean(
      localFormState?.touched?.[fieldName] ||
      touchedFields[fieldName] ||
      (formState?.submitCount > 0)
    );
  };

  const getActiveErrors = () => {
    const errs = {};
    if (!currentPref) {
      errs.detailsProvidedBy = { message: t("REQUIRED_FIELD") };
      return errs;
    }
    if (isDJB) {
      const val = formValue?.jeOrFirmName !== undefined ? formValue.jeOrFirmName : (plumberDetail?.jeOrFirmName || "");
      if (!val || !val.trim()) {
        errs.jeOrFirmName = { message: t("REQUIRED_FIELD") };
      }
    } else if (isSelf) {
      const pName = formValue?.plumberName !== undefined ? formValue.plumberName : (plumberDetail?.plumberName || "");
      if (!pName || !pName.trim()) {
        errs.plumberName = { message: t("REQUIRED_FIELD") };
      } else if (!/^[a-zA-Z\s]{1,50}$/.test(pName)) {
        errs.plumberName = { message: t("WS_NAME_ERROR_MESSAGE") };
      }

      const pLic = formValue?.plumberLicenseNo !== undefined ? formValue.plumberLicenseNo : (plumberDetail?.plumberLicenseNo || "");
      if (!pLic || !pLic.toString().trim()) {
        errs.plumberLicenseNo = { message: t("REQUIRED_FIELD") };
      }

      const pMob = formValue?.plumberMobileNo !== undefined ? formValue.plumberMobileNo : (plumberDetail?.plumberMobileNo || "");
      const cleanMob = pMob ? pMob.toString().trim() : "";
      if (!cleanMob) {
        errs.plumberMobileNo = { message: t("REQUIRED_FIELD") };
      } else if (!cleanMob.includes("*") && !/^[6-9]\d{9}$/.test(cleanMob)) {
        errs.plumberMobileNo = { message: t("CORE_COMMON_PHONENO_INVALID") };
      }
    }
    return errs;
  };

  const activeErrors = getActiveErrors();

  const showDetailsProvidedByError = Boolean(isFieldTouched("detailsProvidedBy") && activeErrors.detailsProvidedBy);
  const showJeOrFirmError = Boolean(isFieldTouched("jeOrFirmName") && activeErrors.jeOrFirmName);
  const showPlumberNameError = Boolean(isFieldTouched("plumberName") && activeErrors.plumberName);
  const showPlumberLicenseNoError = Boolean(isFieldTouched("plumberLicenseNo") && activeErrors.plumberLicenseNo);
  const showPlumberMobileNoError = Boolean(isFieldTouched("plumberMobileNo") && activeErrors.plumberMobileNo);

  useEffect(() => {
    if (isDJB) {
      clearLocalErrors(["plumberName", "plumberLicenseNo", "plumberMobileNo"]);
    } else if (isSelf) {
      clearLocalErrors(["jeOrFirmName"]);
    }
  }, [currentPref]);

  useEffect(() => {
    if (Object.entries(formValue).length > 0) {
      const keys = Object.keys(formValue);
      const part = {};
      keys.forEach((key) => (part[key] = plumberDetail[key]));
      if (!_.isEqual(formValue, part)) {
        let ob = [{ ...plumberDetail, ...formValue }];
        setPlumberDetails(ob);
      }
    }
  }, [formValue]);

  useEffect(() => {
    const activeErrs = getActiveErrors();
    const hasActiveErrs = Object.keys(activeErrs).length > 0;
    if (hasActiveErrs) {
      setError(config.key, { type: activeErrs });
    } else {
      clearErrors(config.key);
    }
  }, [
    currentPref,
    formValue?.jeOrFirmName,
    formValue?.plumberName,
    formValue?.plumberLicenseNo,
    formValue?.plumberMobileNo,
    formValue?.detailsProvidedBy,
    formState?.submitCount,
  ]);

  useEffect(() => {
    return () => {
      clearErrors(config.key);
    };
  }, []);

  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "-21px" };

  return (
    <React.Fragment>
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_ADDN_DETAILS_PLUMBER_PROVIDED_BY")}
          isMandatory={true}
          infoText={t("WS_PLUMBER_PROVIDED_BY_INFO_MSG")}
        />
        <Controller
          control={control}
          name={"detailsProvidedBy"}
          defaultValue={initialPref}
          rules={{ required: t("REQUIRED_FIELD") }}
          render={(props) => (
            <Dropdown
              className="form-field"
              selected={props.value || getValues("detailsProvidedBy")}
              disable={false}
              option={options}
              placeholder={t("WS_ADDN_DETAILS_PLUMBER_PROVIDED_BY_PLACEHOLDER")}
              errorStyle={showDetailsProvidedByError}
              select={(e) => {
                markTouched("detailsProvidedBy");
                if (e.code === "DJB") {
                  setValue("plumberName", "");
                  setValue("plumberLicenseNo", "");
                  setValue("plumberMobileNo", "");
                  clearLocalErrors(["plumberName", "plumberLicenseNo", "plumberMobileNo"]);
                  let obj = {
                    ...plumberDetails?.[0],
                    detailsProvidedBy: e,
                    plumberName: "",
                    plumberLicenseNo: "",
                    plumberMobileNo: "",
                  };
                  setPlumberDetails([obj]);
                } else if (e.code === "Self") {
                  setValue("jeOrFirmName", "");
                  clearLocalErrors(["jeOrFirmName"]);
                  const pName = appPlumber?.name || getValues("plumberName") || "";
                  const pLic = appPlumber?.licenseNo || getValues("plumberLicenseNo") || "";
                  const pMob = appPlumber?.mobileNumber || getValues("plumberMobileNo") || "";
                  if (pName) setValue("plumberName", pName);
                  if (pLic) setValue("plumberLicenseNo", pLic);
                  if (pMob) setValue("plumberMobileNo", pMob);

                  let obj = {
                    ...plumberDetails?.[0],
                    detailsProvidedBy: e,
                    plumberName: pName,
                    plumberLicenseNo: pLic,
                    plumberMobileNo: pMob,
                    jeOrFirmName: "",
                  };
                  setPlumberDetails([obj]);
                }
                props.onChange(e);
              }}
              optionKey="name"
              onBlur={() => {
                markTouched("detailsProvidedBy");
                props.onBlur();
              }}
              t={t}
            />
          )}
        />
        {showDetailsProvidedByError ? (
          <CardLabelError style={errorStyle}> {activeErrors.detailsProvidedBy?.message || t("REQUIRED_FIELD")}</CardLabelError>
        ) : null}
      </LabelFieldPair>

      {/* If DJB is selected: Plumber details are NOT required, instead Name of JE / Name of Firm is shown */}
      {isDJB ? (
        <LabelFieldPair>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={t("WS_NAME_OF_JE_OR_FIRM")}
            isMandatory={true}
            infoText={t("WS_NAME_OF_JE_OR_FIRM_INFO_MSG")}
          />
          <div className="field">
            <Controller
              control={control}
              name="jeOrFirmName"
              defaultValue={plumberDetail?.jeOrFirmName}
              rules={isDJB ? { required: t("REQUIRED_FIELD") } : {}}
              render={(props) => (
                <TextInput
                  value={props.value}
                  autoFocus={focusIndex.index === plumberDetail?.key && focusIndex.type === "jeOrFirmName"}
                  errorStyle={showJeOrFirmError}
                  onChange={(e) => {
                    markTouched("jeOrFirmName");
                    const val = e.target.value;
                    props.onChange(val);
                    clearLocalErrors("jeOrFirmName");
                    setFocusIndex({ index: plumberDetail?.key, type: "jeOrFirmName" });
                  }}
                  labelStyle={{ marginTop: "unset" }}
                  onBlur={() => {
                    markTouched("jeOrFirmName");
                    props.onBlur();
                  }}
                  placeholder={t("WS_NAME_OF_JE_OR_FIRM_PLACEHOLDER")}
                />
              )}
            />
          </div>
          {showJeOrFirmError ? (
            <CardLabelError style={errorStyle}> {activeErrors.jeOrFirmName?.message || t("REQUIRED_FIELD")}</CardLabelError>
          ) : null}
        </LabelFieldPair>
      ) : null}

      {/* If Self is selected (or default before selection): Plumber details are mandatory */}
      {isSelf || !currentPref ? (
        <React.Fragment>
          <LabelFieldPair>
            <FieldLabelWithTooltip
              style={{ margin: 0 }}
              label={t("WS_ADDN_DETAILS_PLUMBER_NAME_LABEL")}
              isMandatory={true}
              infoText={t("WS_PLUMBER_NAME_INFO_MSG")}
            />
            <div className="field">
              <Controller
                control={control}
                name="plumberName"
                defaultValue={plumberDetail?.plumberName || appPlumber?.name || ""}
                rules={
                  isSelf
                    ? {
                        validate: (e) =>
                          !e || !e.trim()
                            ? t("REQUIRED_FIELD")
                            : /^[a-zA-Z\s]{1,50}$/.test(e)
                            ? true
                            : t("WS_NAME_ERROR_MESSAGE"),
                        required: t("REQUIRED_FIELD"),
                      }
                    : {}
                }
                render={(props) => (
                  <TextInput
                    value={props.value}
                    autoFocus={focusIndex.index === plumberDetail?.key && focusIndex.type === "plumberName"}
                    errorStyle={showPlumberNameError}
                    onChange={(e) => {
                      markTouched("plumberName");
                      const val = e.target.value;
                      const cleanVal = val.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
                      props.onChange(cleanVal);
                      clearLocalErrors("plumberName");
                      setFocusIndex({ index: plumberDetail?.key, type: "plumberName" });
                    }}
                    labelStyle={{ marginTop: "unset" }}
                    onBlur={() => {
                      markTouched("plumberName");
                      props.onBlur();
                    }}
                    placeholder={t("WS_ADDN_DETAILS_PLUMBER_NAME_PLACEHOLDER")}
                  />
                )}
              />
            </div>
            {showPlumberNameError ? (
              <CardLabelError style={errorStyle}> {activeErrors.plumberName?.message || t("REQUIRED_FIELD")}</CardLabelError>
            ) : null}
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip
              style={{ margin: 0 }}
              label={t("WS_PLIMBER_LICENSE_NO_LABEL")}
              isMandatory={true}
              infoText={t("WS_PLUMBER_LICENSE_NO_INFO_MSG")}
            />
            <div className="field">
              <Controller
                control={control}
                name="plumberLicenseNo"
                defaultValue={plumberDetail?.plumberLicenseNo || appPlumber?.licenseNo || ""}
                rules={isSelf ? { required: t("REQUIRED_FIELD") } : {}}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    autoFocus={focusIndex.index === plumberDetail?.key && focusIndex.type === "plumberLicenseNo"}
                    errorStyle={showPlumberLicenseNoError}
                    onChange={(e) => {
                      markTouched("plumberLicenseNo");
                      const val = e.target.value;
                      props.onChange(val);
                      clearLocalErrors("plumberLicenseNo");
                      setFocusIndex({ index: plumberDetail?.key, type: "plumberLicenseNo" });
                    }}
                    labelStyle={{ marginTop: "unset" }}
                    onBlur={() => {
                      markTouched("plumberLicenseNo");
                      props.onBlur();
                    }}
                    placeholder={t("WS_PLIMBER_LICENSE_NO_PLACEHOLDER")}
                  />
                )}
              />
            </div>
            {showPlumberLicenseNoError ? (
              <CardLabelError style={errorStyle}>{activeErrors.plumberLicenseNo?.message || t("REQUIRED_FIELD")}</CardLabelError>
            ) : null}
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip
              style={{ margin: 0 }}
              label={t("WS_PLUMBER_MOBILE_NO_LABEL")}
              isMandatory={true}
              infoText={t("WS_PLUMBER_MOBILE_NO_INFO_MSG")}
            />
            <div className="field">
              <Controller
                control={control}
                name="plumberMobileNo"
                defaultValue={plumberDetail?.plumberMobileNo || appPlumber?.mobileNumber || ""}
                rules={
                  isSelf
                    ? {
                        validate: (e) => {
                          if (!e || !e.trim()) return t("REQUIRED_FIELD");
                          if (e.includes("*")) return true;
                          if (/^[6-9]\d{9}$/.test(e)) return true;
                          return t("CORE_COMMON_PHONENO_INVALID");
                        },
                        required: t("REQUIRED_FIELD"),
                      }
                    : {}
                }
                type="mobileNumber"
                render={(props) => (
                  <div style={{ display: "flex", alignItems: "baseline", marginRight: "unset" }}>
                    <div style={{ position: "relative", zIndex: "1", left: "35px", marginTop: "-24.5px", marginLeft: "-26px" }}>+91</div>
                    <TextInput
                      style={{ background: "#FAFAFA", padding: "0px 35px" }}
                      type="mobileNumber"
                      value={props.value}
                      maxlength={10}
                      maxLength={10}
                      autoFocus={focusIndex.index === plumberDetail?.key && focusIndex.type === "plumberMobileNo"}
                      errorStyle={showPlumberMobileNoError}
                      onChange={(e) => {
                        markTouched("plumberMobileNo");
                        const val = e.target.value;
                        let rawDigits = (val || "").replace(/[^0-9]/g, "");
                        if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
                          rawDigits = rawDigits.slice(2);
                        } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
                          rawDigits = rawDigits.slice(1);
                        }
                        const cleanVal = val && val.includes("*") ? val : rawDigits.slice(0, 10);
                        props.onChange(cleanVal);
                        clearLocalErrors("plumberMobileNo");
                        setFocusIndex({ index: plumberDetail?.key, type: "plumberMobileNo" });
                      }}
                      labelStyle={{ marginTop: "unset" }}
                      onBlur={() => {
                        markTouched("plumberMobileNo");
                        props.onBlur();
                      }}
                      placeholder={t("WS_PLUMBER_MOBILE_NO_PLACEHOLDER")}
                    />
                    <div style={isMobile && isEmployee ? {} : { marginRight: "-50px", marginLeft: "10px" }}>
                      <WrapUnMaskComponent
                        unmaskField={(e) => {
                          props.onChange(e);
                        }}
                        iseyevisible={props.value?.includes("*") ? true : false}
                        privacy={{
                          uuid: plumberDetail?.applicationNo,
                          fieldName: "plumberInfoMobileNumber",
                          model: "WnSConnectionPlumber",
                          loadData: {
                            serviceName:
                              formData?.connectionDetails?.[0]?.formDetails?.applicationData?.serviceType === "WATER" ||
                              formData?.disConnectionDetails?.[0]?.consumerNumber?.includes("WS")
                                ? "/ws-services/wc/_search"
                                : "/sw-services/swc/_search",
                            requestBody: {},
                            requestParam: {
                              tenantId: formData?.connectionDetails?.[0]?.formDetails?.tenantId,
                              applicationNumber: plumberDetail?.applicationNo,
                            },
                            jsonPath:
                              formData?.connectionDetails?.[0]?.formDetails?.applicationData?.serviceType === "WATER" ||
                              formData?.disConnectionDetails?.[0]?.consumerNumber?.includes("WS")
                                ? "WaterConnection[0].plumberInfo[0].mobileNumber"
                                : "SewerageConnections[0].plumberInfo[0].mobileNumber",
                            isArray: false,
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
              />
            </div>
            {showPlumberMobileNoError ? (
              <CardLabelError style={errorStyle}> {activeErrors.plumberMobileNo?.message || t("REQUIRED_FIELD")}</CardLabelError>
            ) : null}
          </LabelFieldPair>
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
};

export default WSActivationPlumberDetails;
