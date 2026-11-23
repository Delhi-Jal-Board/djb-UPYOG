import { CardLabel, Dropdown, LabelFieldPair, TextInput, CardLabelError, WrapUnMaskComponent, FieldLabelWithTooltip } from "@djb25/digit-ui-react-components";
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
  const existingPref =
    formData?.formDetails?.applicationData?.additionalDetails?.detailsProvidedBy ||
    formData?.additionalDetails?.detailsProvidedBy;

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

  const getTrans = (key, defaultVal) => {
    const val = t(key);
    return val && val !== key ? val : defaultVal;
  };

  const appPlumber = getAppPlumberInfo(formData);

  const initialPref =
    plumberDetail?.detailsProvidedBy?.code === "DJB" ||
    plumberDetail?.detailsProvidedBy?.code === "ULB" ||
    plumberDetail?.detailsProvidedBy?.name === "Delhi Jal Board"
      ? options[1]
      : plumberDetail?.detailsProvidedBy?.code === "Self" || appPlumber?.name
      ? options[0]
      : plumberDetail?.detailsProvidedBy || null;

  const {
    control,
    formState: localFormState,
    watch,
    setError: setLocalError,
    clearErrors: clearLocalErrors,
    setValue,
    trigger,
    getValues,
  } = useForm({
    defaultValues: {
      detailsProvidedBy: initialPref,
      plumberName: plumberDetail?.plumberName || appPlumber?.name || "",
      plumberLicenseNo: plumberDetail?.plumberLicenseNo || appPlumber?.licenseNo || "",
      plumberMobileNo: plumberDetail?.plumberMobileNo || appPlumber?.mobileNumber || "",
      jeOrFirmName: plumberDetail?.jeOrFirmName || "",
    },
  });

  const formValue = watch();
  const { errors } = localFormState;
  const isMobile = window.Digit.Utils.browser.isMobile();
  let isEmployee = window.location.href.includes("/employee");

  const currentPref = formValue?.detailsProvidedBy?.code || plumberDetail?.detailsProvidedBy?.code;
  const isDJB = currentPref === "DJB" || currentPref === "ULB" || formValue?.detailsProvidedBy?.name === "Delhi Jal Board";
  const isSelf = currentPref === "Self";

  useEffect(() => {
    trigger();
  }, []);

  useEffect(() => {
    if (isDJB) {
      clearLocalErrors(["plumberName", "plumberLicenseNo", "plumberMobileNo"]);
    } else if (isSelf) {
      clearLocalErrors(["jeOrFirmName"]);
    }
    trigger();
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
    if (Object.keys(errors).length && !_.isEqual(formState.errors[config.key]?.type || {}, errors)) {
      setError(config.key, { type: errors });
    } else if (!Object.keys(errors).length && formState.errors[config.key]) {
      clearErrors(config.key);
    }
  }, [errors]);

  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "-21px" };

  return (
    <React.Fragment>
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={getTrans("WS_ADDN_DETAILS_PLUMBER_PROVIDED_BY", "Plumber Provided By")}
          isMandatory={true}
          infoText={t("WS_PLUMBER_PROVIDED_BY_INFO_MSG", "Select whether plumber is Self or provided by Delhi Jal Board")}
        />
        <Controller
          control={control}
          name={"detailsProvidedBy"}
          defaultValue={initialPref}
          rules={{ required: getTrans("REQUIRED_FIELD", "Required") }}
          isMandatory={true}
          render={(props) => (
            <Dropdown
              className="form-field"
              selected={props.value || getValues("detailsProvidedBy")}
              disable={false}
              option={options}
              placeholder={getTrans("WS_ADDN_DETAILS_PLUMBER_PROVIDED_BY_PLACEHOLDER", "Select plumber provided by")}
              errorStyle={localFormState.touched.detailsProvidedBy && errors?.detailsProvidedBy?.message ? true : false}
              select={(e) => {
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
              onBlur={props.onBlur}
              t={t}
            />
          )}
        />
        {localFormState.touched.detailsProvidedBy && errors?.detailsProvidedBy?.message ? (
          <CardLabelError style={errorStyle}> {errors?.detailsProvidedBy?.message}</CardLabelError>
        ) : null}
      </LabelFieldPair>

      {/* If DJB is selected: Plumber details are NOT required, instead Name of JE / Name of Firm is shown */}
      {isDJB ? (
        <LabelFieldPair>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={getTrans("WS_NAME_OF_JE_OR_FIRM", "Name of JE / Name of Firm")}
            isMandatory={true}
            infoText={t("WS_NAME_OF_JE_OR_FIRM_INFO_MSG", "Enter Name of JE or Name of Firm")}
          />
          <div className="field">
            <Controller
              control={control}
              name="jeOrFirmName"
              defaultValue={plumberDetail?.jeOrFirmName}
              rules={{ required: getTrans("REQUIRED_FIELD", "Required") }}
              isMandatory={true}
              render={(props) => (
                <TextInput
                  value={props.value}
                  autoFocus={focusIndex.index === plumberDetail?.key && focusIndex.type === "jeOrFirmName"}
                  errorStyle={localFormState.touched.jeOrFirmName && errors?.jeOrFirmName?.message ? true : false}
                  onChange={(e) => {
                    props.onChange(e.target.value);
                    setFocusIndex({ index: plumberDetail?.key, type: "jeOrFirmName" });
                  }}
                  labelStyle={{ marginTop: "unset" }}
                  onBlur={props.onBlur}
                  placeholder={getTrans("WS_NAME_OF_JE_OR_FIRM_PLACEHOLDER", "Enter Name of JE / Name of Firm")}
                />
              )}
            />
          </div>
          {localFormState.touched.jeOrFirmName && errors?.jeOrFirmName?.message ? (
            <CardLabelError style={errorStyle}> {errors?.jeOrFirmName?.message}</CardLabelError>
          ) : null}
        </LabelFieldPair>
      ) : null}

      {/* If Self is selected (or default before selection): Plumber details are mandatory */}
      {isSelf || !currentPref ? (
        <React.Fragment>
          <LabelFieldPair>
            <FieldLabelWithTooltip
              style={{ margin: 0 }}
              label={getTrans("WS_ADDN_DETAILS_PLUMBER_NAME_LABEL", "Plumber Name")}
              isMandatory={true}
              infoText={t("WS_PLUMBER_NAME_INFO_MSG", "Enter Name of Plumber")}
            />
            <div className="field">
              <Controller
                control={control}
                name="plumberName"
                defaultValue={plumberDetail?.plumberName || appPlumber?.name || ""}
                rules={{
                  validate: (e) =>
                    !e || !e.trim()
                      ? getTrans("REQUIRED_FIELD", "Required")
                      : /^[a-zA-Z\s]{1,50}$/.test(e)
                      ? true
                      : getTrans("WS_NAME_ERROR_MESSAGE", "Only alphabets are allowed"),
                  required: getTrans("REQUIRED_FIELD", "Required"),
                }}
                isMandatory={true}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    autoFocus={focusIndex.index === plumberDetail?.key && focusIndex.type === "plumberName"}
                    errorStyle={localFormState.touched.plumberName && errors?.plumberName?.message ? true : false}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleanVal = val.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
                      props.onChange(cleanVal);
                      setFocusIndex({ index: plumberDetail?.key, type: "plumberName" });
                    }}
                    labelStyle={{ marginTop: "unset" }}
                    onBlur={props.onBlur}
                    placeholder={getTrans("WS_ADDN_DETAILS_PLUMBER_NAME_PLACEHOLDER", "Enter Name of Plumber")}
                  />
                )}
              />
            </div>
            {localFormState.touched.plumberName && errors?.plumberName?.message ? (
              <CardLabelError style={errorStyle}> {errors?.plumberName?.message}</CardLabelError>
            ) : null}
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip
              style={{ margin: 0 }}
              label={getTrans("WS_PLIMBER_LICENSE_NO_LABEL", "Plumber License Number")}
              isMandatory={true}
              infoText={t("WS_PLUMBER_LICENSE_NO_INFO_MSG", "Enter Plumber License Number")}
            />
            <div className="field">
              <Controller
                control={control}
                name="plumberLicenseNo"
                defaultValue={plumberDetail?.plumberLicenseNo || appPlumber?.licenseNo || ""}
                rules={{
                  required: getTrans("REQUIRED_FIELD", "Required"),
                }}
                isMandatory={true}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    autoFocus={focusIndex.index === plumberDetail?.key && focusIndex.type === "plumberLicenseNo"}
                    errorStyle={localFormState.touched.plumberLicenseNo && errors?.plumberLicenseNo?.message ? true : false}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                      setFocusIndex({ index: plumberDetail?.key, type: "plumberLicenseNo" });
                    }}
                    labelStyle={{ marginTop: "unset" }}
                    onBlur={props.onBlur}
                    placeholder={getTrans("WS_PLIMBER_LICENSE_NO_PLACEHOLDER", "Enter Plumber License Number")}
                  />
                )}
              />
            </div>
            {localFormState.touched.plumberLicenseNo && errors?.plumberLicenseNo?.message ? (
              <CardLabelError style={errorStyle}>{errors?.plumberLicenseNo?.message}</CardLabelError>
            ) : null}
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip
              style={{ margin: 0 }}
              label={getTrans("WS_PLUMBER_MOBILE_NO_LABEL", "Plumber Mobile Number")}
              isMandatory={true}
              infoText={t("WS_PLUMBER_MOBILE_NO_INFO_MSG", "Enter 10-digit Plumber Mobile Number")}
            />
            <div className="field">
              <Controller
                control={control}
                name="plumberMobileNo"
                defaultValue={plumberDetail?.plumberMobileNo || appPlumber?.mobileNumber || ""}
                rules={{
                  validate: (e) => {
                    if (!e || !e.trim()) return getTrans("REQUIRED_FIELD", "Required");
                    if (e.includes("*")) return true;
                    if (/^[6-9]\d{9}$/.test(e)) return true;
                    return getTrans("CORE_COMMON_PHONENO_INVALID", "Please enter a valid 10-digit mobile number");
                  },
                  required: getTrans("REQUIRED_FIELD", "Required"),
                }}
                type="mobileNumber"
                isMandatory={true}
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
                      errorStyle={localFormState.touched.plumberMobileNo && errors?.plumberMobileNo?.message ? true : false}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanVal = val && val.includes("*") ? val : (val || "").replace(/[^0-9]/g, "").slice(0, 10);
                        props.onChange(cleanVal);
                        setFocusIndex({ index: plumberDetail?.key, type: "plumberMobileNo" });
                      }}
                      labelStyle={{ marginTop: "unset" }}
                      onBlur={props.onBlur}
                      placeholder={getTrans("WS_PLUMBER_MOBILE_NO_PLACEHOLDER", "Enter Plumber Mobile Number")}
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
            {localFormState.touched.plumberMobileNo && errors?.plumberMobileNo?.message ? (
              <CardLabelError style={errorStyle}> {errors?.plumberMobileNo?.message}</CardLabelError>
            ) : null}
          </LabelFieldPair>
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
};

export default WSActivationPlumberDetails;
