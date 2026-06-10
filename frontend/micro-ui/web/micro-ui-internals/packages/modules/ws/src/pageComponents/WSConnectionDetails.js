import {
  CardLabel,
  Dropdown,
  LabelFieldPair,
  Loader,
  TextInput,
  CardLabelError,
  CheckBox,
  RadioButtons,
  UploadFile,
  CollapsibleCardPage,
  Modal,
  ViewsIcon,
} from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { getPattern } from "../utils";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import _, { keys } from "lodash";
import * as func from "../utils";

const createConnectionDetails = () => ({
  water: true,
  sewerage: false,

  proposedPipeSize: "",
  proposedTaps: "",

  proposedToilets: "",
  proposedWaterClosets: "",

  serviceType: { code: "WATER", i18nKey: "WS_APPLICATION_TYPE_WATER" },
  categoryType: { code: "DOMESTIC", i18nKey: "WS_CATEGORY_DOMESTIC" },
  connectionType: { code: "Permanent", i18nKey: "WS_CONNECTION_Permanent" },
  temporaryType: { code: "Exhibition", i18nKey: "Exhibition" },
  waterDemandType: { code: "BULK", i18nKey: "WS_WATER_DEMAND_BULK" },
  applicantType: { code: "OWNER", i18nKey: "WS_APPLICANT_OWNER" },
  domesticType: { i18nKey: "WS_DOMESTIC_TYPE_DOMESTIC", code: "INDIVIDUAL" },
  departmentType: { i18nKey: "WS_DEPARTMENT_TYPE_GOVERNMENT", code: "GOVERNMENT" },
  institutionName: "",
  natureOfWork: "",
  orgDeptDocument: "",
});

const WSConnectionDetails = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [connectionDetails, setConnectionDetails] = useState(
    formData?.ConnectionDetails?.length > 0 ? [formData?.ConnectionDetails?.[0]] : [createConnectionDetails()]
  );
  const [focusIndex, setFocusIndex] = useState({ index: -1, type: "" });
  const stateCode = Digit.ULBService.getStateId();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [isErrors, setIsErrors] = useState(false);
  const [waterSewarageSelection, setWaterSewarageSelection] = useState({ water: true, sewerage: false });

  const [applicationTypeList, setApplicationTypeList] = useState([]);
  const [categoryTypeList, setCategoryTypeList] = useState([]);
  const [connectionTypeList, setConnectionTypeList] = useState([]);
  const [waterDemandTypeList, setWaterDemandTypeList] = useState([]);
  const [applicantTypeList, setApplicantTypeList] = useState([]);
  const [temporaryTypeList, setTemporaryTypeList] = useState([]);
  const [institutionTypeList, setInstitutionTypeList] = useState([]);

  const { isWSServicesMastersLoading, data: wsServicesMastersData } = Digit.Hooks.ws.useMDMS(tenantId, "ws-services-masters", [
    "ApplicationType",
    "WsCategoryType",
    "connectionCategory",
    "WSWaterDemandType",
    "ApplicantType",
    "TemporaryConnectionType",
  ]);

  const { data: commonMastersData } = Digit.Hooks.ws.useMDMS(tenantId, "common-masters", ["InstitutionType"]);

  useEffect(() => {
    const data = connectionDetails.map((e) => {
      return e;
    });
    if (!_.isEqual(formData?.[config.key], data)) {
      const timer = setTimeout(() => {
        onSelect(config?.key, data);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [connectionDetails, formData, config.key]);

  useEffect(() => {
    let list = wsServicesMastersData?.["ws-services-masters"]?.ApplicationType || [];
    // Only filtering the ones that are NOT explicitly false, just in case `active` is missing.
    list = list.filter((data) => data?.active !== false && data?.active !== "false");
    list?.forEach((data) => (data.i18nKey = `WS_APPLICATION_TYPE_${data.code}`));
    setApplicationTypeList(list);

    // Fallback logic for the others since they are not coming from MDMS
    const categories = wsServicesMastersData?.["ws-services-masters"]?.WsCategoryType || [];
    categories.forEach((data) => (data.i18nKey = data.i18nKey || `WS_CATEGORY_${data.code}`));
    setCategoryTypeList(categories);

    const connections = wsServicesMastersData?.["ws-services-masters"]?.connectionCategory || [];
    connections.forEach((data) => (data.i18nKey = data.i18nKey || `WS_CONNECTION_${data.code}`));
    setConnectionTypeList(connections);

    const demands = wsServicesMastersData?.["ws-services-masters"]?.WSWaterDemandType || [];
    demands.forEach((data) => (data.i18nKey = data.i18nKey || `WS_WATER_DEMAND_${data.code}`));
    setWaterDemandTypeList(demands);

    const applicants = wsServicesMastersData?.["ws-services-masters"]?.ApplicantType || [];
    applicants.forEach((data) => (data.i18nKey = data.i18nKey || `WS_APPLICANT_${data.code}`));
    setApplicantTypeList(applicants);

    const tempTypes = wsServicesMastersData?.["ws-services-masters"]?.TemporaryConnectionType || [];
    tempTypes.forEach((data) => (data.i18nKey = data.name || data.code));
    setTemporaryTypeList(tempTypes);
  }, [wsServicesMastersData]);

  useEffect(() => {
    const instTypes = commonMastersData?.["common-masters"]?.InstitutionType || [];
    instTypes.forEach((data) => (data.i18nKey = `COMMON_MASTERS_INSTITUTION_${data.code}`));
    setInstitutionTypeList(instTypes);
  }, [commonMastersData]);

  useEffect(() => {
    if (userType === "employee") {
      onSelect(config.key, connectionDetails);
    }
    if (connectionDetails?.[0]?.water) setWaterSewarageSelection({ water: true, sewerage: false });

    if (connectionDetails?.[0]?.sewerage) setWaterSewarageSelection({ water: false, sewerage: true });
  }, [connectionDetails]);

  useEffect(() => {
    if (!formData?.ConnectionDetails) {
      setConnectionDetails([createConnectionDetails()]);
    }
  }, [formData?.ConnectionDetails]);

  const commonProps = {
    focusIndex,
    connectionDetails,
    setFocusIndex,
    formData,
    formState,
    t,
    setError,
    clearErrors,
    config,
    setConnectionDetails,
    setIsErrors,
    isErrors,
    waterSewarageSelection,
    applicationTypeList,
    categoryTypeList,
    connectionTypeList,
    waterDemandTypeList,
    applicantTypeList,
    temporaryTypeList,
    institutionTypeList,
    formData,
  };

  return (
    <React.Fragment>
      {connectionDetails.map(
        (connectionDetail, index) =>
          connectionDetail && (
            <ConnectionDetails key={connectionDetail?.key || index} index={index} connectionDetail={connectionDetail} {...commonProps} />
          )
      )}
    </React.Fragment>
  );
};

const ConnectionDetails = (_props) => {
  const {
    connectionDetail,
    focusIndex,
    setFocusIndex,
    t,
    config,
    setError,
    clearErrors,
    formState,
    setIsErrors,
    isErrors,
    connectionTypeList,
    setConnectionDetails,
    connectionDetails,
    waterSewarageSelection,
    applicationTypeList,
    categoryTypeList,
    waterDemandTypeList,
    applicantTypeList,
    temporaryTypeList,
    institutionTypeList,
    formData,
  } = _props;

  const { control, formState: localFormState, watch, setError: setLocalError, clearErrors: clearLocalErrors, setValue, trigger, getValues } = useForm(
    {
      defaultValues: {
        serviceType: connectionDetail?.serviceType || { code: "WATER", i18nKey: "WS_APPLICATION_TYPE_WATER" },
        categoryType: connectionDetail?.categoryType || { code: "DOMESTIC", i18nKey: "WS_CATEGORY_DOMESTIC" },
        connectionType: connectionDetail?.connectionType || { code: "Permanent", i18nKey: "WS_CONNECTION_Permanent" },
        temporaryType: connectionDetail?.temporaryType || { code: "Exhibition", i18nKey: "Exhibition" },
        waterDemandType: connectionDetail?.waterDemandType || { code: "BULK", i18nKey: "WS_WATER_DEMAND_BULK" },
        applicantType: connectionDetail?.applicantType || { code: "OWNER", i18nKey: "WS_APPLICANT_OWNER" },
        domesticType: connectionDetail?.domesticType || { i18nKey: "WS_DOMESTIC_TYPE_DOMESTIC", code: "INDIVIDUAL" },
        departmentType: connectionDetail?.departmentType || { i18nKey: "WS_DEPARTMENT_TYPE_GOVERNMENT", code: "GOVERNMENT" },
        institutionName: connectionDetail?.institutionName || "",
        natureOfWork: connectionDetail?.natureOfWork || "",
        orgDeptDocument: connectionDetail?.orgDeptDocument || "",
      },
    }
  );
  const formValue = watch();
  const { errors } = localFormState;

  const [uploadedFile, setUploadedFile] = useState(connectionDetail?.orgDeptDocument || null);
  const [file, setFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileType, setDocFileType] = useState("");

  const handleSelectFile = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size >= 5242880) {
        setFileUploadError(t("CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED") || "Maximum file size exceeded (5MB)");
      } else {
        setFile(selectedFile);
        setFileUploadError(null);
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (file) {
        try {
          const response = await Digit.UploadServices.Filestorage("WS", file, Digit.ULBService.getStateId());
          if (response?.data?.files?.length > 0) {
            const fsId = response?.data?.files[0]?.fileStoreId;
            setUploadedFile(fsId);
            setValue("orgDeptDocument", fsId);
          } else {
            setFileUploadError(t("CS_FILE_UPLOAD_ERROR") || "File Upload Error");
          }
        } catch (err) {
          setFileUploadError(t("CS_FILE_UPLOAD_ERROR") || "File Upload Error");
        }
      }
    })();
  }, [file]);

  const viewDocument = async () => {
    if (uploadedFile) {
      try {
        const res = await Digit.UploadServices.FileFetchbyid(uploadedFile, Digit.ULBService.getStateId());
        if (res?.data) {
          const blob =
            res.data instanceof Blob
              ? res.data
              : new Blob([res.data], { type: res.headers["content-type"] || res.headers["Content-Type"] || "image/jpeg" });
          const fileURL = URL.createObjectURL(blob);
          setDocFileUrl(fileURL);
          const contentType = res.headers["content-type"] || res.headers["Content-Type"] || "";
          if (contentType.toLowerCase().includes("pdf")) {
            setDocFileType("pdf");
          } else {
            setDocFileType("image");
          }
          setShowDocModal(true);
        }
      } catch (err) {
        console.error("Failed to fetch file URL via FileFetchbyid", err);
      }
    }
  };

  useEffect(() => {
    trigger();
  }, []);

  useEffect(() => {
    if (Object.entries(formValue).length > 0) {
      const keys = Object.keys(formValue);
      const part = {};
      keys.forEach((key) => (part[key] = connectionDetail[key]));
      if (!_.isEqual(formValue, part)) {
        let isErrorsFound = true;
        Object.keys(formValue).map((data) => {
          if (!formValue[data] && isErrorsFound) {
            isErrorsFound = false;
            setIsErrors(false);
          }
        });
        if (isErrorsFound) setIsErrors(true);
        let ob = [{ ...connectionDetail, ...formValue }];
        setConnectionDetails(ob);
        trigger();
      }
    }
  }, [formValue, connectionDetails]);

  useEffect(() => {
    let isClear = true;
    connectionDetails &&
      Object.keys(connectionDetails?.[0])?.map((data) => {
        if (connectionDetails[0]?.domesticType?.code === "INDIVIDUAL" && ["institutionName", "natureOfWork", "orgDeptDocument", "departmentType"].includes(data)) {
          return;
        }
        if (!connectionDetails[0][data] && connectionDetails[0][data] != false && isClear) isClear = false;
      });
    if (isClear && Object.keys(connectionDetails?.[0])?.length > 1) {
      clearErrors("ConnectionDetails");
    }

    if (!connectionDetails?.[0]?.sewerage) {
      clearErrors(config.key, { type: "proposedToilets" });
      clearErrors(config.key, { type: "proposedWaterClosets" });
    }

    if (!connectionDetails?.[0]?.water) {
      clearErrors(config.key, { type: "proposedPipeSize" });
      clearErrors(config.key, { type: "proposedTaps" });
    }
    trigger();
  }, [connectionDetails, waterSewarageSelection, formData?.DocumentsRequired?.documents]);

  useEffect(() => {
    if (Object.keys(errors).length && !_.isEqual(formState.errors[config.key]?.type || {}, errors)) {
      setError(config.key, { type: errors });
    } else if (!Object.keys(errors).length && formState.errors[config.key]) {
      clearErrors(config.key);
    }
  }, [errors, formState.errors]);

  const isMobile = window.Digit.Utils.browser.isMobile();
  const isEmployee = window.location.href.includes("/employee");
  return (
    <CollapsibleCardPage title={t("WS_CONNECTION_DETAILS")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <CardLabel>{`${t("WS_SERVICE_TYPE")}*`}</CardLabel>
          <Controller
            control={control}
            name={"serviceType"}
            defaultValue={connectionDetail?.serviceType || ""}
            rules={{ required: t("REQUIRED_FIELD") }}
            isMandatory={true}
            render={(props) => (
              <Dropdown
                className="form-field"
                selected={getValues("serviceType")}
                disable={false}
                option={applicationTypeList}
                errorStyle={localFormState.touched.serviceType && errors?.serviceType?.message ? true : false}
                select={(e) => {
                  props.onChange(e);
                }}
                optionKey="i18nKey"
                onBlur={props.onBlur}
                t={t}
              />
            )}
          />
        </LabelFieldPair>
        {/* <LabelFieldPair>
          <CardLabel>{`${t("WS_CATEGORY_TYPE")}*`}</CardLabel>
          <Controller
            control={control}
            name={"categoryType"}
            defaultValue={connectionDetail?.categoryType || ""}
            rules={{ required: t("REQUIRED_FIELD") }}
            isMandatory={true}
            render={(props) => (
              <Dropdown
                className="form-field"
                selected={getValues("categoryType")}
                disable={false}
                option={categoryTypeList}
                errorStyle={localFormState.touched.categoryType && errors?.categoryType?.message ? true : false}
                select={(e) => {
                  props.onChange(e);
                }}
                optionKey="i18nKey"
                onBlur={props.onBlur}
                t={t}
              />
            )}
          />
        </LabelFieldPair> */}
        <LabelFieldPair>
          <CardLabel>{`${t("WS_CONNECTION_TYPE")}*`}</CardLabel>
          <Controller
            control={control}
            name={"connectionType"}
            defaultValue={connectionDetail?.connectionType || ""}
            rules={{ required: t("REQUIRED_FIELD") }}
            isMandatory={true}
            render={(props) => (
              <Dropdown
                className="form-field"
                selected={getValues("connectionType")}
                disable={false}
                option={connectionTypeList}
                errorStyle={localFormState.touched.connectionType && errors?.connectionType?.message ? true : false}
                select={(e) => {
                  props.onChange(e);
                }}
                optionKey="i18nKey"
                onBlur={props.onBlur}
                t={t}
              />
            )}
          />
        </LabelFieldPair>
        {formValue?.connectionType?.code === "Temporary" && (
          <LabelFieldPair>
            <CardLabel>{`${t("WS_TEMPORARY_TYPE")}*`}</CardLabel>
            <Controller
              control={control}
              name={"temporaryType"}
              defaultValue={connectionDetail?.temporaryType || ""}
              rules={{ required: t("REQUIRED_FIELD") }}
              isMandatory={true}
              render={(props) => (
                <Dropdown
                  className="form-field"
                  selected={getValues("temporaryType")}
                  disable={false}
                  option={temporaryTypeList}
                  errorStyle={localFormState.touched.temporaryType && errors?.temporaryType?.message ? true : false}
                  select={(e) => {
                    props.onChange(e);
                  }}
                  optionKey="i18nKey"
                  onBlur={props.onBlur}
                  t={t}
                />
              )}
            />
          </LabelFieldPair>
        )}
        <LabelFieldPair>
          <CardLabel>{`${t("WS_WATER_DEMAND_TYPE")}*`}</CardLabel>
          <Controller
            control={control}
            name={"waterDemandType"}
            defaultValue={connectionDetail?.waterDemandType || ""}
            rules={{ required: t("REQUIRED_FIELD") }}
            isMandatory={true}
            render={(props) => (
              <Dropdown
                className="form-field"
                selected={getValues("waterDemandType")}
                disable={false}
                option={waterDemandTypeList}
                errorStyle={localFormState.touched.waterDemandType && errors?.waterDemandType?.message ? true : false}
                select={(e) => {
                  props.onChange(e);
                }}
                optionKey="i18nKey"
                onBlur={props.onBlur}
                t={t}
              />
            )}
          />
        </LabelFieldPair>
        <LabelFieldPair>
          <CardLabel>{`${t("WS_APPLICANT_TYPE")}*`}</CardLabel>
          <Controller
            control={control}
            name={"applicantType"}
            defaultValue={connectionDetail?.applicantType || ""}
            rules={{ required: t("REQUIRED_FIELD") }}
            isMandatory={true}
            render={(props) => (
              <Dropdown
                className="form-field"
                selected={getValues("applicantType")}
                disable={false}
                option={applicantTypeList}
                errorStyle={localFormState.touched.applicantType && errors?.applicantType?.message ? true : false}
                select={(e) => {
                  props.onChange(e);
                }}
                optionKey="i18nKey"
                onBlur={props.onBlur}
                t={t}
              />
            )}
          />
        </LabelFieldPair>
        <LabelFieldPair>
          <CardLabel>{`${formValue?.categoryType?.code === "NON_DOMESTIC" || formValue?.categoryType?.name === "Non-Domestic"
              ? t("WS_NON_DOMESTIC_TYPE")
              : t("WS_DOMESTIC_TYPE")
            }*`}</CardLabel>
          <div className="field">
            <Controller
              control={control}
              name={"domesticType"}
              defaultValue={connectionDetail?.domesticType || ""}
              rules={{ required: t("REQUIRED_FIELD") }}
              isMandatory={true}
              render={(props) => (
                <RadioButtons
                  className="form-field"
                  style={{ display: "flex", gap: "2rem", alignItems: "center" }}
                  options={[
                    { i18nKey: "WS_DOMESTIC_TYPE_DOMESTIC", code: "INDIVIDUAL" },
                    { i18nKey: "WS_DOMESTIC_TYPE_NON_DOMESTIC", code: "ORGANIZATION" },
                  ]}
                  optionsKey="i18nKey"
                  selectedOption={getValues("domesticType")}
                  onSelect={(e) => {
                    props.onChange(e);
                  }}
                  t={t}
                  isDependent={true}
                />
              )}
            />
          </div>
        </LabelFieldPair>
        {formValue?.domesticType?.code === "ORGANIZATION" && (
          <React.Fragment>
            <LabelFieldPair>
              <CardLabel>{`${t("WS_DEPARTMENT_TYPE")}*`}</CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name={"departmentType"}
                  defaultValue={connectionDetail?.departmentType || { i18nKey: "WS_DEPARTMENT_TYPE_GOVERNMENT", code: "GOVERNMENT" }}
                  rules={{ required: t("REQUIRED_FIELD") }}
                  isMandatory={true}
                  render={(props) => (
                    <RadioButtons
                      className="form-field"
                      style={{ display: "flex", gap: "2rem", alignItems: "center" }}
                      options={[
                        { i18nKey: "WS_DEPARTMENT_TYPE_GOVERNMENT", code: "GOVERNMENT" },
                        { i18nKey: "WS_DEPARTMENT_TYPE_NON_GOVERNMENT", code: "NON_GOVERNMENT" },
                      ]}
                      optionsKey="i18nKey"
                      selectedOption={getValues("departmentType")}
                      onSelect={(e) => {
                        props.onChange(e);
                      }}
                      t={t}
                      isDependent={true}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            <div style={{ color: "#3257F2", fontWeight: "700", fontSize: "1.5rem", gridColumn: "span 2" }}>
              {t("WS_DEPARTMENT_ORGANIZATION_DETAILS")}
            </div>
            <LabelFieldPair>
              <CardLabel>{`${t("WS_ORGANIZATION_DEPARTMENT_NAME")}*`}</CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name="institutionName"
                  defaultValue={connectionDetail?.institutionName || ""}
                  rules={{ required: t("REQUIRED_FIELD") }}
                  isMandatory={true}
                  render={(props) => (
                    <TextInput
                      value={props.value}
                      placeholder={t("WS_ORGANIZATION_DEPARTMENT_NAME_PLACEHOLDER")}
                      autoFocus={focusIndex.index === connectionDetail?.key && focusIndex.type === "institutionName"}
                      errorStyle={localFormState.touched.institutionName && errors?.institutionName?.message ? true : false}
                      onChange={(e) => {
                        props.onChange(e.target.value);
                        setFocusIndex({ index: connectionDetail?.key, type: "institutionName" });
                      }}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            <LabelFieldPair>
              <CardLabel>{`${t("WS_NATURE_OF_WORK")}*`}</CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name="natureOfWork"
                  defaultValue={connectionDetail?.natureOfWork || ""}
                  rules={{ required: t("REQUIRED_FIELD") }}
                  isMandatory={true}
                  render={(props) => (
                    <TextInput
                      value={props.value}
                      placeholder={t("WS_NATURE_OF_WORK_PLACEHOLDER")}
                      autoFocus={focusIndex.index === connectionDetail?.key && focusIndex.type === "natureOfWork"}
                      errorStyle={localFormState.touched.natureOfWork && errors?.natureOfWork?.message ? true : false}
                      onChange={(e) => {
                        props.onChange(e.target.value);
                        setFocusIndex({ index: connectionDetail?.key, type: "natureOfWork" });
                      }}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            <LabelFieldPair>
              <CardLabel>{`${t("WS_ORG_DEPT_DOCUMENT")}*`}</CardLabel>
              <div className="field" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="orgDeptDocument"
                    defaultValue={connectionDetail?.orgDeptDocument || ""}
                    rules={{ required: t("REQUIRED_FIELD") }}
                    isMandatory={true}
                    render={(props) => (
                      <UploadFile
                        id={"orgDeptDocument"}
                        onUpload={handleSelectFile}
                        onDelete={() => {
                          setUploadedFile(null);
                          setFile(null);
                          props.onChange(null);
                        }}
                        message={uploadedFile ? `1 ${t("WS_ACTION_FILEUPLOADED")}` : t("WS_ACTION_NO_FILEUPLOADED")}
                        accept="image/*, .pdf"
                      />
                    )}
                  />
                </div>
                {uploadedFile && (
                  <div onClick={viewDocument} style={{ cursor: "pointer" }}>
                    <ViewsIcon />
                  </div>
                )}
              </div>
            </LabelFieldPair>
            {fileUploadError && <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{fileUploadError}</div>}
          </React.Fragment>
        )}
      </div>
      {showDocModal && (
        <Modal
          open={showDocModal}
          headerBarMain={t("WS_VIEW_DOCUMENT") || "View Document"}
          headerBarEnd={
            <div className="icon-bg-secondary" onClick={() => setShowDocModal(false)} style={{ cursor: "pointer", padding: "5px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </div>
          }
          center
          actionCancelOnSubmit={() => setShowDocModal(false)}
          actionCancelLabel={t("CS_COMMON_CLOSE") || "Close"}
          popupStyles={{ width: "80%", maxWidth: "800px" }}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", minHeight: "300px" }}>
            {docFileType === "pdf" ? (
              <iframe src={docFileUrl} title="Document Preview" width="100%" height="500px" style={{ border: "none" }} />
            ) : (
              <img
                src={docFileUrl}
                alt="Document Preview"
                style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "4px" }}
              />
            )}
          </div>
        </Modal>
      )}
    </CollapsibleCardPage>
  );
};

export default WSConnectionDetails;
