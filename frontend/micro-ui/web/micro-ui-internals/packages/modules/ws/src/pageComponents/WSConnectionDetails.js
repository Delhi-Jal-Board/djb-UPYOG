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
  FormStep,
} from "@djb25/digit-ui-react-components";
import Timeline from "../components/Timeline";
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
  connectionType: { code: "Metered", i18nKey: "WS_CONNECTIONTYPE_METERED", name: "Metered" },
  temporaryType: { code: "Exhibition", i18nKey: "Exhibition" },
  waterDemandType: { code: "NON_BULK", i18nKey: "WS_WATER_DEMAND_NON_BULK" },
  applicantType: { code: "OWNER", i18nKey: "WS_APPLICANT_OWNER" },
  domesticType: { i18nKey: "WS_DOMESTIC_TYPE_DOMESTIC", code: "INDIVIDUAL" },
  departmentType: { i18nKey: "WS_DEPARTMENT_TYPE_GOVERNMENT", code: "GOVERNMENT" },
  institutionName: "",
  natureOfWork: "",
  orgDeptDocument: "",
  addressType: "",
  completeAddress: "",
});

const WSConnectionDetails = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [connectionDetails, setConnectionDetails] = useState(
    formData?.ConnectionDetails?.length > 0 ? [formData?.ConnectionDetails?.[0]] : [createConnectionDetails()]
  );

  useEffect(() => {
    if (formData?.ConnectionDetails?.length > 0) {
      const incoming = formData.ConnectionDetails[0];
      const current = connectionDetails?.[0];
      if (
        (!current?.addressType && incoming?.addressType) ||
        (!current?.completeAddress && incoming?.completeAddress) ||
        !_.isEqual(current, incoming)
      ) {
        setConnectionDetails([incoming]);
      }
    }
  }, [formData?.ConnectionDetails]);
  const [focusIndex, setFocusIndex] = useState({ index: -1, type: "" });
  const stateCode = Digit.ULBService.getStateId();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [isErrors, setIsErrors] = useState(true);
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
    if (userType !== "citizen") {
      const data = connectionDetails.map((e) => {
        return e;
      });
      if (!_.isEqual(formData?.[config.key], data)) {
        const timer = setTimeout(() => {
          onSelect(config?.key, data);
        }, 200);
        return () => clearTimeout(timer);
      }
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
    userType,
  };

  const goNext = () => {
    if (userType === "citizen") {
      if (connectionDetails?.[0]?.serviceType?.code) {
        sessionStorage.setItem("serviceName", connectionDetails[0].serviceType.code);
      }
      onSelect(config?.key, connectionDetails);
    }
  };

  if (userType === "citizen") {
    return (
      <div>
        <Timeline currentStep={2} />
        <FormStep t={t} config={config} onSelect={goNext} onSkip={() => onSelect()} isDisabled={isErrors}>
          {connectionDetails.map(
            (connectionDetail, index) =>
              connectionDetail && (
                <ConnectionDetails
                  key={connectionDetail?.key || index}
                  index={index}
                  connectionDetail={connectionDetail}
                  {...commonProps}
                />
              )
          )}
        </FormStep>
      </div>
    );
  }

  return (
    <React.Fragment>
      {connectionDetails.map(
        (connectionDetail, index) =>
          connectionDetail && (
            <ConnectionDetails
              key={connectionDetail?.key || index}
              index={index}
              connectionDetail={connectionDetail}
              {...commonProps}
            />
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
    userType,
  } = _props;

  const userInfo = JSON.parse(window.localStorage.getItem("Citizen.user-info") || window.localStorage.getItem("user-info") || "{}");
  let addresses = userInfo?.addresses || [];

  if (!addresses || addresses.length === 0) {
    const owner = formData?.cpt?.details?.owners?.[0];
    const cptAddress = formData?.cpt?.details?.address;
    const formattedPropertyAddress = cptAddress
      ? [
          cptAddress?.doorNo,
          cptAddress?.buildingName,
          cptAddress?.street,
          cptAddress?.landmark,
          cptAddress?.locality?.name || cptAddress?.locality?.code,
          cptAddress?.city,
          cptAddress?.pincode,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const ownerPermAddress =
      owner?.permanentAddress && owner?.permanentAddress !== "NA" ? owner.permanentAddress : formattedPropertyAddress;
    const ownerCorrAddress =
      owner?.correspondenceAddress && owner?.correspondenceAddress !== "NA"
        ? owner.correspondenceAddress
        : ownerPermAddress || formattedPropertyAddress;

    if (ownerPermAddress || ownerCorrAddress) {
      addresses = [
        { type: "PERMANENT", address: ownerPermAddress },
        { type: "CORRESPONDENCE", address: ownerCorrAddress },
      ];
    }
  }

  const getAddressTypeObj = (val) => {
    if (!val) return null;
    if (typeof val === "object") {
      const code = (val.code || val.i18nKey || "").toUpperCase();
      if (code === "CORRESPONDENCE") {
        return { i18nKey: "Correspondence", code: "CORRESPONDENCE" };
      }
      return { i18nKey: "Permanent", code: "PERMANENT" };
    }
    const str = String(val).toUpperCase();
    if (str === "CORRESPONDENCE") {
      return { i18nKey: "Correspondence", code: "CORRESPONDENCE" };
    }
    if (str === "PERMANENT") {
      return { i18nKey: "Permanent", code: "PERMANENT" };
    }
    return { i18nKey: val, code: val };
  };

  const initialAddressType =
    getAddressTypeObj(
      connectionDetail?.addressType ||
      formData?.ConnectionDetails?.[0]?.addressType ||
      formData?.additionalDetails?.addressType ||
      formData?.additionalDetails?.ConnectionDetails?.[0]?.addressType ||
      formData?.addressType
    ) || "";

  let initialCompleteAddress =
    connectionDetail?.completeAddress ||
    formData?.ConnectionDetails?.[0]?.completeAddress ||
    formData?.additionalDetails?.completeAddress ||
    formData?.additionalDetails?.ConnectionDetails?.[0]?.completeAddress ||
    formData?.completeAddress ||
    "";

  if (!initialCompleteAddress && initialAddressType?.code && addresses?.length > 0) {
    const matchedAddr = addresses.find((a) => a.type === initialAddressType.code) || {};
    initialCompleteAddress =
      matchedAddr.houseNumber || matchedAddr.city || matchedAddr.pinCode
        ? [matchedAddr.houseNumber, matchedAddr.address, matchedAddr.city, matchedAddr.pinCode].filter(Boolean).join(", ")
        : matchedAddr.address || "";
  }

  const { control, formState: localFormState, watch, setError: setLocalError, clearErrors: clearLocalErrors, setValue, trigger, getValues } = useForm(
    {
      defaultValues: {
        serviceType: connectionDetail?.serviceType || { code: "WATER", i18nKey: "WS_APPLICATION_TYPE_WATER" },
        categoryType: connectionDetail?.categoryType || { code: "DOMESTIC", i18nKey: "WS_CATEGORY_DOMESTIC" },
        connectionType: connectionDetail?.connectionType || { code: "Metered", i18nKey: "WS_CONNECTIONTYPE_METERED", name: "Metered" },
        temporaryType: connectionDetail?.temporaryType || { code: "Exhibition", i18nKey: "Exhibition" },
        waterDemandType: connectionDetail?.waterDemandType || { code: "NON_BULK", i18nKey: "WS_WATER_DEMAND_NON_BULK" },
        applicantType: connectionDetail?.applicantType || { code: "OWNER", i18nKey: "WS_APPLICANT_OWNER" },
        domesticType: connectionDetail?.domesticType || { i18nKey: "WS_DOMESTIC_TYPE_DOMESTIC", code: "INDIVIDUAL" },
        departmentType: connectionDetail?.departmentType || { i18nKey: "WS_DEPARTMENT_TYPE_GOVERNMENT", code: "GOVERNMENT" },
        institutionName: connectionDetail?.institutionName || "",
        natureOfWork: connectionDetail?.natureOfWork || "",
        orgDeptDocument: connectionDetail?.orgDeptDocument || "",
        orgDeptDocumentName: connectionDetail?.orgDeptDocumentName || "",
        addressType: initialAddressType || "",
        completeAddress: initialCompleteAddress || "",
      },
    }
  );
  const formValue = watch();
  const { errors } = localFormState;

  useEffect(() => {
    const rawAddrType =
      connectionDetail?.addressType ||
      formData?.ConnectionDetails?.[0]?.addressType ||
      formData?.additionalDetails?.addressType ||
      formData?.additionalDetails?.ConnectionDetails?.[0]?.addressType ||
      formData?.addressType;

    const formattedAddrType = getAddressTypeObj(rawAddrType);
    if (formattedAddrType) {
      const currentVal = getValues("addressType");
      if (!currentVal || (typeof currentVal === "object" && currentVal?.code !== formattedAddrType.code) || (typeof currentVal === "string" && currentVal !== formattedAddrType.code)) {
        setValue("addressType", formattedAddrType);
      }
    }

    const savedAddr =
      connectionDetail?.completeAddress ||
      formData?.ConnectionDetails?.[0]?.completeAddress ||
      formData?.additionalDetails?.completeAddress ||
      formData?.additionalDetails?.ConnectionDetails?.[0]?.completeAddress ||
      formData?.completeAddress;

    const currentAddr = getValues("completeAddress");
    if (savedAddr && (!currentAddr || currentAddr !== savedAddr)) {
      setValue("completeAddress", savedAddr);
    } else if (!currentAddr && formattedAddrType && addresses?.length > 0) {
      const matched = addresses.find((a) => a.type === formattedAddrType.code) || {};
      const fallback =
        matched.houseNumber || matched.city || matched.pinCode
          ? [matched.houseNumber, matched.address, matched.city, matched.pinCode].filter(Boolean).join(", ")
          : matched.address || "";
      if (fallback) {
        setValue("completeAddress", fallback);
      }
    }
  }, [
    connectionDetail?.addressType,
    connectionDetail?.completeAddress,
    formData?.ConnectionDetails,
    formData?.additionalDetails,
    addresses?.length,
  ]);

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
            setValue("orgDeptDocumentName", file.name);
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
          if (
            formValue?.domesticType?.code === "INDIVIDUAL" &&
            ["institutionName", "natureOfWork", "orgDeptDocument", "orgDeptDocumentName", "departmentType"].includes(data)
          ) {
            return;
          }
          if (!formValue[data] && isErrorsFound) {
            isErrorsFound = false;
            setIsErrors(true);
          }
        });
        if (isErrorsFound) setIsErrors(false);
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
        if (
          connectionDetails[0]?.domesticType?.code === "INDIVIDUAL" &&
          ["institutionName", "natureOfWork", "orgDeptDocument", "departmentType"].includes(data)
        ) {
          return;
        }
        if (!connectionDetails[0][data] && connectionDetails[0][data] != false && isClear) isClear = false;
      });
    if (isClear && Object.keys(connectionDetails?.[0])?.length > 1) {
      if (clearErrors) clearErrors("ConnectionDetails");
    }

    if (!connectionDetails?.[0]?.sewerage) {
      if (clearErrors) clearErrors(config.key, { type: "proposedToilets" });
      if (clearErrors) clearErrors(config.key, { type: "proposedWaterClosets" });
    }

    if (!connectionDetails?.[0]?.water) {
      if (clearErrors) clearErrors(config.key, { type: "proposedPipeSize" });
      if (clearErrors) clearErrors(config.key, { type: "proposedTaps" });
    }
    trigger();
  }, [connectionDetails, waterSewarageSelection, formData?.DocumentsRequired?.documents]);

  useEffect(() => {
    if (Object.keys(errors).length && !_.isEqual(formState?.errors?.[config.key]?.type || {}, errors)) {
      if (setError) setError(config.key, { type: errors });
    } else if (!Object.keys(errors).length && formState?.errors?.[config.key]) {
      if (clearErrors) clearErrors(config.key);
    }
  }, [errors, formState?.errors]);

  const isMobile = window.Digit.Utils.browser.isMobile();
  const isEmployee = window.location.href.includes("/employee");
  return (
    <CollapsibleCardPage title={t("Connection Details")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <CardLabel>
            {`${t("Service Type")}`}
            <span className="check-page-link-button">*</span>
          </CardLabel>
          <Controller
            control={control}
            name={"serviceType"}
            defaultValue={connectionDetail?.serviceType || ""}
            rules={{ required: t("REQUIRED_FIELD") }}
            isMandatory={true}
            render={(props) => (
              <TextInput
                className="form-field"
                value={"Water Connection"}
                disable={true}
                disabled={true}
                onChange={() => {}}
                style={{ backgroundColor: "#eee" }}
                placeholder={t("Select Service Type")}
              />
            )}
          />
        </LabelFieldPair>
        {/* <LabelFieldPair>
          <CardLabel>{`${t("Category Type")}*`}</CardLabel>
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
        {/* <LabelFieldPair>
          <CardLabel>{`${t("Connection Type")}*`}</CardLabel>
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
            <CardLabel>{`${t("Temporary Type")}*`}</CardLabel>
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
        )} */}
        {/* <LabelFieldPair>
          <CardLabel>{`${t("Water Demand Type")}*`}</CardLabel>
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
        </LabelFieldPair> */}
        <LabelFieldPair>
          <CardLabel>
            {`${t("Applicant Type")}`}
            <span className="check-page-link-button">*</span>
          </CardLabel>
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
                placeholder={t("Select Applicant Type")}
              />
            )}
          />
        </LabelFieldPair>
        <React.Fragment>
          <LabelFieldPair>
            <CardLabel>
              {t("WS_Billing_Address_Type")}
              <span className="check-page-link-button">*</span>
            </CardLabel>
            <Controller
              control={control}
              name={"addressType"}
              defaultValue={initialAddressType || ""}
              rules={{ required: t("REQUIRED_FIELD") }}
              isMandatory={true}
              render={(props) => (
                <Dropdown
                  className="form-field"
                  selected={props.value || getValues("addressType") || initialAddressType}
                  disable={false}
                  option={[
                    { i18nKey: "Permanent", code: "PERMANENT" },
                    { i18nKey: "Correspondence", code: "CORRESPONDENCE" },
                  ]}
                  errorStyle={localFormState.touched.addressType && errors?.addressType?.message ? true : false}
                  select={(e) => {
                    props.onChange(e);
                    const selectedAddress = addresses.find((a) => a.type === e.code) || {};
                    const formattedAddress =
                      selectedAddress.houseNumber || selectedAddress.city || selectedAddress.pinCode
                        ? [selectedAddress.houseNumber, selectedAddress.address, selectedAddress.city, selectedAddress.pinCode]
                            .filter(Boolean)
                            .join(", ")
                        : selectedAddress.address || "";
                    setValue("completeAddress", formattedAddress);
                  }}
                  optionKey="i18nKey"
                  onBlur={props.onBlur}
                  t={t}
                  placeholder={t("Select Address Type")}
                />
              )}
            />
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel>{t("Complete Address")}</CardLabel>
            <Controller
              control={control}
              name={"completeAddress"}
              defaultValue={initialCompleteAddress || ""}
              render={(props) => (
                <div className="field">
                  <TextInput
                    className="form-field"
                    value={props.value ?? getValues("completeAddress") ?? initialCompleteAddress ?? ""}
                    disable={addresses.length > 0}
                    disabled={addresses.length > 0}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                      setValue("completeAddress", e.target.value);
                    }}
                    style={addresses.length > 0 ? { backgroundColor: "#eee" } : {}}
                  />
                </div>
              )}
            />
          </LabelFieldPair>
        </React.Fragment>
        {/* <LabelFieldPair>
          <CardLabel>{`${formValue?.categoryType?.code === "NON_DOMESTIC" || formValue?.categoryType?.name === "Non-Domestic"
              ? t("Non-Domestic Type")
              : t("Domestic Type")
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
        </LabelFieldPair> */}
        {/* {formValue?.domesticType?.code === "ORGANIZATION" && (
          <React.Fragment>
            <LabelFieldPair>
              <CardLabel>{`${t("Department Type")}*`}</CardLabel>
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
              {t("Department/Organization Details")}
            </div>
            <LabelFieldPair>
              <CardLabel>{`${t("Organization/Department Name")}*`}</CardLabel>
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
                      placeholder={t("Enter Organization/Department Name")}
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
              <CardLabel>{`${t("Nature of Work")}*`}</CardLabel>
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
                      placeholder={t("Enter Nature of Work")}
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
              <CardLabel>{`${t("Organization/Department Document")}*`}</CardLabel>
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
                        message={uploadedFile ? `1 ${t("File Uploaded Successfully")}` : t("No File Uploaded")}
                        accept="image/*, .pdf"
                        uploadedFiles={
                          uploadedFile && !file ? [[connectionDetail?.orgDeptDocumentName || "Document", { fileStoreId: uploadedFile }]] : undefined
                        }
                        removeTargetedFile={() => {
                          setUploadedFile(null);
                          setFile(null);
                          props.onChange(null);
                        }}
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
        )} */}
      </div>
      {showDocModal && (
        <Modal
          open={showDocModal}
          headerBarMain={t("View Document") || "View Document"}
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
