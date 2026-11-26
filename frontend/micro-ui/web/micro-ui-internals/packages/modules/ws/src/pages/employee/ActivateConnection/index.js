import { FormComposer, Header, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import cloneDeep from "lodash/cloneDeep";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import { newConfig as newConfigLocal } from "../../../config/wsActivationConfig";
import { stringReplaceAll, convertDateToEpochNew, convertEpochToDates } from "../../../utils";
import * as func from "../../../utils";
import _ from "lodash";

const ActivateConnection = () => {
  const { t } = useTranslation();
  const location = useLocation();
  let state = location?.state ? (typeof location.state === "string" ? JSON.parse(location.state) : location.state) : {};
  const history = useHistory();
  let filters = func.getQueryStringParams(location.search);
  const initialAppData = cloneDeep(state?.data || state?.applicationData || (state?.applicationNo ? state : undefined));
  let details = initialAppData;
  const stateId = Digit.ULBService.getStateId();
  let tenantId = Digit.ULBService.getCurrentTenantId() || Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code;

  const { data: mdmsMeterMakeData } = Digit.Hooks.ws.useMDMS(
    stateId,
    "ws-services-calculation",
    ["MeterMake"]
  );

  const meterMakeList = React.useMemo(() => {
    const rawList = mdmsMeterMakeData?.["ws-services-calculation"]?.MeterMake;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList
        .filter((item) => item?.active === true || String(item?.active).toLowerCase() === "true")
        .map((item) => ({
          name: item.name || item.code,
          code: item.code || item.name,
          i18nKey: `WS_METER_MAKE_${(item.code || item.name).replace(/\s+/g, "_").toUpperCase()}`,
          active: item.active,
        }));
    }
    return [];
  }, [mdmsMeterMakeData]);

  const [canSubmit, setSubmitValve] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [appDetails, setAppDetails] = useState({});
  const [isAppDetailsPage, setIsAppDetailsPage] = useState(false);

  let { data: newConfig, isLoading } = Digit.Hooks.ws.useWSConfigMDMS.WSActivationConfig(stateId, {});
  let { isLoading: isappdetailsLoading, isError, data: applicationDetails, error } = Digit.Hooks.ws.useWSDetailsPage(
    t,
    tenantId,
    details?.applicationNo || filters?.applicationNumber,
    details?.serviceType || filters?.service,
    { privacy: Digit.Utils.getPrivacyObject() }
  );
  details = cloneDeep(applicationDetails);
  state = { data: { ...(initialAppData || {}), ...(applicationDetails?.applicationData || {}) } };
  const {
    isLoading: updatingApplication,
    isError: updateApplicationError,
    data: updateResponse,
    error: updateError,
    mutate,
  } = Digit.Hooks.ws.useWSApplicationActions(filters?.service);

  const getActivationConfig = (cfgData, loading) => {
    const configsToUse = (!loading && cfgData && Array.isArray(cfgData) && cfgData.length > 0) ? cfgData : newConfigLocal;
    if (configsToUse && Array.isArray(configsToUse)) {
      const isCitizen = Digit.UserService.getUser()?.info?.type === "CITIZEN" || window.location.href.includes("/citizen");
      const configObj = configsToUse.find((conf) => conf.hideInCitizen) || configsToUse[0];
      if (configObj && configObj.body) {
        let flattenedBody = [];
        configObj.body.forEach((section) => {
          if (section.body && Array.isArray(section.body)) {
            const mappedSectionBody = section.body.map((item) => {
              if (item.key === "activationDetails") {
                return {
                  ...item,
                  component: "WSActivationDetails",
                };
              }
              if (item.key === "supportingDocuments") {
                return {
                  ...item,
                  isMandatory: true,
                  validation: { required: true },
                };
              }
              return item;
            });
            flattenedBody = [...flattenedBody, ...mappedSectionBody];
          }
        });
        const isActivationStatus =
          filters?.action === "ACTIVATE_CONNECTION" ||
          state?.action === "ACTIVATE_CONNECTION" ||
          initialAppData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
          applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION");

        const currentActionHead =
          !isActivationStatus && (
            filters?.action === "ENTER_METER_DETAILS" ||
            state?.action === "ENTER_METER_DETAILS" ||
            initialAppData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
            applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION")
          )
            ? (t("WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS") && t("WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS") !== "WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS"
                ? "WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS"
                : t("ENTER_METER_DETAILS") && t("ENTER_METER_DETAILS") !== "ENTER_METER_DETAILS"
                ? "ENTER_METER_DETAILS"
                : "Enter Meter Details")
            : "WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION";

        return [
          {
            head: currentActionHead,
            body: flattenedBody,
          },
        ];
      }
    }
    return [];
  };

  const [config, setConfig] = React.useState(() => getActivationConfig(newConfig, isLoading));

  const waterSourceSubDataWithClone = state?.data?.waterSource ? cloneDeep(state?.data?.waterSource) : "";
  const waterSourceSubDataWithUS = waterSourceSubDataWithClone ? stringReplaceAll(waterSourceSubDataWithClone?.toUpperCase(), " ", "_") : "";
  const waterSourceSubDataWithCma = waterSourceSubDataWithUS ? stringReplaceAll(waterSourceSubDataWithUS?.toUpperCase(), ".", "_") : "";
  const connectionDetails =
    filters?.service === "WATER"
      ? {
          connectionType: {
            code: "Metered",
            i18nKey: "WS_CONNECTIONTYPE_METERED",
            name: "Metered",
          },
          waterSource: state?.data?.waterSource || "GROUND.WELL"
            ? {
                code: state?.data?.waterSource || "GROUND.WELL",
                i18nKey: `WS_SERVICES_MASTERS_WATERSOURCE_${stringReplaceAll((state?.data?.waterSource || "GROUND.WELL")?.split(".")[0]?.toUpperCase(), " ", "_")}`,
              }
            : "",
          sourceSubData: state?.data?.waterSource || "GROUND.WELL"
            ? {
                code: state?.data?.waterSource || "GROUND.WELL",
                i18nKey: `WS_SERVICES_MASTERS_WATERSOURCE_${waterSourceSubDataWithCma || "GROUND_WELL"}`,
              }
            : "",
          pipeSize: state?.data?.pipeSize
            ? {
                code: state?.data?.pipeSize,
                i18nKey: state?.data?.pipeSize,
              }
            : 0,
          noOfTaps: state?.data?.noOfTaps !== undefined && state?.data?.noOfTaps !== "" ? state?.data?.noOfTaps : 0,
          proposedPipeSize: 0,
          proposedTaps: 0,
          formDetails: details,
        }
      : {
          noOfWaterClosets: state?.data?.noOfWaterClosets || "",
          noOfToilets: state?.data?.noOfToilets || "",
          formDetails: details,
        };

  const plumberPrefCode =
    state?.data?.additionalDetails?.detailsProvidedBy ||
    (state?.data?.plumberInfo?.[0]?.name ? "Self" : "");
  const defaultPlumberPref =
    plumberPrefCode === "DJB" || plumberPrefCode === "ULB"
      ? { name: "DJB", code: "DJB", i18nKey: "WS_PLUMBER_DJB" }
      : plumberPrefCode === "Self"
      ? { name: "Self", code: "Self", i18nKey: "WS_PLUMBER_SELF" }
      : null;

  const plumberDetails = [
    {
      plumberName: state?.data?.plumberInfo?.[0]?.name || state?.data?.additionalDetails?.plumberName || "",
      plumberMobileNo: state?.data?.plumberInfo?.[0]?.mobileNumber || state?.data?.additionalDetails?.plumberMobileNo || "",
      plumberLicenseNo: state?.data?.plumberInfo?.[0]?.licenseNo || state?.data?.additionalDetails?.plumberLicenseNo || "",
      detailsProvidedBy: defaultPlumberPref,
      jeOrFirmName:
        state?.data?.additionalDetails?.nameOfJEOrFirm ||
        state?.data?.additionalDetails?.jeOrFirmName ||
        state?.data?.nameOfJEOrFirm ||
        "",
      applicationNo: state?.data?.applicationNo,
      key: Date.now(),
    },
  ];

  const isMeteredConn =
    !state?.data?.connectionType ||
    state?.data?.connectionType?.toUpperCase() === "METERED" ||
    state?.data?.connectionType?.toUpperCase() === "PERMANENT" ||
    state?.data?.additionalDetails?.connectionType?.toUpperCase() === "METERED" ||
    state?.data?.additionalDetails?.connectionType?.toUpperCase() === "PERMANENT";

  const defaultMeterMake = state?.data?.meterMake || state?.data?.additionalDetails?.meterMake;
  const defaultMeterSize = state?.data?.meterSize || state?.data?.additionalDetails?.meterSize;
  const defaultFerruleSize = state?.data?.ferruleSize || state?.data?.additionalDetails?.ferruleSize;

  const activationDetails = isMeteredConn
    ? [
        {
          meterMake: defaultMeterMake
            ? typeof defaultMeterMake === "object"
              ? defaultMeterMake
              : meterMakeList.find((m) => m.code === defaultMeterMake || m.name === defaultMeterMake) || { name: defaultMeterMake, code: defaultMeterMake }
            : null,
          meterNo: state?.data?.meterId || state?.data?.additionalDetails?.meterNo || "",
          meterId: state?.data?.meterId || state?.data?.additionalDetails?.meterNo || "",
          meterSize: defaultMeterSize
            ? typeof defaultMeterSize === "object"
              ? defaultMeterSize?.value || defaultMeterSize?.name || defaultMeterSize?.code || ""
              : defaultMeterSize
            : "",
          ferruleSize: defaultFerruleSize
            ? typeof defaultFerruleSize === "object"
              ? defaultFerruleSize?.value || defaultFerruleSize?.name || defaultFerruleSize?.code || ""
              : defaultFerruleSize
            : "",
          meterInstallationDate: state?.data?.meterInstallationDate ? convertEpochToDates(state?.data?.meterInstallationDate) : null,
          meterInitialReading:
            state?.data?.additionalDetails?.initialMeterReading !== undefined &&
            state?.data?.additionalDetails?.initialMeterReading !== null &&
            state?.data?.additionalDetails?.initialMeterReading !== "null"
              ? state?.data?.additionalDetails?.initialMeterReading
              : "0",
          connectionExecutionDate: state?.data?.connectionExecutionDate ? convertEpochToDates(state?.data?.connectionExecutionDate) : null,
        },
      ]
    : [
        {
          connectionExecutionDate: state?.data?.connectionExecutionDate ? convertEpochToDates(state?.data?.connectionExecutionDate) : null,
        },
      ];

  const defaultValues = {
    formDetails: details,
    connectionDetails: [connectionDetails],
    plumberDetails: plumberDetails,
    activationDetails: activationDetails,
  };
  useEffect(() => {
    if (!isappdetailsLoading && details?.applicationData) {
      setAppDetails(details.applicationData);
    }
  }, [isappdetailsLoading, applicationDetails]);

  useEffect(() => {
    const updated = getActivationConfig(newConfig, isLoading);
    if (Array.isArray(updated) && updated.length > 0) {
      setConfig(updated);
    }
  }, [newConfig, isLoading, isappdetailsLoading, applicationDetails]);

  useEffect(() => {
    if (isAppDetailsPage) {
      const isCitizen = Digit.UserService.getUser()?.info?.type === "CITIZEN";
      const basePath = isCitizen ? "/digit-ui/citizen/ws" : "/digit-ui/employee/ws";
      history.push({
        pathname: `${basePath}/ws-response`,
        search: `?applicationNumber=${filters?.applicationNumber}&service=${filters?.service || "WATER"}&action=ACTIVATE_CONNECTION`,
      });
    }
  }, [isAppDetailsPage]);

  const checkCanSubmit = (formData) => {
    // 1. Plumber / JE details check
    const plumberPref =
      formData?.plumberDetails?.[0]?.detailsProvidedBy?.code ||
      formData?.plumberDetails?.[0]?.detailsProvidedBy?.name ||
      formData?.plumberDetails?.[0]?.detailsProvidedBy ||
      "";
    const isDJB =
      plumberPref === "DJB" ||
      plumberPref === "ULB" ||
      plumberPref === "Delhi Jal Board" ||
      (typeof plumberPref === "string" && plumberPref.toLowerCase().includes("djb"));
    const isSelf = !isDJB;

    if (!plumberPref) return false;

    if (isSelf) {
      const pName = formData?.plumberDetails?.[0]?.plumberName;
      const pLic = formData?.plumberDetails?.[0]?.plumberLicenseNo;
      const pMob = formData?.plumberDetails?.[0]?.plumberMobileNo;
      if (!pName || !pName.trim()) return false;
      if (!pLic || !pLic.toString().trim()) return false;
      if (!pMob || !/^[6-9]\d{9}$/.test(pMob.toString().trim())) return false;
    } else if (isDJB) {
      const jeFirm = formData?.plumberDetails?.[0]?.jeOrFirmName;
      if (!jeFirm || !jeFirm.trim()) return false;
    } else {
      return false;
    }

    // 2. Meter details check
    const act = Array.isArray(formData?.activationDetails) ? formData?.activationDetails?.[0] : formData?.activationDetails;
    const meterMake = act?.meterMake?.code || act?.meterMake?.name || act?.meterMake;
    const meterNo = act?.meterNo || act?.meterId;
    const meterSize = act?.meterSize?.value || act?.meterSize?.name || act?.meterSize;
    const ferruleSize = act?.ferruleSize?.value || act?.ferruleSize?.name || act?.ferruleSize;
    const meterInstDate = act?.meterInstallationDate;
    const connExecDate = act?.connectionExecutionDate;

    if (!meterMake) return false;
    if (!meterNo || !meterNo.toString().trim()) return false;
    if (!meterSize || !meterSize.toString().trim()) return false;
    if (!ferruleSize || !ferruleSize.toString().trim()) return false;
    if (!meterInstDate) return false;
    if (!connExecDate) return false;

    // 3. Supporting documents check
    const supDocs = formData?.supportingDocuments;
    const docsList = Array.isArray(supDocs?.documents)
      ? supDocs.documents
      : Array.isArray(supDocs)
      ? supDocs
      : [];

    const meterPhotoId =
      supDocs?.meterPhoto?.fileStoreId ||
      docsList.find((d) => d?.documentType === "METER_PHOTO")?.fileStoreId ||
      supDocs?.[0]?.fileStoreId;

    if (!meterPhotoId) return false;

    if (isSelf) {
      const meterWarrantyId =
        supDocs?.meterWarranty?.fileStoreId ||
        docsList.find((d) => d?.documentType === "METER_WARRANTY_CARD_TESTING_REPORT_INVOICE")?.fileStoreId;
      const plumberDeclId =
        supDocs?.plumberDeclaration?.fileStoreId ||
        docsList.find((d) => d?.documentType === "DECLARATION_OF_LICENSED_PLUMBER")?.fileStoreId;

      if (!meterWarrantyId) return false;
      // Plumber declaration commented out as per requirement
      // if (!plumberDeclId) return false;
    }

    return true;
  };

  const onFormValueChange = (setValue, formData, formState) => {
    const canSub = checkCanSubmit(formData);
    setSubmitValve(canSub);
  };

  const getConvertedDate = (dateOfTime) => {
    if (!dateOfTime) return null;
    if (typeof dateOfTime === "number") return dateOfTime;
    const str = String(dateOfTime).trim();
    if (/^\d+$/.test(str)) return Number(str);

    const ymd = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = parseInt(ymd[2], 10) - 1;
      const day = parseInt(ymd[3], 10);
      return new Date(year, month, day, 23, 59, 59).getTime();
    }
    const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      return new Date(year, month, day, 23, 59, 59).getTime();
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const closeToastOfError = () => {
    setShowToast(null);
  };

  const onSubmit = async (data) => {
    if (!checkCanSubmit(data)) {
      setShowToast({ warning: true, message: "PLEASE_FILL_MANDATORY_DETAILS" });
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return;
    } else {
      const formDetails = cloneDeep(data);
      const baseAppData =
        appDetails?.applicationData ||
        (appDetails?.applicationNo ? appDetails : null) ||
        details?.applicationData ||
        initialAppData ||
        {};
      const formData = cloneDeep(baseAppData);

      if (!formData.additionalDetails) formData.additionalDetails = {};

      if (formDetails?.connectionDetails?.[0]?.connectionType?.code)
        formData.connectionType = formDetails?.connectionDetails?.[0]?.connectionType?.code;
      if (formDetails?.connectionDetails?.[0]?.waterSource?.code) formData.waterSource = formDetails?.connectionDetails?.[0]?.sourceSubData?.code;
      if (formDetails?.connectionDetails?.[0]?.pipeSize?.size) formData.pipeSize = formDetails?.connectionDetails?.[0]?.pipeSize?.size;
      if (formDetails?.connectionDetails?.[0]?.noOfTaps) formData.noOfTaps = formDetails?.connectionDetails?.[0]?.noOfTaps;

      if (formDetails?.connectionDetails?.[0]?.noOfWaterClosets) formData.noOfWaterClosets = formDetails?.connectionDetails?.[0]?.noOfWaterClosets;
      if (formDetails?.connectionDetails?.[0]?.noOfToilets) formData.noOfToilets = formDetails?.connectionDetails?.[0]?.noOfToilets;

      // Handle Plumber / JE details
      const plumberPref =
        formDetails?.plumberDetails?.[0]?.detailsProvidedBy?.code ||
        formDetails?.plumberDetails?.[0]?.detailsProvidedBy?.name ||
        formDetails?.plumberDetails?.[0]?.detailsProvidedBy ||
        data?.plumberDetails?.[0]?.detailsProvidedBy?.code ||
        data?.plumberDetails?.[0]?.detailsProvidedBy?.name ||
        data?.plumberDetails?.[0]?.detailsProvidedBy ||
        "";
      const isDJB =
        plumberPref === "DJB" ||
        plumberPref === "ULB" ||
        plumberPref === "Delhi Jal Board" ||
        (typeof plumberPref === "string" && plumberPref.toLowerCase().includes("djb"));
      const isSelf = !isDJB;

      formData.additionalDetails.detailsProvidedBy = isDJB ? "DJB" : "Self";
      formData.additionalDetails.plumberProvidedBy = isDJB ? "DJB" : "Self";

      if (isSelf) {
        const pName = formDetails?.plumberDetails?.[0]?.plumberName || data?.plumberDetails?.[0]?.plumberName || "";
        const pLic = formDetails?.plumberDetails?.[0]?.plumberLicenseNo || data?.plumberDetails?.[0]?.plumberLicenseNo || "";
        const pMob = formDetails?.plumberDetails?.[0]?.plumberMobileNo || data?.plumberDetails?.[0]?.plumberMobileNo || "";

        formData.plumberInfo = [
          {
            name: pName,
            licenseNo: pLic,
            mobileNumber: pMob,
          },
        ];
        formData.additionalDetails.plumberName = pName;
        formData.additionalDetails.plumberLicenseNo = pLic;
        formData.additionalDetails.plumberMobileNo = pMob;
        formData.additionalDetails.plumberInfo = formData.plumberInfo;
      } else if (isDJB) {
        const jeFirm = formDetails?.plumberDetails?.[0]?.jeOrFirmName || data?.plumberDetails?.[0]?.jeOrFirmName || "";
        formData.plumberInfo = [
          {
            name: jeFirm,
            licenseNo: "",
            mobileNumber: "",
          },
        ];
        formData.additionalDetails.nameOfJEOrFirm = jeFirm;
        formData.additionalDetails.jeOrFirmName = jeFirm;
        formData.nameOfJEOrFirm = jeFirm;
        formData.additionalDetails.plumberInfo = formData.plumberInfo;
      }

      // Handle Meter details
      const actObj = Array.isArray(formDetails?.activationDetails)
        ? formDetails?.activationDetails?.[0]
        : formDetails?.activationDetails || (Array.isArray(data?.activationDetails) ? data?.activationDetails?.[0] : data?.activationDetails);

      const meterMakeVal = actObj?.meterMake?.name || actObj?.meterMake?.code || actObj?.meterMake || "";
      const meterNoVal = actObj?.meterNo || actObj?.meterId || "";
      const meterSizeVal = actObj?.meterSize?.name || actObj?.meterSize?.value || actObj?.meterSize || "";
      const ferruleSizeVal = actObj?.ferruleSize?.name || actObj?.ferruleSize?.value || actObj?.ferruleSize || "";
      const rawReading = actObj?.meterInitialReading;
      const initialReadingVal =
        rawReading !== undefined && rawReading !== null && rawReading !== "" && rawReading !== "null"
          ? (isNaN(Number(rawReading)) ? 0 : Number(rawReading))
          : 0;

      formData.meterId = meterNoVal;
      formData.meterNo = meterNoVal;
      formData.meterMake = meterMakeVal;
      formData.meterSize = meterSizeVal;
      formData.ferruleSize = ferruleSizeVal;
      formData.initialMeterReading = initialReadingVal;

      if (actObj?.meterInstallationDate) {
        formData.meterInstallationDate = getConvertedDate(actObj?.meterInstallationDate);
      }
      if (actObj?.connectionExecutionDate) {
        formData.connectionExecutionDate = getConvertedDate(actObj?.connectionExecutionDate);
      }

      formData.additionalDetails.meterMake = meterMakeVal;
      formData.additionalDetails.meterNo = meterNoVal;
      formData.additionalDetails.meterId = meterNoVal;
      formData.additionalDetails.meterSize = meterSizeVal;
      formData.additionalDetails.ferruleSize = ferruleSizeVal;
      formData.additionalDetails.initialMeterReading = initialReadingVal;
      formData.additionalDetails.meterInstallationDate = formData.meterInstallationDate;
      formData.additionalDetails.connectionExecutionDate = formData.connectionExecutionDate;

      // Extract Documents
      const supDocs = formDetails?.supportingDocuments || data?.supportingDocuments;
      const docsList = Array.isArray(supDocs?.documents)
        ? supDocs.documents
        : Array.isArray(supDocs)
        ? supDocs
        : [];

      const meterPhotoObj =
        supDocs?.meterPhoto ||
        data?.supportingDocuments?.meterPhoto ||
        docsList.find((d) => d?.documentType === "METER_PHOTO") ||
        (Array.isArray(supDocs) ? supDocs[0] : null);

      const meterWarrantyObj =
        supDocs?.meterWarranty ||
        data?.supportingDocuments?.meterWarranty ||
        docsList.find((d) => d?.documentType === "METER_WARRANTY_CARD_TESTING_REPORT_INVOICE");

      const plumberDeclObj =
        supDocs?.plumberDeclaration ||
        data?.supportingDocuments?.plumberDeclaration ||
        docsList.find((d) => d?.documentType === "DECLARATION_OF_LICENSED_PLUMBER");

      const meterPhotoId = meterPhotoObj?.fileStoreId;
      const meterWarrantyId = meterWarrantyObj?.fileStoreId;
      const plumberDeclId = plumberDeclObj?.fileStoreId;

      if (meterPhotoId) {
        formData.additionalDetails.meterPhotoFileStoreId = meterPhotoId;
        formData.additionalDetails.meterPhoto = {
          fileStoreId: meterPhotoId,
          documentType: "METER_PHOTO",
          fileName: meterPhotoObj?.fileName || "Meter_Photo",
        };
      }
      if (meterWarrantyId) {
        formData.additionalDetails.meterWarrantyFileStoreId = meterWarrantyId;
        formData.additionalDetails.meterWarranty = {
          fileStoreId: meterWarrantyId,
          documentType: "METER_WARRANTY_CARD_TESTING_REPORT_INVOICE",
          fileName: meterWarrantyObj?.fileName || "Meter_Warranty_Card_Testing_Report_Invoice",
        };
      }
      if (plumberDeclId) {
        formData.additionalDetails.plumberDeclarationFileStoreId = plumberDeclId;
        formData.additionalDetails.plumberDeclaration = {
          fileStoreId: plumberDeclId,
          documentType: "DECLARATION_OF_LICENSED_PLUMBER",
          fileName: plumberDeclObj?.fileName || "Declaration_Of_Licensed_Plumber",
        };
      }

      const wfDocs = [];
      if (meterPhotoId) {
        wfDocs.push({
          documentType: "METER_PHOTO",
          fileStoreId: meterPhotoId,
          fileName: meterPhotoObj?.fileName || "Meter_Photo",
        });
      }
      if (meterWarrantyId) {
        wfDocs.push({
          documentType: "METER_WARRANTY_CARD_TESTING_REPORT_INVOICE",
          fileStoreId: meterWarrantyId,
          fileName: meterWarrantyObj?.fileName || "Meter_Warranty_Card_Testing_Report_Invoice",
        });
      }
      if (plumberDeclId) {
        wfDocs.push({
          documentType: "DECLARATION_OF_LICENSED_PLUMBER",
          fileStoreId: plumberDeclId,
          fileName: plumberDeclObj?.fileName || "Declaration_Of_Licensed_Plumber",
        });
      }

      if (wfDocs.length === 0 && meterPhotoId) {
        wfDocs.push({
          documentType: "Document - 1",
          fileStoreId: meterPhotoId,
        });
      }

      formData.comment = formDetails?.comments?.comments || "";
      delete formData.comments;

      const isPendingActivation =
        formData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
        baseAppData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
        filters?.action === "ACTIVATE_CONNECTION" ||
        state?.action === "ACTIVATE_CONNECTION";

      const isPendingMeter =
        !isPendingActivation && (
          formData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
          baseAppData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
          filters?.action === "ENTER_METER_DETAILS" ||
          state?.action === "ENTER_METER_DETAILS"
        );

      const currentAction = isPendingActivation ? "ACTIVATE_CONNECTION" : (isPendingMeter ? "ENTER_METER_DETAILS" : (filters?.action || "ACTIVATE_CONNECTION"));

      formData.action = currentAction;
      formData.wfDocuments = wfDocs;
      formData.processInstance = {
        action: currentAction,
        comment: formDetails?.comments?.comments || "",
        documents: wfDocs,
      };

      const existingDocs = Array.isArray(formData.documents)
        ? formData.documents.filter(
            (d) =>
              ![
                "METER_PHOTO",
                "METER_WARRANTY_CARD_TESTING_REPORT_INVOICE",
                "DECLARATION_OF_LICENSED_PLUMBER",
                "Document - 1",
              ].includes(d?.documentType)
          )
        : [];

      formData.documents = [
        ...existingDocs,
        ...wfDocs.map((d) => ({
          documentType: d.documentType,
          fileStoreId: d.fileStoreId,
          documentUid: d.fileStoreId,
          fileName: d.fileName,
          status: "ACTIVE",
        })),
      ];

      const isWater = filters?.service ? filters.service.toUpperCase() === "WATER" : (formData?.serviceType === "WATER" || !formData?.serviceType);
      const isReconnection =
        formData?.applicationType?.includes("RECONNECT") ||
        formData?.applicationNo?.includes("RC");

      if (isWater) {
        formData.waterSource = "GROUND.WELL";
        formData.proposedPipeSize = 0;
        formData.proposedTaps = 0;
        formData.pipeSize = 0;
        formData.noOfTaps = 0;
        formData.connectionType = "Metered";
        if (!formData.additionalDetails) formData.additionalDetails = {};
        formData.additionalDetails.connectionType = "Permanent";
      }

      const reqDetails =
        isWater
          ? isReconnection
            ? { WaterConnection: formData, reconnectRequest: true, disconnectRequest: false }
            : { WaterConnection: formData, reconnectRequest: false, disconnectRequest: false }
          : isReconnection
          ? { SewerageConnection: formData, reconnectRequest: true, disconnectRequest: false }
          : { SewerageConnection: formData, reconnectRequest: false, disconnectRequest: false };

      const targetConn = reqDetails?.WaterConnection || reqDetails?.SewerageConnection;
      if (targetConn) {
        if (isWater) {
          targetConn.waterSource = "GROUND.WELL";
          targetConn.proposedPipeSize = 0;
          targetConn.proposedTaps = 0;
          targetConn.pipeSize = 0;
          targetConn.noOfTaps = 0;
        }
        targetConn.connectionType = "Metered";
        if (!targetConn.additionalDetails) targetConn.additionalDetails = {};
        targetConn.additionalDetails.connectionType = "Permanent";
        targetConn.meterId = formData.meterId;
        targetConn.meterNo = formData.meterNo;
        targetConn.meterMake = formData.meterMake;
        targetConn.meterSize = formData.meterSize;
        targetConn.ferruleSize = formData.ferruleSize;
        targetConn.initialMeterReading =
          formData.initialMeterReading !== undefined &&
          formData.initialMeterReading !== null &&
          formData.initialMeterReading !== "null"
            ? (isNaN(Number(formData.initialMeterReading)) ? 0 : Number(formData.initialMeterReading))
            : 0;
        targetConn.meterInstallationDate = formData.meterInstallationDate;
        targetConn.connectionExecutionDate = formData.connectionExecutionDate;
        targetConn.additionalDetails = {
          ...targetConn.additionalDetails,
          ...formData.additionalDetails,
        };
        targetConn.wfDocuments = formData.wfDocuments;
        targetConn.documents = formData.documents;
        targetConn.processInstance = formData.processInstance;
        targetConn.plumberInfo = formData.plumberInfo;
        if (formData.nameOfJEOrFirm) targetConn.nameOfJEOrFirm = formData.nameOfJEOrFirm;
      }

      if (mutate) {
        mutate(reqDetails, {
          onError: (error, variables) => {
            setShowToast({ key: "error", message: error?.message ? error.message : error });
            setTimeout(closeToastOfError, 5000);
          },
          onSuccess: (data, variables) => {
            setShowToast({ key: false, message: "WS_ACTIVATE_SUCCESS_MESSAGE_MAIN" });
            const activatedConn = data?.WaterConnection?.[0] || data?.SewerageConnections?.[0];
            const connNo = activatedConn?.connectionNo || "";
            const appNo = activatedConn?.applicationNo || filters?.applicationNumber;
            const isCitizen = Digit.UserService.getUser()?.info?.type === "CITIZEN";
            const basePath = isCitizen ? "/digit-ui/citizen/ws" : "/digit-ui/employee/ws";
            setTimeout(() => {
              if (isCitizen && isPendingMeter) {
                history.push(`/digit-ui/citizen/ws/connection/application/${encodeURI(appNo)}`);
              } else {
                history.push({
                  pathname: `${basePath}/ws-response`,
                  search: `?applicationNumber=${appNo}&service=${filters?.service || "WATER"}&connectionNo=${connNo}&action=ACTIVATE_CONNECTION`,
                  state: { connectionNo: connNo, data: data },
                });
              }
            }, 1000);
          },
        });
      }
    }
  };

  const isPendingActivation =
    filters?.action === "ACTIVATE_CONNECTION" ||
    state?.action === "ACTIVATE_CONNECTION" ||
    applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
    initialAppData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
    details?.applicationData?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION") ||
    appDetails?.applicationStatus?.includes("PENDING_FOR_CONNECTION_ACTIVATION");

  const isPendingMeter =
    !isPendingActivation && (
      filters?.action === "ENTER_METER_DETAILS" ||
      state?.action === "ENTER_METER_DETAILS" ||
      applicationDetails?.applicationData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
      initialAppData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
      details?.applicationData?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION") ||
      appDetails?.applicationStatus?.includes("PENDING_FOR_METER_INSTALLATION")
    );

  const getActionLabel = () => {
    if (isPendingActivation) {
      return t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION") && t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION") !== "WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION"
        ? t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION")
        : t("WS_ACTIVATE_CONNECTION") && t("WS_ACTIVATE_CONNECTION") !== "WS_ACTIVATE_CONNECTION"
        ? t("WS_ACTIVATE_CONNECTION")
        : "Activate Connection";
    }
    if (isPendingMeter) {
      const keys = [
        "WF_EMPLOYEE_NEWWS1_ENTER_METER_DETAILS",
        "WF_NEWWS1_ENTER_METER_DETAILS",
        "WF_CS_ENTER_METER_DETAILS",
        "CS_ENTER_METER_DETAILS",
        "WS_ENTER_METER_DETAILS",
        "ENTER_METER_DETAILS",
      ];
      for (const k of keys) {
        const val = t(k);
        if (val && val !== k) return val;
      }
      return "Enter Meter Details";
    }
    return t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION") || "Activate Connection";
  };

  if (isEnableLoader || isLoading || isappdetailsLoading || !Array.isArray(config) || config.length === 0) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={[{ timeLine: [{ actions: getActionLabel(), currentStep: 1 }] }]} showFinalStep={false} />
        <FormComposer
          config={(Array.isArray(config) ? config : []).map((config) => {
            return {
              ...config,
              isCollapsible: true,
              isDefaultOpen: true,
              body: config.body,
            };
          })}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          label={getActionLabel()}
          onFormValueChange={onFormValueChange}
          isDisabled={!canSubmit}
          noBreakLine={true}
          noCard={true}
        />
        {showToast && <Toast error={showToast.key} label={t(showToast?.message)} warning={showToast?.warning} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default ActivateConnection;
