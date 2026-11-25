import { FormComposer, Loader, Toast, VerticalTimeline } from "@djb25/digit-ui-react-components";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { newConfig } from "../../config/Create/config";
import _ from "lodash";

/**
 * Maps a raw property object (from API) into the formData shape
 * expected by createForm / FormComposer.
 *
 * KEY: PropertyLocationDetails reads from formData.cpt.details (the raw property),
 *      so we must pass cpt.details = property directly.
 *      PropertyWaterConnection reads from formData[config.key] = formData.waterConnection.
 */
const mapPropertyToFormData = (property = {}) => {
  const addr = property.address || {};
  const addDet = property.additionalDetails || {};
  const getCode = (value) => (typeof value === "object" ? value?.code || value?.value : value);
  const usageCategory = getCode(addDet.propertyCategory || addDet.usageCategory || property.usageCategory);
  const propertyType = getCode(addDet.propertyType || property.propertyType);
  const categoryType = getCode(addDet.categoryType) || (String(usageCategory).includes("RESIDENTIAL") ? "DOMESTIC" : "NON_DOMESTIC");
  const waterConnectionUsageType = getCode(addDet.waterConnectionUsageType || addDet.WaterConnectionUsageType);
  const numberOfFloors = getCode(addDet.numberOfFloors || addDet.noOfFloors || property.noOfFloors);

  // ---- water-connection / proposed-usage section ----
  // PropertyWaterConnection initializes useForm with formData[config.key] = formData.waterConnection
  const useDetails = {
    categoryType: categoryType
      ? { code: categoryType, i18nKey: `WS_CATEGORY_${categoryType}` }
      : null,
    propertyCategory: usageCategory
      ? { code: usageCategory, i18nKey: `PROPERTYTAX_BILLING_SLAB_${usageCategory?.split(".")?.pop()}` }
      : null,
    propertyType: propertyType
      ? { code: propertyType, i18nKey: `PROPERTYTAX_BILLING_SLAB_${propertyType?.split(".")?.pop()}` }
      : null,
    WaterConnectionUsageType: waterConnectionUsageType
      ? { code: waterConnectionUsageType, i18nKey: `WS_SERVICES_MASTERS_WSCAT_${waterConnectionUsageType}` }
      : null,
    noOfFloors: numberOfFloors
      ? { code: String(numberOfFloors), i18nKey: `PT_NO_OF_FLOORS_${numberOfFloors}` }
      : null,
    plotArea: String(addDet.plotArea || property.landArea || ""),
    builtUpArea: String(addDet.builtUpArea || property.superBuiltUpArea || ""),
    heightOfTheBuilding: String(addDet.heightOfTheBuilding || property.heightOfTheBuilding || ""),
    farArea: String(addDet.farArea || property.farArea || ""),
    SelectYearofConstruction: addDet.yearOfConstruction
      ? { value: String(addDet.yearOfConstruction), label: String(addDet.yearOfConstruction) }
      : null,
    NumberofDwellingUnits: String(addDet.numberOfDwellingUnits || ""),
    NumberofRooms: String(addDet.numberOfRooms || ""),
    numberOfBeds: String(addDet.numberOfBeds || ""),
    numberOfStudents: String(addDet.numberOfStudents || ""),
    servantQuarterArea: String(addDet.numberOfServantQuarters || addDet.servantQuarterArea || ""),
    questions: addDet.questions || addDet.questionAnswers || addDet.propertyQuestions || [],
  };

  return {
    // PropertyLocationDetails reads from formData.cpt.details to populate address fields
    cpt: { details: property },
    locationDet: {
      ...property.address,
      noOfFloors: numberOfFloors
        ? { code: String(numberOfFloors), i18nKey: `PT_NO_OF_FLOORS_${numberOfFloors}` }
        : null,
      totalNoOfFloors: addDet.totalNoOfFloors || addDet.totalFloors || property.address?.totalNoOfFloors || property.address?.totalFloors || "",
      totalFloors: addDet.totalNoOfFloors || addDet.totalFloors || property.address?.totalNoOfFloors || property.address?.totalFloors || "",
    },
    // waterConnection is read by PropertyWaterConnection via formData[config.key]
    waterConnection: { useDetails },
    // Keep raw property for submit
    _rawProperty: property,
  };
};

const EditPropertyForm = ({ config, onSelect, userType }) => {
  const [showToast, setShowToast] = useState(null);
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const match = useRouteMatch();

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const isMobile = window.Digit.Utils.browser.isMobile();

  // Extract propertyId from URL: /edit-property/:propertyId
  const propertyId = match.params.propertyId || window.location.href.split("?")[0].split("/").pop();

  // Fetch existing property using citizen-level search (no isSearchInternal)
  const { isLoading: isPTLoading, data: propertyData } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId, tenantId } },
    { filters: { propertyIds: propertyId, tenantId } }
  );

  const [initialFormValue, setInitialFormValue] = useState(null);
  const [currentFormValue, setCurrentFormValue] = useState(null);
  const [initialized, setInitialized] = useState(false);
  // Ref to track last seen form data — prevents infinite setState loop in onFormValueChange
  const lastFormDataRef = useRef(null);

  useEffect(() => {
    if (propertyData?.Properties?.length > 0 && !initialized) {
      const mapped = mapPropertyToFormData(propertyData.Properties[0]);
      setInitialFormValue(mapped);    // used as defaultValues — set ONCE, never changes
      setCurrentFormValue(mapped);    // tracks changes for submit
      setInitialized(true);
    }
  }, [propertyData, initialized]);

  const { data: mdmsData, isLoading: isMdmsLoading } = Digit.Hooks.pt.useMDMS(
    Digit.ULBService.getStateId(),
    "PropertyTax",
    "CommonFieldsConfig"
  );

  const updateMutation = Digit.Hooks.pt.usePropertyAPI(tenantId, false /* update */);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const currentConfig = React.useMemo(() => {
    return newConfig.filter((step) => {
      if (step.head === "PT_OWNERSHIP_DETAILS") return false;
      return true;
    });
  }, []);

  if (isPTLoading || isMdmsLoading || !initialFormValue) {
    return <Loader />;
  }

  const onSubmit = async () => {
    const rawProperty = currentFormValue?._rawProperty || propertyData?.Properties?.[0] || {};
    const useDetails = currentFormValue?.waterConnection?.useDetails || {};
    const stateId = Digit.ULBService.getStateId();

    const plotAreaNum = parseFloat(useDetails?.plotArea);
    const builtUpAreaNum = parseFloat(useDetails?.builtUpArea);
    if (!isNaN(plotAreaNum) && !isNaN(builtUpAreaNum) && plotAreaNum < builtUpAreaNum) {
      const plotTrans = t("WS_PLOT_AREA_MORE_THAN_OR_EQUAL_BUILT_UP_AREA") || t("WS_PLOT_AREA_MORE_THAN_BUILT_UP_AREA");
      setShowToast({
        key: true,
        label: plotTrans && plotTrans !== "WS_PLOT_AREA_MORE_THAN_OR_EQUAL_BUILT_UP_AREA" && plotTrans !== "WS_PLOT_AREA_MORE_THAN_BUILT_UP_AREA"
          ? plotTrans
          : "Plot area should always be more than or equal to built up area.",
      });
      return;
    }

    const usageTypeObj = useDetails?.WaterConnectionUsageType;
    const usageTypeCode = typeof usageTypeObj === "object" ? usageTypeObj?.code || usageTypeObj?.value || usageTypeObj?.name : usageTypeObj;
    const isNormalUsage = String(usageTypeCode || "").toUpperCase() === "NORMAL";
    const heightStr = String(useDetails?.heightOfTheBuilding || "").trim();
    const heightNum = parseFloat(heightStr);
    if (isNormalUsage) {
      if (!/^\d+(\.\d{1,2})?$/.test(heightStr)) {
        setShowToast({
          key: true,
          label: t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR") && t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR") !== "WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR"
            ? t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR")
            : "Height of the building can have up to two decimal places only.",
        });
        return;
      }
      if (!isNaN(heightNum) && heightNum > 17.5) {
        const heightTrans = t("WS_HEIGHT_OF_BUILDING_NORMAL_ERROR");
        setShowToast({
          key: true,
          label: heightTrans && heightTrans !== "WS_HEIGHT_OF_BUILDING_NORMAL_ERROR"
            ? heightTrans
            : "Height of the building must be 17.5 meters or less for Normal connection.",
        });
        return;
      }
    } else {
      if (!/^\d+$/.test(heightStr)) {
        setShowToast({
          key: true,
          label: t("WS_HEIGHT_INTEGER_ONLY_ERROR") && t("WS_HEIGHT_INTEGER_ONLY_ERROR") !== "WS_HEIGHT_INTEGER_ONLY_ERROR"
            ? t("WS_HEIGHT_INTEGER_ONLY_ERROR")
            : "Decimal values are not allowed. Please enter a whole number.",
        });
        return;
      }
    }

    // Parse noOfFloors code → integer
    // "GROUND_FLOOR" → 0, "1_FLOOR" → 1, "2_FLOORS" → 2, etc.
    const loc = currentFormValue?.locationDet || {};
    const rawFloors = loc?.noOfFloors || useDetails?.noOfFloors;
    const floorsCode = typeof rawFloors === "object" ? rawFloors?.code : rawFloors || "";
    let noOfFloorsInt = 1;
    if (floorsCode === "BASEMENT") {
      noOfFloorsInt = 0;
    } else {
      const parsed = parseInt(String(floorsCode)?.split("_")?.[0]);
      noOfFloorsInt = isNaN(parsed) ? 1 : parsed;
    }

    // Build the owners array — preserve raw owners with all their IDs intact
    const ownersPayload = (rawProperty.owners || []).map((owner, index) => ({
      id: owner.id || null,
      uuid: owner.uuid || null,
      ownerInfoUuid: owner.ownerInfoUuid || null,
      tenantId: rawProperty.tenantId,
      name: owner.name,
      gender: owner.gender,
      mobileNumber: owner.mobileNumber,
      fatherOrHusbandName: owner.fatherOrHusbandName || "NA",
      relationship: owner.relationship || "FATHER",
      ownerType: owner.ownerType || "NONE",
      status: owner.status || "ACTIVE",
      documents: owner.documents || [],
      additionalDetails: owner.additionalDetails || { ownerSequence: index, ownerName: owner.name },
    }));

    // additionalDetails owners (lighter format for additionalDetails)
    const additionalOwners = ownersPayload.map((owner) => ({
      name: owner.name,
      gender: owner.gender,
      status: owner.status,
      documents: owner.documents || [],
      ownerType: owner.ownerType,
      mobileNumber: owner.mobileNumber,
      relationship: owner.relationship,
      permanentAddress: "NA",
      additionalDetails: owner.additionalDetails,
      fatherOrHusbandName: owner.fatherOrHusbandName,
      sameAsPropertyAddress: false,
    }));

    const payload = {
      Property: {
        id: rawProperty.id,
        propertyId: rawProperty.propertyId,
        plotId: rawProperty.plotId || null,
        tenantId: rawProperty.tenantId,
        accountId: rawProperty.accountId,
        status: rawProperty.status || "ACTIVE",
        creationReason: "UPDATE",
        source: "MUNICIPAL_RECORDS",
        channel: "CITIZEN",

        // Core property fields from the form's "Proposed Usage Details"
        propertyType: useDetails?.propertyType?.code || rawProperty.propertyType,
        usageCategory: useDetails?.propertyCategory?.code || rawProperty.usageCategory,
        ownershipCategory: rawProperty.ownershipCategory || "INDIVIDUAL.SINGLEOWNER",
        landArea: parseFloat(useDetails?.plotArea) || rawProperty.landArea || 0,
        superBuiltUpArea: parseFloat(useDetails?.builtUpArea) || rawProperty.superBuiltUpArea || 0,
        heightOfTheBuilding: useDetails?.heightOfTheBuilding || rawProperty.heightOfTheBuilding || "",
        noOfFloors: noOfFloorsInt,
        farArea: useDetails?.farArea || rawProperty.farArea || "",

        // Address stays unchanged (read-only section)
        address: rawProperty.address,

        // Owners stay unchanged
        owners: ownersPayload,

        // Workflow for citizen update
        workflow: {
          action: "OPEN",
          businessService: "PT.UPDATE",
          moduleName: "PT",
          tenantId: stateId,
        },

        // additionalDetails with updated usage values
        additionalDetails: {
          isRainwaterHarvesting: rawProperty.additionalDetails?.isRainwaterHarvesting || false,
          propertyType: useDetails?.propertyType?.code || rawProperty.additionalDetails?.propertyType || "",
          propertyCategory: useDetails?.propertyCategory?.code || rawProperty.additionalDetails?.propertyCategory || "",
          categoryType: useDetails?.categoryType?.code || rawProperty.additionalDetails?.categoryType || "",
          waterConnectionUsageType: useDetails?.WaterConnectionUsageType?.code || rawProperty.additionalDetails?.waterConnectionUsageType || "",
          yearOfConstruction: useDetails?.SelectYearofConstruction?.value || rawProperty.additionalDetails?.yearOfConstruction || "",
          numberOfDwellingUnits: useDetails?.NumberofDwellingUnits || rawProperty.additionalDetails?.numberOfDwellingUnits || "",
          numberOfFloors: floorsCode || rawProperty.additionalDetails?.numberOfFloors || "",
          totalNoOfFloors: loc?.totalNoOfFloors || loc?.totalFloors || rawProperty.additionalDetails?.totalNoOfFloors || rawProperty.additionalDetails?.totalFloors || "",
          totalFloors: loc?.totalNoOfFloors || loc?.totalFloors || rawProperty.additionalDetails?.totalNoOfFloors || rawProperty.additionalDetails?.totalFloors || "",
          plotArea: useDetails?.plotArea || rawProperty.additionalDetails?.plotArea || "",
          builtUpArea: useDetails?.builtUpArea || rawProperty.additionalDetails?.builtUpArea || "",
          farArea: useDetails?.farArea || rawProperty.additionalDetails?.farArea || "",
          servantQuarterArea: useDetails?.servantQuarterArea || rawProperty.additionalDetails?.servantQuarterArea || "",
          numberOfBeds: useDetails?.numberOfBeds || rawProperty.additionalDetails?.numberOfBeds || "",
          numberOfStudents: useDetails?.numberOfStudents || rawProperty.additionalDetails?.numberOfStudents || "",
          numberOfRooms: useDetails?.NumberofRooms || rawProperty.additionalDetails?.numberOfRooms || "",
          heightOfTheBuilding: useDetails?.heightOfTheBuilding || rawProperty.additionalDetails?.heightOfTheBuilding || "",
          questions: useDetails?.questions || useDetails?.questionAnswers || rawProperty.additionalDetails?.questions || rawProperty.additionalDetails?.questionAnswers || [],
          owners: additionalOwners,
        },
      },
    };

    console.log("[EditProperty] Update payload:", JSON.stringify(payload, null, 2));

    updateMutation.mutate(payload, {
      onSuccess: (data) => {
        const errors = data?.response?.data?.Errors || data?.Errors;
        const isError = errors?.length > 0 || data instanceof Error || data?.isAxiosError || data?.response?.status >= 400;
        
        if (isError) {
          const errorMsg = errors?.[0]?.message || data?.response?.data?.message || data?.message || t("PT_COMMON_FAILED_TO_UPDATE_PROPERTY");
          sessionStorage.setItem("PT_ERROR_MSG", errorMsg);
          history.push(`${match.url}/save-property`, { isError: true, errorMsg: errorMsg });
          return;
        }
        setShowToast({ key: false, label: t("CS_PROPERTY_UPDATE_APPLICATION_SUCCESS") });
        try {
          sessionStorage.setItem("IS_PROPERTY_UPDATED", "true");
          if (rawProperty?.propertyId) {
            sessionStorage.setItem("IS_PROPERTY_UPDATED_" + rawProperty.propertyId, "true");
          }
        } catch (e) {
          console.error("Error setting property update flag in sessionStorage", e);
        }
        setTimeout(() => {
          if (onSelect) {
            onSelect("editProperty", { property: data?.Properties?.[0] });
          } else {
            history.push(`${match.url}/save-property`, { property: data?.Properties?.[0], isEdit: true, isUpdate: true });
          }
        }, 2000);
      },
      onError: (error) => {
        sessionStorage.setItem("PT_ERROR_MSG", error?.response?.data?.Errors?.[0]?.message || t("PT_COMMON_FAILED_TO_UPDATE_PROPERTY"));
        history.push(`${match.url}/save-property`, { isError: true, isEdit: true, isUpdate: true, errorMsg: error?.response?.data?.Errors?.[0]?.message || t("PT_COMMON_FAILED_TO_UPDATE_PROPERTY") });
      },
    });
  };


  // Use ref to avoid infinite loop:
  // FormComposer calls onFormValueChange on every render; if we call setState here without
  // checking equality, it triggers another render → infinite loop.
  const onFormValueChange = (_setValue, data) => {
    if (!_.isEqual(lastFormDataRef.current, data)) {
      lastFormDataRef.current = data;
      setCurrentFormValue((prev) => ({ ...prev, ...data, _rawProperty: prev?._rawProperty }));
    }
  };

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline
          config={[{ timeLine: [{ actions: t("PT_UPDATE_PROPERTY_BUTTON"), currentStep: 1 }] }]}
          showFinalStep={false}
        />
        <FormComposer
          onSubmit={onSubmit}
          noBoxShadow
          inline
          config={currentConfig}
          label={t("PT_UPDATE_PROPERTY_BUTTON")}
          defaultValues={initialFormValue}
          onFormValueChange={onFormValueChange}
          noBreakLine={true}
          noCard={true}
        />
      </div>
      {showToast && (
        <Toast
          error={showToast.key}
          label={showToast.label}
          isDleteBtn={true}
          onClose={() => setShowToast(null)}
        />
      )}
    </React.Fragment>
  );
};

export default EditPropertyForm;
