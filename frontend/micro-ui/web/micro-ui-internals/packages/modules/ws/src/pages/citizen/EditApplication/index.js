import { Loader, VerticalTimeline, SubmitBar, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import { Redirect, Route, Switch, useHistory, useLocation, useParams, useRouteMatch, Link } from "react-router-dom";
import { newConfig as newConfigWS } from "../../../config/wsCreateConfig";
import { getCommencementDataFormat, stringReplaceAll } from "../../../utils/index";

const getPath = (path, params) => {
  params &&
    Object.keys(params).map((key) => {
      path = path.replace(`:${key}`, params[key]);
    });
  return path;
};

const getEditDetails = (waterResult, sewerageresult, t) => {
  if (waterResult) {
    waterResult.ConnectionHolderDetails = waterResult?.connectionHolders
      ? [
          {
            ...waterResult?.connectionHolders?.[0],
            address: waterResult?.connectionHolders?.[0]?.correspondenceAddress,
            documentId: "",
            documentType: "",
            filestoreId: null,
            gender: waterResult?.connectionHolders?.[0]?.gender
              ? { code: waterResult?.connectionHolders?.[0]?.gender, i18nKey: `COMMON_GENDER_${waterResult?.connectionHolders?.[0]?.gender}` }
              : null,
            guardian: waterResult?.connectionHolders?.[0]?.fatherOrHusbandName,
            isOwnerSame: waterResult?.connectionHolders?.length > 0 ? false : true,
            mobileNumber: waterResult?.connectionHolders?.[0]?.mobileNumber,
            isWatsappSameAsMobile:
              waterResult?.connectionHolders?.[0]?.mobileNumber &&
              waterResult?.connectionHolders?.[0]?.mobileNumber === waterResult?.connectionHolders?.[0]?.watsAppMobileNumber
                ? true
                : false,
            name: waterResult?.connectionHolders?.[0]?.name,
            relationship: waterResult?.connectionHolders?.[0]?.relationship
              ? {
                  code: waterResult?.connectionHolders?.[0]?.relationship,
                  i18nKey: `COMMON_MASTERS_OWNERTYPE_${waterResult?.connectionHolders?.[0]?.relationship}`,
                }
              : null,
            specialCategoryType: waterResult?.connectionHolders?.[0]?.ownerType
              ? {
                  code: waterResult?.connectionHolders?.[0]?.ownerType,
                  i18nKey: `PROPERTYTAX_OWNERTYPE_${waterResult?.connectionHolders?.[0]?.ownerType}`,
                }
              : "",
          },
        ]
      : [
          {
            address: waterResult?.property?.owners?.[0]?.correspondenceAddress,
            documentId: "",
            documentType: "",
            filestoreId: null,
            gender: waterResult?.property?.owners?.[0]?.gender
              ? { code: waterResult?.property?.owners?.[0]?.gender, i18nKey: `COMMON_GENDER_${waterResult?.property?.owners?.[0]?.gender}` }
              : null,
            guardian: waterResult?.property?.owners?.[0]?.fatherOrHusbandName,
            isOwnerSame: waterResult?.connectionHolders ? false : true,
            mobileNumber: waterResult?.property?.owners?.[0]?.mobileNumber,
            name: waterResult?.property?.owners?.[0]?.name,
            relationship: waterResult?.property?.owners?.[0]?.relationship
              ? {
                  code: waterResult?.property?.owners?.[0]?.relationship,
                  i18nKey: `COMMON_MASTERS_OWNERTYPE_${waterResult?.property?.owners?.[0]?.relationship}`,
                }
              : null,
            specialCategoryType: waterResult?.connectionHolders?.[0]?.ownerType
              ? {
                  code: waterResult?.connectionHolders?.[0]?.ownerType,
                  i18nKey: `PROPERTYTAX_OWNERTYPE_${waterResult?.connectionHolders?.[0]?.ownerType}`,
                }
              : "",
          },
        ];
    waterResult.WaterConnectionResult = { WaterConnection: [{ ...waterResult }] };
    waterResult.cpt = { details: { ...waterResult?.property } };
    waterResult.cptId = { id: waterResult?.propertyId };
    waterResult.DocumentsRequired = { documents: waterResult?.documents || [] };
    waterResult.plumberPreference = { plumberPreference: { code: "ULB", i18nKey: "WS_I_WOULD_PREFER_FROM_MUNICIPAL_OFFICE" } };
    waterResult.serviceName = waterResult?.applicationType?.includes("WATER")
      ? { code: "WATER", i18nKey: "WS_WATER_CONNECTION_ONLY" }
      : { code: "SEWERAGE", i18nKey: "WS_SEWERAGE_CONNECTION_ONLY" };
    waterResult.waterConectionDetails = {
      proposedPipeSize: {
        code: waterResult?.proposedPipeSize,
        i18nKey: `${waterResult?.proposedPipeSize} ${t("WS_INCHES_LABEL")}`,
        size: waterResult?.proposedPipeSize,
      },
      proposedTaps: waterResult?.proposedTaps,
    };
    const rawAddressType =
      waterResult?.additionalDetails?.addressType ||
      waterResult?.ConnectionDetails?.[0]?.addressType ||
      waterResult?.addressType;
    const addressTypeObj =
      typeof rawAddressType === "object" && rawAddressType?.code
        ? rawAddressType
        : String(rawAddressType).toUpperCase() === "PERMANENT"
        ? { i18nKey: "Permanent", code: "PERMANENT" }
        : String(rawAddressType).toUpperCase() === "CORRESPONDENCE"
        ? { i18nKey: "Correspondence", code: "CORRESPONDENCE" }
        : rawAddressType
        ? { i18nKey: rawAddressType, code: rawAddressType }
        : null;

    const completeAddressStr =
      waterResult?.additionalDetails?.completeAddress ||
      waterResult?.ConnectionDetails?.[0]?.completeAddress ||
      waterResult?.completeAddress ||
      "";

    waterResult.ConnectionDetails = [
      {
        water: true,
        sewerage: false,
        serviceType: { code: "WATER", i18nKey: "WS_APPLICATION_TYPE_WATER" },
        connectionType: waterResult?.connectionType
          ? { code: waterResult?.connectionType, i18nKey: `WS_CONNECTION_${waterResult?.connectionType}` }
          : null,
        waterDemandType: waterResult?.additionalDetails?.waterDemandType
          ? { code: waterResult?.additionalDetails?.waterDemandType, i18nKey: `WS_WATER_DEMAND_${waterResult?.additionalDetails?.waterDemandType}` }
          : null,
        applicantType: waterResult?.additionalDetails?.applicantType
          ? { code: waterResult?.additionalDetails?.applicantType, i18nKey: `WS_APPLICANT_${waterResult?.additionalDetails?.applicantType}` }
          : null,
        categoryType: waterResult?.additionalDetails?.categoryType
          ? { code: waterResult?.additionalDetails?.categoryType, i18nKey: `WS_CATEGORY_${waterResult?.additionalDetails?.categoryType}` }
          : null,
        addressType: addressTypeObj,
        completeAddress: completeAddressStr,
        proposedPipeSize: waterResult?.proposedPipeSize
          ? {
              code: waterResult?.proposedPipeSize,
              i18nKey: `${waterResult?.proposedPipeSize} ${t("WS_INCHES_LABEL")}`,
              size: waterResult?.proposedPipeSize,
            }
          : null,
        proposedTaps: waterResult?.proposedTaps,
      },
    ];
    waterResult.addressType = addressTypeObj;
    waterResult.completeAddress = completeAddressStr;
    waterResult.bankDetails = {
      bankName: waterResult?.additionalDetails?.bankName || "",
      bankBranchName: waterResult?.additionalDetails?.bankBranchName || waterResult?.additionalDetails?.branchName || "",
      ifscCode: waterResult?.additionalDetails?.ifscCode || "",
      accountNumber: waterResult?.additionalDetails?.bankAccountNumber || waterResult?.additionalDetails?.accountNumber || "",
      confirmAccountNumber:
        waterResult?.additionalDetails?.confirmAccountNumber ||
        waterResult?.additionalDetails?.bankAccountNumber ||
        waterResult?.additionalDetails?.accountNumber ||
        "",
      accountHolderName: waterResult?.additionalDetails?.accountHolderName || waterResult?.additionalDetails?.ownerName || "",
    };
    waterResult.djbEmployee = {
      isDjbEmployee: String(waterResult?.additionalDetails?.isDjbEmployee) === "true",
      employeeId: waterResult?.additionalDetails?.employeeId || "",
      designation: waterResult?.additionalDetails?.designation || "",
      dor: waterResult?.additionalDetails?.dor || waterResult?.additionalDetails?.dorDate || "",
      document: waterResult?.additionalDetails?.document || "",
    };
  } else if (sewerageresult) {
    sewerageresult.ConnectionHolderDetails = sewerageresult?.connectionHolders
      ? [
          {
            ...sewerageresult?.connectionHolders?.[0],
            address: sewerageresult?.connectionHolders?.[0]?.correspondenceAddress,
            documentId: "",
            documentType: "",
            filestoreId: null,
            gender: sewerageresult?.connectionHolders?.[0]?.gender
              ? { code: sewerageresult?.connectionHolders?.[0]?.gender, i18nKey: `COMMON_GENDER_${sewerageresult?.connectionHolders?.[0]?.gender}` }
              : null,
            guardian: sewerageresult?.connectionHolders?.[0]?.fatherOrHusbandName,
            isOwnerSame: sewerageresult?.connectionHolders?.length > 0 ? false : true,
            mobileNumber: sewerageresult?.connectionHolders?.[0]?.mobileNumber,
            isWatsappSameAsMobile:
              sewerageresult?.connectionHolders?.[0]?.mobileNumber &&
              sewerageresult?.connectionHolders?.[0]?.mobileNumber === sewerageresult?.connectionHolders?.[0]?.watsAppMobileNumber
                ? true
                : false,
            name: sewerageresult?.connectionHolders?.[0]?.name,
            relationship: sewerageresult?.connectionHolders?.[0]?.relationship
              ? {
                  code: sewerageresult?.connectionHolders?.[0]?.relationship,
                  i18nKey: `COMMON_MASTERS_OWNERTYPE_${sewerageresult?.connectionHolders?.[0]?.relationship}`,
                }
              : null,
            specialCategoryType: sewerageresult?.connectionHolders?.[0]?.ownerType
              ? {
                  code: sewerageresult?.connectionHolders?.[0]?.ownerType,
                  i18nKey: `PROPERTYTAX_OWNERTYPE_${sewerageresult?.connectionHolders?.[0]?.ownerType}`,
                }
              : "",
          },
        ]
      : [
          {
            address: sewerageresult?.property?.owners?.[0]?.correspondenceAddress,
            documentId: "",
            documentType: "",
            filestoreId: null,
            gender: sewerageresult?.property?.owners?.[0]?.gender
              ? { code: sewerageresult?.property?.owners?.[0]?.gender, i18nKey: `COMMON_GENDER_${sewerageresult?.property?.owners?.[0]?.gender}` }
              : null,
            guardian: sewerageresult?.property?.owners?.[0]?.fatherOrHusbandName,
            isOwnerSame: sewerageresult?.connectionHolders ? false : true,
            mobileNumber: sewerageresult?.property?.owners?.[0]?.mobileNumber,
            name: sewerageresult?.property?.owners?.[0]?.name,
            relationship: sewerageresult?.property?.owners?.[0]?.relationship
              ? {
                  code: sewerageresult?.property?.owners?.[0]?.relationship,
                  i18nKey: `COMMON_MASTERS_OWNERTYPE_${sewerageresult?.property?.owners?.[0]?.relationship}`,
                }
              : null,
            specialCategoryType: sewerageresult?.connectionHolders?.[0]?.ownerType
              ? {
                  code: sewerageresult?.connectionHolders?.[0]?.ownerType,
                  i18nKey: `PROPERTYTAX_OWNERTYPE_${sewerageresult?.connectionHolders?.[0]?.ownerType}`,
                }
              : "",
          },
        ];
    sewerageresult.SewerageConnectionResult = { SewerageConnections: [{ ...sewerageresult }] };
    sewerageresult.cpt = { details: { ...sewerageresult?.property } };
    sewerageresult.cptId = { id: sewerageresult?.propertyId };
    sewerageresult.DocumentsRequired = { documents: sewerageresult?.documents || [] };
    sewerageresult.plumberPreference = { plumberPreference: { code: "ULB", i18nKey: "WS_I_WOULD_PREFER_FROM_MUNICIPAL_OFFICE" } };
    sewerageresult.serviceName = sewerageresult?.applicationType.includes("WATER")
      ? { code: "WATER", i18nKey: "WS_WATER_CONNECTION_ONLY" }
      : { code: "SEWERAGE", i18nKey: "WS_SEWERAGE_CONNECTION_ONLY" };
    sewerageresult.sewerageConnectionDetails = {
      proposedToilets: sewerageresult?.proposedToilets,
      proposedWaterClosets: sewerageresult?.proposedWaterClosets,
    };
    const rawAddressTypeSewerage =
      sewerageresult?.additionalDetails?.addressType ||
      sewerageresult?.ConnectionDetails?.[0]?.addressType ||
      sewerageresult?.addressType;
    const addressTypeObjSewerage =
      typeof rawAddressTypeSewerage === "object" && rawAddressTypeSewerage?.code
        ? rawAddressTypeSewerage
        : String(rawAddressTypeSewerage).toUpperCase() === "PERMANENT"
        ? { i18nKey: "Permanent", code: "PERMANENT" }
        : String(rawAddressTypeSewerage).toUpperCase() === "CORRESPONDENCE"
        ? { i18nKey: "Correspondence", code: "CORRESPONDENCE" }
        : rawAddressTypeSewerage
        ? { i18nKey: rawAddressTypeSewerage, code: rawAddressTypeSewerage }
        : null;

    const completeAddressStrSewerage =
      sewerageresult?.additionalDetails?.completeAddress ||
      sewerageresult?.ConnectionDetails?.[0]?.completeAddress ||
      sewerageresult?.completeAddress ||
      "";

    sewerageresult.ConnectionDetails = [
      {
        water: false,
        sewerage: true,
        serviceType: { code: "SEWERAGE", i18nKey: "WS_APPLICATION_TYPE_SEWERAGE" },
        connectionType: sewerageresult?.connectionType
          ? { code: sewerageresult?.connectionType, i18nKey: `WS_CONNECTION_${sewerageresult?.connectionType}` }
          : { code: "Non Metered", i18nKey: "WS_CONNECTION_Non Metered" },
        waterDemandType: sewerageresult?.additionalDetails?.waterDemandType
          ? {
              code: sewerageresult?.additionalDetails?.waterDemandType,
              i18nKey: `WS_WATER_DEMAND_${sewerageresult?.additionalDetails?.waterDemandType}`,
            }
          : null,
        applicantType: sewerageresult?.additionalDetails?.applicantType
          ? { code: sewerageresult?.additionalDetails?.applicantType, i18nKey: `WS_APPLICANT_${sewerageresult?.additionalDetails?.applicantType}` }
          : null,
        categoryType: sewerageresult?.additionalDetails?.categoryType
          ? { code: sewerageresult?.additionalDetails?.categoryType, i18nKey: `WS_CATEGORY_${sewerageresult?.additionalDetails?.categoryType}` }
          : null,
        addressType: addressTypeObjSewerage,
        completeAddress: completeAddressStrSewerage,
        proposedToilets: sewerageresult?.proposedToilets,
        proposedWaterClosets: sewerageresult?.proposedWaterClosets,
      },
    ];
    sewerageresult.addressType = addressTypeObjSewerage;
    sewerageresult.completeAddress = completeAddressStrSewerage;
    sewerageresult.bankDetails = {
      bankName: sewerageresult?.additionalDetails?.bankName || "",
      bankBranchName: sewerageresult?.additionalDetails?.bankBranchName || sewerageresult?.additionalDetails?.branchName || "",
      ifscCode: sewerageresult?.additionalDetails?.ifscCode || "",
      accountNumber: sewerageresult?.additionalDetails?.bankAccountNumber || sewerageresult?.additionalDetails?.accountNumber || "",
      confirmAccountNumber:
        sewerageresult?.additionalDetails?.confirmAccountNumber ||
        sewerageresult?.additionalDetails?.bankAccountNumber ||
        sewerageresult?.additionalDetails?.accountNumber ||
        "",
      accountHolderName: sewerageresult?.additionalDetails?.accountHolderName || sewerageresult?.additionalDetails?.ownerName || "",
    };
    sewerageresult.djbEmployee = {
      isDjbEmployee: String(sewerageresult?.additionalDetails?.isDjbEmployee) === "true",
      employeeId: sewerageresult?.additionalDetails?.employeeId || "",
      designation: sewerageresult?.additionalDetails?.designation || "",
      dor: sewerageresult?.additionalDetails?.dor || sewerageresult?.additionalDetails?.dorDate || "",
      document: sewerageresult?.additionalDetails?.document || "",
    };
  }

  if (waterResult) return { ...waterResult };
  else return { ...sewerageresult };
};

const EditApplication = ({ parentRoute }) => {
  const queryClient = useQueryClient();
  let match = useRouteMatch();
  const { t } = useTranslation();
  let { tenantId: tenantIdFromUrl } = useParams();
  const searchParams = new URLSearchParams(useLocation().search);
  const applicationNumberParam = searchParams.get("applicationNumber");
  let tenantId = tenantIdFromUrl || searchParams.get("tenantId") || Digit.ULBService.getCurrentTenantId();
  const { pathname, state } = useLocation();
  const history = useHistory();
  let applicationNumber = applicationNumberParam || state?.id || sessionStorage.getItem("ApplicationNoState");
  let config = [];
  let waterapplication = {};
  let sewerageapplication = {};
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage("WS_EDIT_APPLICATION_V5", {});

  let initialConfig = [];
  newConfigWS?.forEach((obj) => {
    if (!obj.hideInCitizen) {
      initialConfig = initialConfig.concat(obj.body.filter((a) => !a.hideInCitizen));
    }
  });

  const stateId = Digit.ULBService.getStateId();
  let { data: newConfig, isLoading: configLoading } = Digit.Hooks.ws.useWSConfigMDMS.getFormConfig(stateId, {});

  let filter1 = {};

  if (applicationNumber) filter1.applicationNumber = applicationNumber;
  if (tenantId) filter1.tenantId = tenantId;

  //filter1 = {tenantId: tenantId, applicationNumber: applicationNobyData }
  const { data: Waterresult } = Digit.Hooks.ws.useWaterSearch(
    { tenantId, filters: { ...filter1, isInternalCall: true }, BusinessService: "WS", t },
    { enabled: applicationNumber && applicationNumber.includes("WS") ? true : false }
  );
  const { data: Sewarageresult } = Digit.Hooks.ws.useSewarageSearch(
    { tenantId, filters: { ...filter1, isInternalCall: true }, BusinessService: "SW", t },
    { enabled: applicationNumber && applicationNumber.includes("SW") ? true : false }
  );
  let isModifyEdit = window.location.href.includes("/modify-connection") || window.location.href.includes("/edit-application");

  useEffect(() => {
    if (window.location.href.includes("/acknowledgement")) {
      return;
    }
    waterapplication = Waterresult;
    sewerageapplication = Sewarageresult;
    const currentApp = waterapplication || sewerageapplication;
    const currentAppNo = currentApp?.applicationNo;
    const isAppLoaded = !!currentAppNo;
    const isDifferentApp = params?.applicationNo && currentAppNo && params?.applicationNo !== currentAppNo;
    const isNotHydrated = !(Object.keys(params).length > 0) || !params?.DocumentsRequired;

    const isSatisfiedChanged =
      currentApp?.additionalDetails?.CompletelySatisfied !== undefined &&
      params?.additionalDetails?.CompletelySatisfied !== undefined &&
      params?.additionalDetails?.CompletelySatisfied !== currentApp?.additionalDetails?.CompletelySatisfied;

    const isAuditChanged =
      currentApp?.auditDetails?.lastModifiedTime &&
      params?.auditDetails?.lastModifiedTime &&
      params?.auditDetails?.lastModifiedTime !== currentApp?.auditDetails?.lastModifiedTime;

    const isStatusChanged =
      currentApp?.applicationStatus &&
      params?.applicationStatus &&
      params?.applicationStatus !== currentApp?.applicationStatus;

    if (
      isAppLoaded &&
      (isNotHydrated || isDifferentApp || isSatisfiedChanged || isAuditChanged || isStatusChanged)
    ) {
      if (window.location.href.includes("edit-application")) {
        if (waterapplication) {
          waterapplication.isEditApplication = true;
          waterapplication.isModifyConnection = false;
        }
        if (sewerageapplication) {
          sewerageapplication.isEditApplication = true;
          sewerageapplication.isModifyConnection = false;
        }
      } else if (window.location.href.includes("modify-connection")) {
        if (waterapplication) {
          waterapplication.isModifyConnection = true;
          waterapplication.isEditApplication = false;
        }
        if (sewerageapplication) {
          sewerageapplication.isModifyConnection = true;
          sewerageapplication.isEditApplication = false;
        }
      }
      sessionStorage.setItem("WaterInitialObject", JSON.stringify({ ...waterapplication }));
      sessionStorage.setItem("SewerageInitialObject", JSON.stringify({ ...sewerageapplication }));
      let EditDetails = getEditDetails(waterapplication, sewerageapplication, t);
      setParams(EditDetails);
    } else if (Object.keys(params).length > 0 && currentApp) {
      const addrType = currentApp?.additionalDetails?.addressType || currentApp?.ConnectionDetails?.[0]?.addressType || currentApp?.addressType;
      const compAddr = currentApp?.additionalDetails?.completeAddress || currentApp?.ConnectionDetails?.[0]?.completeAddress || currentApp?.completeAddress;
      const needsAddressSync =
        (!params?.ConnectionDetails?.[0]?.addressType && addrType) ||
        (!params?.ConnectionDetails?.[0]?.completeAddress && compAddr);
      const needsDueSync =
        currentApp && currentApp.dueVerification && JSON.stringify(currentApp.dueVerification) !== JSON.stringify(params.dueVerification);

      const backendSatisfied = currentApp?.additionalDetails?.CompletelySatisfied;
      const needsSatisfiedSync =
        backendSatisfied !== undefined && params?.additionalDetails?.CompletelySatisfied !== backendSatisfied;

      if (needsAddressSync || needsDueSync || needsSatisfiedSync) {
        setParams((prevParams) => {
          let updatedParams = { ...prevParams };
          if (needsAddressSync) {
            const addrTypeObj =
              typeof addrType === "object" && addrType?.code
                ? addrType
                : String(addrType).toUpperCase() === "PERMANENT"
                ? { i18nKey: "Permanent", code: "PERMANENT" }
                : String(addrType).toUpperCase() === "CORRESPONDENCE"
                ? { i18nKey: "Correspondence", code: "CORRESPONDENCE" }
                : addrType
                ? { i18nKey: addrType, code: addrType }
                : null;
            const updatedConnDetails = prevParams?.ConnectionDetails
              ? [
                  {
                    ...prevParams.ConnectionDetails[0],
                    addressType: prevParams.ConnectionDetails[0]?.addressType || addrTypeObj,
                    completeAddress: prevParams.ConnectionDetails[0]?.completeAddress || compAddr || "",
                  },
                ]
              : [
                  {
                    addressType: addrTypeObj,
                    completeAddress: compAddr || "",
                  },
                ];
            updatedParams.ConnectionDetails = updatedConnDetails;
            updatedParams.addressType = updatedParams.addressType || addrTypeObj;
            updatedParams.completeAddress = updatedParams.completeAddress || compAddr || "";
          }
          if (needsDueSync) {
            updatedParams.dueVerification = currentApp.dueVerification;
          }
          if (needsSatisfiedSync) {
            updatedParams.additionalDetails = {
              ...updatedParams.additionalDetails,
              CompletelySatisfied: backendSatisfied,
            };
            if (updatedParams?.WaterConnectionResult?.WaterConnection?.[0]) {
              updatedParams.WaterConnectionResult.WaterConnection[0].additionalDetails = {
                ...updatedParams.WaterConnectionResult.WaterConnection[0]?.additionalDetails,
                CompletelySatisfied: backendSatisfied,
              };
            }
            if (updatedParams?.SewerageConnectionResult?.SewerageConnections?.[0]) {
              updatedParams.SewerageConnectionResult.SewerageConnections[0].additionalDetails = {
                ...updatedParams.SewerageConnectionResult.SewerageConnections[0]?.additionalDetails,
                CompletelySatisfied: backendSatisfied,
              };
            }
          }
          return updatedParams;
        });
      }
    }
  }, [Waterresult, Sewarageresult]);

  // Stepper navigation removed for long form implementation
  const onSuccess = () => {
    queryClient.invalidateQueries("WS_CREATE");
    sessionStorage.removeItem("WS_EDIT_APPLICATION_V5");
    sessionStorage.removeItem("WaterInitialObject");
    sessionStorage.removeItem("SewerageInitialObject");
  };
  const createApplication = async () => {
    if (params?.DocumentsRequired?.documents) {
      params.documents = { documents: params.DocumentsRequired.documents };
    }
    const currentApp = Waterresult || Sewarageresult;
    const backendSatisfied = currentApp?.additionalDetails?.CompletelySatisfied;
    if (backendSatisfied !== undefined) {
      params.additionalDetails = {
        ...params.additionalDetails,
        CompletelySatisfied: backendSatisfied,
      };
      if (params?.WaterConnectionResult?.WaterConnection?.[0]) {
        params.WaterConnectionResult.WaterConnection[0].additionalDetails = {
          ...params.WaterConnectionResult.WaterConnection[0]?.additionalDetails,
          CompletelySatisfied: backendSatisfied,
        };
      }
      if (params?.SewerageConnectionResult?.SewerageConnections?.[0]) {
        params.SewerageConnectionResult.SewerageConnections[0].additionalDetails = {
          ...params.SewerageConnectionResult.SewerageConnections[0]?.additionalDetails,
          CompletelySatisfied: backendSatisfied,
        };
      }
    }
    history.push(`${getPath(match.path, match.params)}/acknowledgement`);
  };

  const handleSelect = (key, data, skipStep, isFromCreateApi) => {
    if (isFromCreateApi) setParams(data);
    else if (key === "") setParams((prev) => ({ ...prev, ...data }));
    else if (Array.isArray(data)) setParams((prev) => ({ ...prev, [key]: data }));
    else if (key === "djbEmployee") {
      setParams((prev) => {
        const isEmp = String(data?.isDjbEmployee) === "true" || data?.isDjbEmployee === true;
        return {
          ...prev,
          djbEmployee: {
            ...prev?.djbEmployee,
            ...data,
            isDjbEmployee: isEmp,
            employeeId: isEmp ? (data?.employeeId ?? "") : "",
            designation: isEmp ? (data?.designation ?? "") : "",
            dor: isEmp ? (data?.dor ?? "") : "",
            document: isEmp ? (data?.document?.fileStoreId || data?.document || "") : "",
          },
          additionalDetails: {
            ...prev?.additionalDetails,
            ...data,
            isDjbEmployee: isEmp,
            employeeId: isEmp ? (data?.employeeId ?? "") : "",
            designation: isEmp ? (data?.designation ?? "") : "",
            dor: isEmp ? (data?.dor ?? "") : "",
            document: isEmp ? (data?.document?.fileStoreId || data?.document || "") : "",
          },
        };
      });
    } else {
      setParams((prev) => ({
        ...prev,
        [key]: { ...prev?.[key], ...data },
      }));
    }
  };
  const handleSkip = () => {};
  newConfig = newConfigWS; // Override MDMS config with local config to ensure property-location-details change takes effect
  newConfig?.forEach((obj) => {
    if (!obj.hideInCitizen) {
      config = config.concat(obj.body.filter((a) => !a.hideInCitizen));
    }
  });

  // Exclude property-details so it starts from connection-details as requested
  const startIndex = config.findIndex((c) => c.route === "connection-details");
  if (startIndex !== -1) {
    config = config.slice(startIndex);
  }

  // Filter out informational/summary steps that are unnecessary in a long form
  config = config.filter((c) => c.route !== "docsrequired" && c.route !== "check");

  // Reorder and modify steps for the specific layout requested
  const desiredOrder = [
    "connection-details",
    "connection-holder",
    "djb-employee-details",
    "disability-details",
    "property-location-details",
    "property-water-details",
    "due-verification-details",
    "document-details",
  ];

  let sortedConfig = [];
  desiredOrder.forEach((route) => {
    const found = config.find((c) => c.route === route);
    if (found) {
      sortedConfig.push(found);
    }
  });

  // Add any remaining steps that were not in desiredOrder
  config.forEach((c) => {
    if (!sortedConfig.find((sc) => sc.route === c.route)) {
      sortedConfig.push(c);
    }
  });

  config = sortedConfig;

  // Swap WSDocumentDetails with WSDocumentsEmployee for proper form integration
  config.forEach((c) => {
    if (c.component === "WSDocumentDetails") {
      c.component = "WSDocumentsEmployee";
      c.key = "DocumentsRequired";
    }
  });

  config = config.map((routeObj, index) => ({
    ...routeObj,
    timeLine: [
      {
        currentStep: index + 1,
        actions: routeObj.texts?.header || routeObj.route,
      },
    ],
  }));

  if (
    (((Waterresult && Object.keys(Waterresult).length > 0) || !Sewarageresult) && Waterresult?.isLoading) ||
    Sewarageresult?.isLoading ||
    configLoading ||
    Object.keys(params).length === 0 ||
    !params?.DocumentsRequired // Ensure params are hydrated
  ) {
    return <Loader />;
  }
  const Acknowledgement = Digit?.ComponentRegistryService?.getComponent("WSAcknowledgement");

  return (
    <Switch>
      <Route path={`${getPath(match.path, match.params)}/acknowledgement`}>
        <Acknowledgement data={params} onSuccess={onSuccess} clearParams={clearParams} />
      </Route>
      <Route>
        <div className="citizen-single-screen-edit">
          <style>{`
            .citizen-single-screen-edit .timeline-container { display: none !important; }
            .citizen-single-screen-edit .form-step-footer { display: none !important; }
          `}</style>
          <div style={{ display: "flex", flexDirection: "row", gap: "24px", alignItems: "flex-start", marginBottom: "2rem" }}>
            {/* 
            <div style={{ flex: "0 0 280px", position: "sticky", top: "100px", height: "calc(100vh - 100px)", overflowY: "auto" }}>
              <VerticalTimeline 
                config={config} 
                currentActiveIndex={0} 
                onSelect={(route, index) => {
                   document.getElementById(`step-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            </div>
            */}
            <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "24px" }}>
              {config.map((routeObj, index) => {
                const { component, texts, inputs, key, isSkipEnabled } = routeObj;
                const Component = typeof component === "string" ? Digit.ComponentRegistryService.getComponent(component) : component;
                return (
                  <div id={`step-${index}`} key={routeObj.route || index}>
                    <Component
                      key={routeObj.route || index}
                      config={{ texts, inputs, key, isSkipEnabled }}
                      onSelect={handleSelect}
                      onSkip={handleSkip}
                      t={t}
                      formData={params}
                      userType={"employee"}
                    />
                  </div>
                );
              })}
              <div>
                <SubmitBar label={t("SUBMIT")} onSubmit={createApplication} />
              </div>
            </div>
          </div>
        </div>
      </Route>
    </Switch>
  );
};

export default EditApplication;
