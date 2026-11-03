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

const mapPropertyToFormFields = (property) => {
  if (!property) return { propertyLocationDetails: {}, waterConnection: { useDetails: {} } };
  const addDet = property.additionalDetails || {};
  const usageCategory = addDet.propertyCategory || addDet.usageCategory || property.usageCategory;
  const categoryType = addDet.categoryType || (String(usageCategory).includes("RESIDENTIAL") ? "DOMESTIC" : "NON_DOMESTIC");
  const propertyType = addDet.propertyType || property.propertyType;
  const waterConnectionUsageType = addDet.waterConnectionUsageType || addDet.WaterConnectionUsageType;
  const numberOfFloors = addDet.numberOfFloors || property.noOfFloors;

  const dwellingUnits = String(
    addDet.numberOfDwellingUnits ||
    addDet.noOfDwellingUnits ||
    addDet.NumberofDwellingUnits ||
    property.noOfDwellingUnits ||
    property.numberOfDwellingUnits ||
    ""
  );

  return {
    propertyLocationDetails: {
      ...property.address,
      houseNo: property.address?.doorNo || property.address?.houseNo || "",
      streetName: property.address?.street || property.address?.streetName || "",
      landmark: property.address?.landmark || "",
      addressLine1: property.address?.addressLine1 || property.address?.street || "",
      addressLine2: property.address?.addressLine2 || "",
      city: property.address?.city || "",
      pincode: property.address?.pincode || property.address?.pinCode || "",
      locality: property.address?.locality || null,
      subLocality: property.address?.subLocality || null,
      colonyCategory: property.address?.colonyCategory || "",
      atWhichFloorConsumerResides: addDet.atWhichFloorConsumerResides || "",
      totalNumberOfFloorInTheBuilding: addDet.totalNoOfFloors || addDet.totalFloors || property.address?.totalNoOfFloors || "",
    },
    waterConnection: {
      useDetails: {
        categoryType: categoryType ? { code: categoryType, name: categoryType, i18nKey: `WS_CATEGORY_${categoryType}` } : null,
        propertyCategory: usageCategory ? { code: usageCategory, name: usageCategory, i18nKey: usageCategory } : null,
        propertyType: propertyType ? { code: propertyType, name: propertyType, i18nKey: propertyType } : null,
        WaterConnectionUsageType: waterConnectionUsageType ? { code: waterConnectionUsageType, name: waterConnectionUsageType, value: waterConnectionUsageType } : null,
        noOfFloors: numberOfFloors ? { code: String(numberOfFloors), i18nKey: `PT_NO_OF_FLOORS_${numberOfFloors}` } : null,
        plotArea: String(addDet.plotArea || property.landArea || ""),
        builtUpArea: String(addDet.builtUpArea || property.superBuiltUpArea || ""),
        heightOfTheBuilding: String(addDet.heightOfTheBuilding || property.heightOfTheBuilding || ""),
        farArea: String(addDet.farArea || property.farArea || ""),
        SelectYearofConstruction: addDet.yearOfConstruction ? { value: String(addDet.yearOfConstruction), name: String(addDet.yearOfConstruction) } : null,
        NumberofDwellingUnits: dwellingUnits,
        NumberofRooms: String(addDet.numberOfRooms || addDet.noOfRooms || property.noOfRooms || ""),
        numberOfBeds: String(addDet.numberOfBeds || property.numberOfBeds || ""),
        numberOfStudents: String(addDet.numberOfStudents || property.numberOfStudents || ""),
        servantQuarterArea: String(addDet.numberOfServantQuarters || addDet.servantQuarterArea || property.servantQuarterArea || ""),
        questions: addDet.questions || addDet.questionAnswers || addDet.propertyQuestions || [],
      },
    },
  };
};

const getEditDetails = (waterResult, sewerageresult, t, latestProperty) => {
  if (waterResult) {
    const propToUse = latestProperty || waterResult?.property;
    const propMapped = mapPropertyToFormFields(propToUse);
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
            address: propToUse?.owners?.[0]?.correspondenceAddress,
            documentId: "",
            documentType: "",
            filestoreId: null,
            gender: propToUse?.owners?.[0]?.gender
              ? { code: propToUse?.owners?.[0]?.gender, i18nKey: `COMMON_GENDER_${propToUse?.owners?.[0]?.gender}` }
              : null,
            guardian: propToUse?.owners?.[0]?.fatherOrHusbandName,
            isOwnerSame: waterResult?.connectionHolders ? false : true,
            mobileNumber: propToUse?.owners?.[0]?.mobileNumber,
            name: propToUse?.owners?.[0]?.name,
            relationship: propToUse?.owners?.[0]?.relationship
              ? {
                  code: propToUse?.owners?.[0]?.relationship,
                  i18nKey: `COMMON_MASTERS_OWNERTYPE_${propToUse?.owners?.[0]?.relationship}`,
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
    waterResult.property = propToUse;
    waterResult.WaterConnectionResult = { WaterConnection: [{ ...waterResult, property: propToUse }] };
    waterResult.cpt = { details: { ...propToUse } };
    waterResult.cptId = { id: propToUse?.propertyId || waterResult?.propertyId };
    waterResult.propertyLocationDetails = propMapped.propertyLocationDetails;
    waterResult.waterConnection = propMapped.waterConnection;
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
            address: (latestProperty || sewerageresult?.property)?.owners?.[0]?.correspondenceAddress,
            documentId: "",
            documentType: "",
            filestoreId: null,
            gender: (latestProperty || sewerageresult?.property)?.owners?.[0]?.gender
              ? { code: (latestProperty || sewerageresult?.property)?.owners?.[0]?.gender, i18nKey: `COMMON_GENDER_${(latestProperty || sewerageresult?.property)?.owners?.[0]?.gender}` }
              : null,
            guardian: (latestProperty || sewerageresult?.property)?.owners?.[0]?.fatherOrHusbandName,
            isOwnerSame: sewerageresult?.connectionHolders ? false : true,
            mobileNumber: (latestProperty || sewerageresult?.property)?.owners?.[0]?.mobileNumber,
            name: (latestProperty || sewerageresult?.property)?.owners?.[0]?.name,
            relationship: (latestProperty || sewerageresult?.property)?.owners?.[0]?.relationship
              ? {
                  code: (latestProperty || sewerageresult?.property)?.owners?.[0]?.relationship,
                  i18nKey: `COMMON_MASTERS_OWNERTYPE_${(latestProperty || sewerageresult?.property)?.owners?.[0]?.relationship}`,
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
    const propToUseSewerage = latestProperty || sewerageresult?.property;
    const propMappedSewerage = mapPropertyToFormFields(propToUseSewerage);
    sewerageresult.property = propToUseSewerage;
    sewerageresult.SewerageConnectionResult = { SewerageConnections: [{ ...sewerageresult, property: propToUseSewerage }] };
    sewerageresult.cpt = { details: { ...propToUseSewerage } };
    sewerageresult.cptId = { id: propToUseSewerage?.propertyId || sewerageresult?.propertyId };
    sewerageresult.propertyLocationDetails = propMappedSewerage.propertyLocationDetails;
    sewerageresult.waterConnection = propMappedSewerage.waterConnection;
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

  const propertyId =
    Waterresult?.propertyId ||
    Sewarageresult?.propertyId ||
    params?.propertyId ||
    params?.cptId?.id ||
    params?.cpt?.details?.propertyId;

  const propertyTenantId =
    Waterresult?.property?.tenantId ||
    Sewarageresult?.property?.tenantId ||
    params?.property?.tenantId ||
    params?.cpt?.details?.tenantId ||
    stateId ||
    "dl";

  const { data: ptData } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId: propertyTenantId },
    {
      filters: { propertyIds: propertyId },
      tenantId: propertyTenantId,
      enabled: !!(propertyId && propertyId !== ""),
      privacy: Digit.Utils.getPrivacyObject(),
    }
  );
  const latestProperty = ptData?.Properties?.[0];

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

    const prevProp = params?.cpt?.details || params?.property;
    const isPropertyUpdated =
      latestProperty &&
      (!prevProp ||
        prevProp.propertyId !== latestProperty.propertyId ||
        prevProp.auditDetails?.lastModifiedTime !== latestProperty.auditDetails?.lastModifiedTime ||
        JSON.stringify(prevProp) !== JSON.stringify(latestProperty) ||
        !params?.waterConnection?.useDetails?.NumberofDwellingUnits);

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
      let EditDetails = getEditDetails(waterapplication, sewerageapplication, t, latestProperty);
      setParams(EditDetails);
    } else if (Object.keys(params).length > 0 && (currentApp || latestProperty)) {
      if (isPropertyUpdated) {
        setParams((prevParams) => {
          const propMapped = mapPropertyToFormFields(latestProperty);
          let updatedParams = {
            ...prevParams,
            property: latestProperty,
            cpt: { details: latestProperty },
            cptId: { id: latestProperty.propertyId },
            propertyLocationDetails: {
              ...(propMapped.propertyLocationDetails || {}),
              ...(prevParams?.propertyLocationDetails || {}),
            },
            waterConnection: {
              ...(prevParams?.waterConnection || {}),
              useDetails: {
                ...(propMapped.waterConnection?.useDetails || {}),
                ...(prevParams?.waterConnection?.useDetails || {}),
                NumberofDwellingUnits:
                  propMapped.waterConnection?.useDetails?.NumberofDwellingUnits ||
                  prevParams?.waterConnection?.useDetails?.NumberofDwellingUnits ||
                  "",
                plotArea:
                  propMapped.waterConnection?.useDetails?.plotArea ||
                  prevParams?.waterConnection?.useDetails?.plotArea ||
                  "",
                builtUpArea:
                  propMapped.waterConnection?.useDetails?.builtUpArea ||
                  prevParams?.waterConnection?.useDetails?.builtUpArea ||
                  "",
                heightOfTheBuilding:
                  propMapped.waterConnection?.useDetails?.heightOfTheBuilding ||
                  prevParams?.waterConnection?.useDetails?.heightOfTheBuilding ||
                  "",
              },
            },
          };
          if (updatedParams?.WaterConnectionResult?.WaterConnection?.[0]) {
            updatedParams.WaterConnectionResult.WaterConnection[0].property = latestProperty;
            updatedParams.WaterConnectionResult.WaterConnection[0].propertyId = latestProperty.propertyId;
          }
          if (updatedParams?.SewerageConnectionResult?.SewerageConnections?.[0]) {
            updatedParams.SewerageConnectionResult.SewerageConnections[0].property = latestProperty;
            updatedParams.SewerageConnectionResult.SewerageConnections[0].propertyId = latestProperty.propertyId;
          }
          return updatedParams;
        });
      }
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
  }, [Waterresult, Sewarageresult, latestProperty]);

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
    const existingSig = currentApp?.documents?.find(
      (d) => d?.documentType === "OWNER.SIGNATURE" || d?.documentType?.includes("SIGNATURE")
    );
    const sigFsId =
      params?.additionalDetails?.signatureFileStoreId ||
      params?.additionalDetails?.signature ||
      params?.declarationData?.signatureFileStoreId ||
      existingSig?.fileStoreId;
    if (sigFsId) {
      params.additionalDetails = {
        ...params.additionalDetails,
        signatureFileStoreId: sigFsId,
        signatureFileName: existingSig?.fileName || params?.additionalDetails?.signatureFileName || "signature.png",
        signature: sigFsId,
        signatureFile: { fileStoreId: sigFsId, fileName: existingSig?.fileName || params?.additionalDetails?.signatureFileName || "signature.png" },
      };
      if (params?.documents?.documents && Array.isArray(params.documents.documents)) {
        const hasSig = params.documents.documents.some(
          (d) => d?.documentType === "OWNER.SIGNATURE" || d?.documentType?.includes("SIGNATURE")
        );
        if (!hasSig) {
          params.documents.documents.push({
            documentType: "OWNER.SIGNATURE",
            fileStoreId: sigFsId,
            fileName: existingSig?.fileName || "signature.png",
            documentName: "Signature",
            documentUid: "",
            status: "ACTIVE",
          });
        }
      }
    }
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
    const propToSubmit = latestProperty || params?.cpt?.details || params?.property;
    if (propToSubmit) {
      const propMapped = mapPropertyToFormFields(propToSubmit);
      params.property = propToSubmit;
      params.cpt = { details: propToSubmit };
      params.cptId = { id: propToSubmit?.propertyId };
      params.propertyLocationDetails = {
        ...(propMapped.propertyLocationDetails || {}),
        ...(params.propertyLocationDetails || {}),
      };
      params.waterConnection = {
        ...(params.waterConnection || {}),
        useDetails: {
          ...(propMapped.waterConnection?.useDetails || {}),
          ...(params.waterConnection?.useDetails || {}),
        },
      };
      if (params?.WaterConnectionResult?.WaterConnection?.[0]) {
        params.WaterConnectionResult.WaterConnection[0].property = propToSubmit;
        params.WaterConnectionResult.WaterConnection[0].propertyId = propToSubmit?.propertyId;
      }
      if (params?.SewerageConnectionResult?.SewerageConnections?.[0]) {
        params.SewerageConnectionResult.SewerageConnections[0].property = propToSubmit;
        params.SewerageConnectionResult.SewerageConnections[0].propertyId = propToSubmit?.propertyId;
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
