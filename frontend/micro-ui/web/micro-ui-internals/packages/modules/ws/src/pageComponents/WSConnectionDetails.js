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
  MobileNumber,
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

  serviceType: { code: "NEW_WATER_CONNECTION", i18nKey: "WS_APPLICATION_TYPE_NEW_WATER_CONNECTION", name: "Water Connection" },
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
  authorizedRepresentativeName: "",
  authorizedRepresentativeDesignation: "",
  authorizedRepresentativeMobileNumber: "",
});

const isAuthorizedRepresentative = (type, t) => {
  if (!type) return false;
  const candidates = [typeof type === "string" ? type : "", type?.code, type?.name, type?.i18nKey, type?.i18nKey && t ? t(type.i18nKey) : ""].filter(
    Boolean
  );

  return candidates.some((cand) => {
    const s = String(cand).toLowerCase();
    return s.includes("authorized") || s.includes("representative");
  });
};

const getCptAddress = (formData) => {
  if (formData?.cpt?.details?.address) return formData.cpt.details.address;
  if (formData?.property?.address) return formData.property.address;
  if (formData?.propertyAddress) return formData.propertyAddress;
  try {
    const sessionPt = JSON.parse(sessionStorage.getItem("Digit_FSM_PT") || "{}");
    if (sessionPt?.address) return sessionPt.address;
  } catch (e) {}
  return null;
};

const getPropertyAddressString = (address, t) => {
  if (!address) return "";
  if (typeof address === "string") return address;

  const parts = [];
  if (address?.doorNo) parts.push(address.doorNo);
  if (address?.buildingName) parts.push(address.buildingName);
  if (address?.street) parts.push(address.street);
  if (address?.landmark) parts.push(address.landmark);

  const tenantId = address?.tenantId || Digit.ULBService.getCurrentTenantId();
  const localityCode = address?.locality?.code || (typeof address?.locality === "string" ? address?.locality : null);

  let localityText = "";
  if (localityCode && Digit.Utils?.pt?.getMohallaLocale) {
    const locLocale = Digit.Utils.pt.getMohallaLocale(localityCode, tenantId);
    localityText = t ? t(locLocale) : locLocale;
  }
  if (!localityText || localityText === localityCode) {
    localityText = address?.locality?.name || address?.locality?.code || "";
  }
  if (localityText) parts.push(localityText);

  let cityText = "";
  if (tenantId && Digit.Utils?.pt?.getCityLocale) {
    const cityLocale = Digit.Utils.pt.getCityLocale(tenantId);
    cityText = t ? t(cityLocale) : cityLocale;
  }
  if (!cityText || cityText === tenantId) {
    cityText = address?.city || tenantId || "";
  }
  if (cityText) parts.push(cityText);

  if (address?.pincode) {
    parts.push(address.pincode);
  }

  return parts.filter(Boolean).join(", ");
};

const getCleanAddressValue = (val) => {
  if (!val) return "";
  if (typeof val === "object") {
    const code = val.code || val.name || val.i18nKey || "";
    if (code.toUpperCase() === "PERMANENT" || code.toUpperCase() === "CORRESPONDENCE") return "";
    return code;
  }
  const str = String(val).trim();
  if (str.toUpperCase() === "PERMANENT" || str.toUpperCase() === "CORRESPONDENCE") return "";
  return str;
};

const WSConnectionDetails = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const cptAddrTop = getCptAddress(formData);
  const formattedPropertyAddressTop = getPropertyAddressString(cptAddrTop, t);

  const [connectionDetails, setConnectionDetails] = useState(() => {
    if (formData?.ConnectionDetails?.length > 0) {
      const initial = { ...formData.ConnectionDetails[0] };
      if (!initial.addressType && formattedPropertyAddressTop) {
        initial.addressType = formattedPropertyAddressTop;
      }
      if (!initial.completeAddress && formattedPropertyAddressTop) {
        initial.completeAddress = formattedPropertyAddressTop;
      }
      return [initial];
    }
    const def = createConnectionDetails();
    if (formattedPropertyAddressTop) {
      def.addressType = formattedPropertyAddressTop;
      def.completeAddress = formattedPropertyAddressTop;
    }
    return [def];
  });

  useEffect(() => {
    if (formData?.ConnectionDetails?.length > 0) {
      const incoming = formData.ConnectionDetails[0];
      const current = connectionDetails?.[0];
      if (!_.isEqual(current, incoming)) {
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

    if (list.length > 0) {
      const waterOption =
        list.find(
          (opt) =>
            opt?.code === "NEW_WATER_CONNECTION" ||
            opt?.code === "WATER_CONNECTION" ||
            opt?.name?.toLowerCase() === "water connection" ||
            t(opt?.i18nKey)?.toLowerCase() === "water connection"
        ) || list[0];

      if (waterOption) {
        setConnectionDetails((prev) => {
          const current = prev?.[0];
          const isDefault =
            !current?.serviceType ||
            current?.serviceType?.code === "WATER" ||
            current?.serviceType?.i18nKey === "WS_APPLICATION_TYPE_WATER";
          if (isDefault) {
            return [{ ...(current || createConnectionDetails()), serviceType: waterOption }];
          }
          return prev;
        });
      }
    }

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
    if (connectionDetails?.[0]?.water) setWaterSewarageSelection({ water: true, sewerage: false });

    if (connectionDetails?.[0]?.sewerage) setWaterSewarageSelection({ water: false, sewerage: true });
  }, [connectionDetails]);

  useEffect(() => {
    if (!formData?.ConnectionDetails && connectionDetails?.length === 0) {
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
                <ConnectionDetails key={connectionDetail?.key || index} index={index} connectionDetail={connectionDetail} {...commonProps} />
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
    userType,
  } = _props;

  const cptAddr = getCptAddress(formData);
  const formattedPropertyAddress = getPropertyAddressString(cptAddr, t);

  const rawAddressType =
    connectionDetail?.addressType ||
    formData?.ConnectionDetails?.[0]?.addressType ||
    formData?.additionalDetails?.addressType ||
    formData?.additionalDetails?.ConnectionDetails?.[0]?.addressType ||
    formData?.addressType;

  const rawCompleteAddress =
    connectionDetail?.completeAddress ||
    formData?.ConnectionDetails?.[0]?.completeAddress ||
    formData?.additionalDetails?.completeAddress ||
    formData?.additionalDetails?.ConnectionDetails?.[0]?.completeAddress ||
    formData?.completeAddress;

  const owner = formData?.cpt?.details?.owners?.[0];
  const ownerPermAddress = owner?.permanentAddress && owner?.permanentAddress !== "NA" ? owner.permanentAddress : "";
  const ownerCorrAddress = owner?.correspondenceAddress && owner?.correspondenceAddress !== "NA" ? owner.correspondenceAddress : "";

  const initialAddressValue =
    getCleanAddressValue(rawAddressType) ||
    getCleanAddressValue(rawCompleteAddress) ||
    formattedPropertyAddress ||
    ownerCorrAddress ||
    ownerPermAddress ||
    "";

  const { control, formState: localFormState, watch, setError: setLocalError, clearErrors: clearLocalErrors, setValue, trigger, getValues } = useForm(
    {
      defaultValues: {
        serviceType:
          connectionDetail?.serviceType &&
          connectionDetail?.serviceType?.code !== "WATER" &&
          connectionDetail?.serviceType?.i18nKey !== "WS_APPLICATION_TYPE_WATER"
            ? connectionDetail.serviceType
            : { code: "NEW_WATER_CONNECTION", i18nKey: "WS_APPLICATION_TYPE_NEW_WATER_CONNECTION", name: "Water Connection" },
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
        addressType: initialAddressValue || "",
        completeAddress: initialAddressValue || "",
        authorizedRepresentativeName: connectionDetail?.authorizedRepresentativeName || "",
        authorizedRepresentativeDesignation: connectionDetail?.authorizedRepresentativeDesignation || "",
        authorizedRepresentativeMobileNumber: connectionDetail?.authorizedRepresentativeMobileNumber || "",
      },
    }
  );
  const formValue = watch();
  const { errors } = localFormState;

  const prevPropertyIdRef = React.useRef(formData?.cpt?.details?.propertyId);
  const prevPropAddrRef = React.useRef(formattedPropertyAddress);
  const isAddressUserEditedRef = React.useRef(false);

  useEffect(() => {
    const currentPropertyId = formData?.cpt?.details?.propertyId;
    const isNewPropertySelected = Boolean(currentPropertyId && prevPropertyIdRef.current && currentPropertyId !== prevPropertyIdRef.current);

    if (isNewPropertySelected) {
      prevPropertyIdRef.current = currentPropertyId;
      isAddressUserEditedRef.current = false;
    } else if (currentPropertyId && !prevPropertyIdRef.current) {
      prevPropertyIdRef.current = currentPropertyId;
    }

    if (isAddressUserEditedRef.current) {
      return;
    }

    const currentCptAddr = getCptAddress(formData);
    const newFormattedAddr = getPropertyAddressString(currentCptAddr, t);

    const currentVal = getValues("addressType");
    const isValOldType = typeof currentVal === "object" || currentVal === "PERMANENT" || currentVal === "CORRESPONDENCE";

    if (
      newFormattedAddr &&
      (isNewPropertySelected || isValOldType || currentVal === undefined || currentVal === null || currentVal === prevPropAddrRef.current)
    ) {
      setValue("addressType", newFormattedAddr, { shouldValidate: true });
      setValue("completeAddress", newFormattedAddr);
      prevPropAddrRef.current = newFormattedAddr;
    }
  }, [formData?.cpt?.details?.propertyId, formData?.cpt?.details?.address, formData?.property?.address]);

  useEffect(() => {
    if (applicationTypeList && applicationTypeList.length > 0) {
      const waterOption =
        applicationTypeList.find(
          (opt) =>
            opt?.code === "NEW_WATER_CONNECTION" ||
            opt?.code === "WATER_CONNECTION" ||
            opt?.name?.toLowerCase() === "water connection" ||
            t(opt?.i18nKey)?.toLowerCase() === "water connection"
        ) || applicationTypeList[0];

      const currentService = getValues("serviceType");
      const isDefault =
        !currentService ||
        currentService?.i18nKey === "WS_APPLICATION_TYPE_WATER" ||
        currentService?.code === "WATER" ||
        currentService === "Water";

      if (waterOption && isDefault) {
        setValue("serviceType", waterOption);
      }
    }
  }, [applicationTypeList]);

  const [uploadedFile, setUploadedFile] = useState(connectionDetail?.orgDeptDocument || null);
  const [file, setFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileType, setDocFileType] = useState("");

  const handleSelectFile = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5242880) {
        setFileUploadError(t("CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED") || "File size should not exceed 5MB");
        if (e.target) e.target.value = "";
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
          if (
            !isAuthorizedRepresentative(formValue?.applicantType, t) &&
            ["authorizedRepresentativeName", "authorizedRepresentativeDesignation", "authorizedRepresentativeMobileNumber"].includes(data)
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
        if (
          !isAuthorizedRepresentative(connectionDetails[0]?.applicantType, t) &&
          ["authorizedRepresentativeName", "authorizedRepresentativeDesignation", "authorizedRepresentativeMobileNumber"].includes(data)
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

  useEffect(() => {
    if (!isAuthorizedRepresentative(formValue?.applicantType, t)) {
      clearLocalErrors("authorizedRepresentativeName");
      clearLocalErrors("authorizedRepresentativeDesignation");
      clearLocalErrors("authorizedRepresentativeMobileNumber");
    }
  }, [formValue?.applicantType]);

  const isMobile = window.Digit.Utils.browser.isMobile();
  const isEmployee = window.location.href.includes("/employee");
  return (
    <React.Fragment>
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
                <Dropdown
                  className="form-field"
                  selected={getValues("serviceType")}
                  disable={false}
                  option={applicationTypeList}
                  select={(e) => {
                    props.onChange(e);
                  }}
                  placeholder={t("Select Service Type")}
                  optionKey="i18nKey"
                  onBlur={props.onBlur}
                  t={t}
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
          <LabelFieldPair>
            <CardLabel>
              {t("WS_Billing_Address_Type")}
              <span className="check-page-link-button">*</span>
            </CardLabel>
            <div className="field">
              <Controller
                control={control}
                name={"addressType"}
                defaultValue={initialAddressValue || ""}
                rules={{ required: t("REQUIRED_FIELD") }}
                isMandatory={true}
                render={(props) => (
                  <TextInput
                    className="form-field"
                    value={props.value ?? getValues("addressType") ?? ""}
                    disable={false}
                    disabled={false}
                    errorStyle={localFormState.touched.addressType && errors?.addressType?.message ? true : false}
                    onChange={(e) => {
                      isAddressUserEditedRef.current = true;
                      props.onChange(e.target.value);
                      setValue("completeAddress", e.target.value);
                    }}
                    onBlur={props.onBlur}
                    placeholder={t("WS_Billing_Address_Type")}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
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
              <div>
                <CardLabel>{`${t("Organization/Department Document")}*`}</CardLabel>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "-2px", marginBottom: "4px" }}>
                  {t("WS_DOCUMENT_MAX_SIZE_MESSAGE") || "Allowed formats: PDF, JPG, PNG | Max file size: 5MB"}
                </div>
              </div>
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
      {isAuthorizedRepresentative(formValue?.applicantType, t) && (
        <CollapsibleCardPage title={t("WS_AUTHORIZED_REPRESENTATIVE_DETAILS")} defaultOpen={true}>
          <div className="formcomposer-section-grid">
            <LabelFieldPair>
              <CardLabel>
                {`${t("Name")}`}
                <span className="check-page-link-button">*</span>
              </CardLabel>
              <Controller
                control={control}
                name="authorizedRepresentativeName"
                defaultValue={connectionDetail?.authorizedRepresentativeName || ""}
                rules={{
                  validate: (e) =>
                    !isAuthorizedRepresentative(getValues("applicantType"), t) || (e && e.trim())
                      ? /^[a-zA-Z\s]{1,50}$/.test(e)
                        ? true
                        : t("WS_NAME_ERROR_MESSAGE") || "Only alphabets are allowed"
                      : t("REQUIRED_FIELD"),
                  required: isAuthorizedRepresentative(getValues("applicantType"), t) ? t("REQUIRED_FIELD") : false,
                }}
                isMandatory={true}
                render={(props) => (
                  <div>
                    <TextInput
                      className="form-field"
                      value={props.value || ""}
                      autoFocus={focusIndex.index === connectionDetail?.key && focusIndex.type === "authorizedRepresentativeName"}
                      errorStyle={localFormState.touched.authorizedRepresentativeName && errors?.authorizedRepresentativeName?.message ? true : false}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
                        props.onChange(val);
                        setFocusIndex({ index: connectionDetail?.key, type: "authorizedRepresentativeName" });
                      }}
                      onBlur={props.onBlur}
                      placeholder={t("Enter Name")}
                    />
                    {localFormState.touched.authorizedRepresentativeName && errors?.authorizedRepresentativeName && (
                      <CardLabelError style={{ width: "100%", fontSize: "12px" }}>{errors.authorizedRepresentativeName.message}</CardLabelError>
                    )}
                  </div>
                )}
              />
            </LabelFieldPair>
            <LabelFieldPair>
              <CardLabel>
                {`${t("Designation")}`}
                <span className="check-page-link-button">*</span>
              </CardLabel>
              <Controller
                control={control}
                name="authorizedRepresentativeDesignation"
                defaultValue={connectionDetail?.authorizedRepresentativeDesignation || ""}
                rules={{
                  validate: (e) =>
                    !isAuthorizedRepresentative(getValues("applicantType"), t) || (e && e.trim())
                      ? /^[a-zA-Z\s]{1,50}$/.test(e)
                        ? true
                        : t("WS_DESIGNATION_ERROR_MESSAGE") || "Only alphabets are allowed"
                      : t("REQUIRED_FIELD"),
                  required: isAuthorizedRepresentative(getValues("applicantType"), t) ? t("REQUIRED_FIELD") : false,
                }}
                isMandatory={true}
                render={(props) => (
                  <div>
                    <TextInput
                      className="form-field"
                      value={props.value || ""}
                      autoFocus={focusIndex.index === connectionDetail?.key && focusIndex.type === "authorizedRepresentativeDesignation"}
                      errorStyle={
                        localFormState.touched.authorizedRepresentativeDesignation && errors?.authorizedRepresentativeDesignation?.message
                          ? true
                          : false
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
                        props.onChange(val);
                        setFocusIndex({ index: connectionDetail?.key, type: "authorizedRepresentativeDesignation" });
                      }}
                      onBlur={props.onBlur}
                      placeholder={t("Enter Designation")}
                    />
                    {localFormState.touched.authorizedRepresentativeDesignation && errors?.authorizedRepresentativeDesignation && (
                      <CardLabelError style={{ width: "100%", fontSize: "12px" }}>
                        {errors.authorizedRepresentativeDesignation.message}
                      </CardLabelError>
                    )}
                  </div>
                )}
              />
            </LabelFieldPair>

            <LabelFieldPair>
              <CardLabel>
                {`${t("CORE_COMMON_MOBILE_NUMBER")}`}
                <span className="check-page-link-button">*</span>
              </CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name="authorizedRepresentativeMobileNumber"
                  defaultValue={connectionDetail?.authorizedRepresentativeMobileNumber || ""}
                  rules={{
                    validate: (e) => {
                      if (!isAuthorizedRepresentative(getValues("applicantType"), t)) return true;
                      if (!e || !e.trim()) return t("REQUIRED_FIELD");
                      if (/^[6-9]\d{9}$/.test(e)) return true;
                      return t("CORE_COMMON_PHONENO_INVALID") || "Please enter a valid 10-digit mobile number";
                    },
                    required: isAuthorizedRepresentative(getValues("applicantType"), t) ? t("REQUIRED_FIELD") : false,
                  }}
                  isMandatory={true}
                  render={(props) => (
                    <div>
                      <MobileNumber
                        name="authorizedRepresentativeMobileNumber"
                        value={props.value || ""}
                        maxlength={10}
                        maxLength={10}
                        autoFocus={focusIndex.index === connectionDetail?.key && focusIndex.type === "authorizedRepresentativeMobileNumber"}
                        errorStyle={
                          localFormState.touched.authorizedRepresentativeMobileNumber && errors?.authorizedRepresentativeMobileNumber?.message
                            ? true
                            : false
                        }
                        onChange={(val) => {
                          const cleanVal = (val || "").replace(/[^0-9]/g, "").slice(0, 10);
                          props.onChange(cleanVal);
                          setFocusIndex({ index: connectionDetail?.key, type: "authorizedRepresentativeMobileNumber" });
                        }}
                        onBlur={props.onBlur}
                        hideSpan={false}
                        placeholder={t("CORE_COMMON_MOBILE_NUMBER")}
                      />
                      {localFormState.touched.authorizedRepresentativeMobileNumber && errors?.authorizedRepresentativeMobileNumber && (
                        <CardLabelError style={{ width: "100%", fontSize: "12px" }}>
                          {errors.authorizedRepresentativeMobileNumber.message}
                        </CardLabelError>
                      )}
                    </div>
                  )}
                />
              </div>
            </LabelFieldPair>
          </div>
        </CollapsibleCardPage>
      )}
    </React.Fragment>
  );
};

export default WSConnectionDetails;
