import {
  LabelFieldPair,
  Dropdown,
  TextInput,
  CardLabelError,
  CardLabel,
  CollapsibleCardPage,
  Toast,
  FieldLabelWithTooltip,
  RadioButtons,
  EditIcon,
  DeleteIcon,
  LinkButton,
} from "@djb25/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import _ from "lodash";

const NUMBER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;
const normalizeCode = (value) =>
  String(value || "")
    .replace(/[._\s-]/g, "")
    .toUpperCase();
const getCode = (value) => (typeof value === "object" ? value?.code || value?.value : value);

const PropertyWaterConnection = ({ t, config, onSelect, formData, formState, setError, clearErrors, ...props }) => {
  const {
    control,
    register,
    formState: { errors },
    watch,
    setValue,
    clearErrors: formClearErrors,
  } = useForm({
    mode: "onChange",
    defaultValues: formData?.[config.key] || {
      useDetails: {
        categoryType: null,
        propertyCategory: null,
        propertyType: null,
        WaterConnectionUsageType: null,
        plotArea: "",
        builtUpArea: "",
        farArea: "",
        heightOfTheBuilding: "",
        SelectYearofConstruction: null,
        NumberofDwellingUnits: "",
        NumberofRooms: "",
        numberOfBeds: "",
        numberOfStudents: "",
        servantQuarterArea: "",
        questions: [],
        categoryTypeSelectionAnswer: null,
        isMixedOccupancy: formData?.[config.key]?.useDetails?.isMixedOccupancy || null,
        mixedOccupancyDetails: formData?.[config.key]?.useDetails?.mixedOccupancyDetails || [],
      },
    },
  });

  const tenantId = Digit.ULBService.getStateId?.() || Digit.ULBService.getCurrentTenantId();

  const { data: ptServicesMastersData } = Digit.Hooks.pt.usePropertyMDMS(tenantId, "PropertyTax", [
    "PropertyCategory",
    "PropertyType",
    "NoOfFloors",
    "PropertyNewUsageType",
    "PropertyToUsageMapping",
    "PropertyType2",
  ]);

  const { data: wsServicesMastersData } = Digit.Hooks.ws.useMDMS(tenantId, "ws-services-masters", ["WsCategoryType"]);

  const [categoryTypeList, setCategoryTypeList] = useState([]);
  const initializedPropertyRef = React.useRef(null);

  useEffect(() => {
    const categories = wsServicesMastersData?.["ws-services-masters"]?.WsCategoryType || [];
    if (categories.length > 0) {
      categories.forEach((data) => (data.i18nKey = data.i18nKey || `WS_CATEGORY_${data.code}`));
      setCategoryTypeList(categories);
    } else {
      setCategoryTypeList([
        { code: "DOMESTIC", name: "Domestic", i18nKey: "WS_CATEGORY_DOMESTIC" },
        { code: "NON_DOMESTIC", name: "Non-Domestic", i18nKey: "WS_CATEGORY_NON_DOMESTIC" },
      ]);
    }
  }, [wsServicesMastersData]);

  const isPropertyFound = window.location.href.includes("ws/old-application") || window.location.href.includes("/edit-application");

  useEffect(() => {
    if (props.register) {
      props.register({ name: "cpt" });
    }
  }, [props.register]);

  const formValue = watch();
  const watchCategoryType = watch("useDetails.categoryType");
  const watchPropertyType = watch("useDetails.propertyType");
  const watchPropertyCategory = watch("useDetails.propertyCategory");
  const watchWaterConnectionUsageType = watch("useDetails.WaterConnectionUsageType");
  const watchPlotArea = watch("useDetails.plotArea");
  const watchBuiltUpArea = watch("useDetails.builtUpArea");
  const watchHeightOfTheBuilding = watch("useDetails.heightOfTheBuilding");
  const [showToast, setShowToast] = useState(null);

  // Mixed Occupancy State
  const initialMixed = formData?.[config.key]?.useDetails?.isMixedOccupancy || null;
  const initialMixedRows = formData?.[config.key]?.useDetails?.mixedOccupancyDetails || [];
  const [isMixedOcc, setIsMixedOcc] = useState(initialMixed); // "YES", "NO", or null
  const [mixedOccRows, setMixedOccRows] = useState(Array.isArray(initialMixedRows) ? initialMixedRows : []);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [mixedForm, setMixedForm] = useState({
    propertyType: null,
    builtUpArea: "",
    heightOfTheBuilding: "",
  });

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const getPlotAreaError = () => {
    const trans = t("WS_PLOT_AREA_MORE_THAN_OR_EQUAL_BUILT_UP_AREA") || t("WS_PLOT_AREA_MORE_THAN_BUILT_UP_AREA");
    return trans && trans !== "WS_PLOT_AREA_MORE_THAN_OR_EQUAL_BUILT_UP_AREA" && trans !== "WS_PLOT_AREA_MORE_THAN_BUILT_UP_AREA"
      ? trans
      : "Plot area should always be more than or equal to built up area.";
  };

  const getHeightErrorMessage = () => {
    const usageCode =
      typeof watchWaterConnectionUsageType === "object"
        ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
        : watchWaterConnectionUsageType;
    const isNormal = normalizeCode(usageCode) === "NORMAL";
    const val = String(watchHeightOfTheBuilding || "").trim();
    if (isNormal) {
      if (val && !/^\d+(\.\d{1,2})?$/.test(val)) {
        const trans = t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR");
        return trans && trans !== "WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR" ? trans : "Height of the building can have up to two decimal places only.";
      }
      const trans = t("WS_HEIGHT_OF_BUILDING_NORMAL_ERROR");
      return trans && trans !== "WS_HEIGHT_OF_BUILDING_NORMAL_ERROR"
        ? trans
        : "Height of the building must be 17.5 meters or less for Normal connection.";
    } else {
      const trans = t("WS_HEIGHT_INTEGER_ONLY_ERROR");
      return trans && trans !== "WS_HEIGHT_INTEGER_ONLY_ERROR" ? trans : "Decimal values are not allowed. Please enter a whole number.";
    }
  };

  const isPlotAreaInvalid = useMemo(() => {
    if (!watchPlotArea || !watchBuiltUpArea) return false;
    const plot = parseFloat(watchPlotArea);
    const built = parseFloat(watchBuiltUpArea);
    if (!isNaN(plot) && !isNaN(built)) {
      return plot < built;
    }
    return false;
  }, [watchPlotArea, watchBuiltUpArea]);

  const isHeightInvalid = useMemo(() => {
    if (!watchHeightOfTheBuilding) return false;
    const usageCode =
      typeof watchWaterConnectionUsageType === "object"
        ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
        : watchWaterConnectionUsageType;
    const isNormal = normalizeCode(usageCode) === "NORMAL";
    const val = String(watchHeightOfTheBuilding).trim();
    if (isNormal) {
      if (!/^\d+(\.\d{1,2})?$/.test(val)) return true;
      const height = parseFloat(val);
      return !isNaN(height) && height > 17.5;
    } else {
      return !/^\d+$/.test(val);
    }
  }, [watchHeightOfTheBuilding, watchWaterConnectionUsageType]);

  const handleAreaBlur = () => {
    const plot = parseFloat(watchPlotArea);
    const built = parseFloat(watchBuiltUpArea);
    if (!isNaN(plot) && !isNaN(built) && plot < built) {
      setShowToast({
        key: true,
        label: getPlotAreaError(),
      });
    }
  };

  const handleHeightChange = (e) => {
    const rawVal = e?.target?.value !== undefined ? e.target.value : "";
    const usageCode =
      typeof watchWaterConnectionUsageType === "object"
        ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
        : watchWaterConnectionUsageType;
    const isNormal = normalizeCode(usageCode) === "NORMAL";

    if (!rawVal) {
      setValue("useDetails.heightOfTheBuilding", "", { shouldValidate: true, shouldDirty: true });
      return;
    }

    // Only allow numbers and decimal point
    let cleaned = String(rawVal).replace(/[^0-9.]/g, "");

    if (!isNormal) {
      // Whole numbers only for Non-Normal
      cleaned = cleaned.replace(/\./g, "");
    } else {
      // Allow only one decimal point and at most 2 digits after the decimal point
      const parts = cleaned.split(".");
      if (parts.length > 1) {
        cleaned = parts[0] + "." + parts.slice(1).join("").slice(0, 2);
      }
    }

    if (e?.target) {
      e.target.value = cleaned;
    }
    setValue("useDetails.heightOfTheBuilding", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  const handleHeightBlur = (e) => {
    const usageCode =
      typeof watchWaterConnectionUsageType === "object"
        ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
        : watchWaterConnectionUsageType;
    const isNormal = normalizeCode(usageCode) === "NORMAL";
    const val = String(e?.target?.value !== undefined ? e.target.value : watchHeightOfTheBuilding || "").trim();
    if (!val) return;
    if (isNormal) {
      if (!/^\d+(\.\d{1,2})?$/.test(val)) {
        setShowToast({
          key: true,
          label:
            t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR") && t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR") !== "WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR"
              ? t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR")
              : "Height of the building can have up to two decimal places only.",
        });
        return;
      }
      const height = parseFloat(val);
      if (!isNaN(height) && height > 17.5) {
        setShowToast({
          key: true,
          label: getHeightErrorMessage(),
        });
      }
    } else {
      if (!/^\d+$/.test(val)) {
        setShowToast({
          key: true,
          label:
            t("WS_HEIGHT_INTEGER_ONLY_ERROR") && t("WS_HEIGHT_INTEGER_ONLY_ERROR") !== "WS_HEIGHT_INTEGER_ONLY_ERROR"
              ? t("WS_HEIGHT_INTEGER_ONLY_ERROR")
              : "Decimal values are not allowed. Please enter a whole number.",
        });
      }
    }
  };

  useEffect(() => {
    if (isPlotAreaInvalid) {
      if (typeof setError === "function" && config?.key) {
        setError(config.key, {
          type: "custom",
          message: getPlotAreaError(),
        });
      }
    } else if (isHeightInvalid) {
      if (typeof setError === "function" && config?.key) {
        setError(config.key, {
          type: "custom",
          message: getHeightErrorMessage(),
        });
      }
    } else {
      if (typeof clearErrors === "function" && config?.key) {
        clearErrors(config.key);
      }
    }
  }, [isPlotAreaInvalid, isHeightInvalid, config?.key, setError, clearErrors]);
  const isHospitalProperty =
    watchPropertyType?.code === "HOSPITAL_NURSING_HOME" ||
    watchPropertyType?.code === "DharamshalasOrHostels" ||
    watchPropertyType?.code === "HospitalNursingHome";
  const isHotelRestaurantProperty = watchPropertyType?.code === "HOTEL_OR_RESTAURANT" || watchPropertyType?.code === "HotelOrRestaurant";
  const isSchoolCollegeProperty = watchPropertyType?.code === "School" || watchPropertyType?.code === "College";
  const dwellingPropertyTypes = [
    "Apartment",
    "DDAFlats",
    "GovtFlats",
    "Bungalows",
    "FlatOrApartment",
    "GroupHousingSociety",
    "JJSLUMS",
    "IndividualHouse",
  ];

  const isResidential =
    normalizeCode(watchPropertyCategory?.code || watchPropertyCategory?.name || watchPropertyCategory) === "RESIDENTIAL" ||
    normalizeCode(watchPropertyType?.propertyCategory) === "RESIDENTIAL";

  const isDwellingUnit = isResidential;

  const isServentHouse = isDwellingUnit;

  const prevIsDwellingUnit = React.useRef(null);
  useEffect(() => {
    if (prevIsDwellingUnit.current === null) {
      prevIsDwellingUnit.current = isDwellingUnit;
      return;
    }
    if (prevIsDwellingUnit.current && !isDwellingUnit) {
      setValue("useDetails.NumberofDwellingUnits", "");
      if (clearErrors) {
        clearErrors("useDetails.NumberofDwellingUnits");
      }
    }
    prevIsDwellingUnit.current = isDwellingUnit;
  }, [isDwellingUnit]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push({ value: i.toString(), name: i.toString() });
    }
    return years;
  }, []);

  const propertyType2List = useMemo(() => {
    const fromMdms = ptServicesMastersData?.PropertyTax?.PropertyType2;
    if (Array.isArray(fromMdms) && fromMdms.length > 0) {
      return fromMdms;
    }
    return [];
  }, [ptServicesMastersData]);

  const matchesCategory = (item, categoryNorm) => {
    if (!categoryNorm) return true;
    const raw = item?.propertyCategory;
    if (!raw) return false;
    if (Array.isArray(raw)) {
      return raw.some((c) => normalizeCode(typeof c === "object" ? c?.code || c?.name : c) === categoryNorm);
    }
    const itemNorm = normalizeCode(typeof raw === "object" ? raw?.code || raw?.name : raw);
    return itemNorm === categoryNorm;
  };

  const categoryOptions = useMemo(() => {
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const catMap = new Map();

    list.forEach((item) => {
      const rawCat = item?.propertyCategory;
      if (!rawCat) return;
      if (Array.isArray(rawCat)) {
        rawCat.forEach((c) => {
          const name = typeof c === "object" ? c?.name || c?.code : String(c);
          const code = typeof c === "object" ? c?.code || c?.name : String(c);
          const norm = normalizeCode(code || name);
          if (norm && !catMap.has(norm)) {
            catMap.set(norm, { code: code || name, name: name || code, i18nKey: name || code });
          }
        });
      } else {
        const name = typeof rawCat === "object" ? rawCat?.name || rawCat?.code : String(rawCat);
        const code = typeof rawCat === "object" ? rawCat?.code || rawCat?.name : String(rawCat);
        const norm = normalizeCode(code || name);
        if (norm && !catMap.has(norm)) {
          catMap.set(norm, { code: code || name, name: name || code, i18nKey: name || code });
        }
      }
    });

    const masterCats = ptServicesMastersData?.PropertyTax?.PropertyCategory || [];
    if (Array.isArray(masterCats)) {
      masterCats.forEach((mc) => {
        const name = typeof mc === "object" ? mc?.name || mc?.code : String(mc);
        const code = typeof mc === "object" ? mc?.code || mc?.name : String(mc);
        const norm = normalizeCode(code || name);
        if (norm && !catMap.has(norm)) {
          catMap.set(norm, { code: code || name, name: name || code, i18nKey: name || code });
        }
      });
    }

    if (watchPropertyCategory) {
      const name =
        typeof watchPropertyCategory === "object" ? watchPropertyCategory?.name || watchPropertyCategory?.code : String(watchPropertyCategory);
      const code =
        typeof watchPropertyCategory === "object" ? watchPropertyCategory?.code || watchPropertyCategory?.name : String(watchPropertyCategory);
      const norm = normalizeCode(code || name);
      if (norm && !catMap.has(norm)) {
        catMap.set(norm, { code: code || name, name: name || code, i18nKey: name || code });
      }
    }

    return Array.from(catMap.values()).sort((a, b) =>
      (a.name || a.code || "").localeCompare(b.name || b.code || "", undefined, { numeric: true, sensitivity: "base" })
    );
  }, [propertyType2List, ptServicesMastersData, watchPropertyCategory]);

  const propertyTypeOptions = useMemo(() => {
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const activeList = list.filter((item) => item.active !== false);

    const selectedCategory =
      typeof watchPropertyCategory === "object" ? watchPropertyCategory?.code || watchPropertyCategory?.name : watchPropertyCategory;
    const catNorm = normalizeCode(selectedCategory);

    let filtered = catNorm ? activeList.filter((item) => matchesCategory(item, catNorm)) : [];

    if (watchPropertyType?.code && !filtered.some((item) => normalizeCode(item.code) === normalizeCode(watchPropertyType.code))) {
      const existingInList = list.find((item) => normalizeCode(item.code) === normalizeCode(watchPropertyType.code));
      if (existingInList) {
        filtered = [existingInList, ...filtered];
      } else {
        filtered = [watchPropertyType, ...filtered];
      }
    }

    return filtered
      .map((item) => ({
        ...item,
        code: item.code,
        name: item.name || item.code,
        i18nKey: item.i18nKey || item.code,
      }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" }));
  }, [propertyType2List, ptServicesMastersData, watchPropertyCategory, watchPropertyType]);

  const selectedCategoryCode =
    typeof watchPropertyCategory === "object" ? watchPropertyCategory?.code || watchPropertyCategory?.name : watchPropertyCategory;
  const hasSelectedCategory = Boolean(normalizeCode(selectedCategoryCode));
  const isInstitutionalCategory = normalizeCode(selectedCategoryCode) === "INSTITUTIONAL";

  const handleCategoryChange = (selectedCategory) => {
    setRuleAnswer(null);
    setValue("useDetails.categoryTypeSelectionAnswer", null);
    setValue("useDetails.propertyCategory", selectedCategory, { shouldValidate: true, shouldDirty: true });
    if (clearErrors) clearErrors("useDetails.propertyCategory");
    if (formClearErrors) formClearErrors("useDetails.propertyCategory");

    const newCatNorm = normalizeCode(typeof selectedCategory === "object" ? selectedCategory?.code || selectedCategory?.name : selectedCategory);
    if (newCatNorm !== "INSTITUTIONAL") {
      setIsMixedOcc(null);
      setMixedOccRows([]);
      setEditingRowIndex(null);
      setMixedForm({ propertyType: null, builtUpArea: "", heightOfTheBuilding: "" });
      setValue("useDetails.isMixedOccupancy", null, { shouldDirty: true });
      setValue("useDetails.mixedOccupancyDetails", [], { shouldDirty: true });
    }

    if (!selectedCategory) {
      setValue("useDetails.propertyType", null, { shouldValidate: false, shouldDirty: true });
      setValue("useDetails.categoryType", null, { shouldValidate: false, shouldDirty: true });
      setValue("useDetails.WaterConnectionUsageType", null, { shouldValidate: false, shouldDirty: true });
      prevPropertyTypeCode.current = null;
      if (clearErrors) {
        clearErrors("useDetails.propertyType");
        clearErrors("useDetails.categoryType");
        clearErrors("useDetails.WaterConnectionUsageType");
      }
      if (formClearErrors) {
        formClearErrors("useDetails.propertyType");
        formClearErrors("useDetails.categoryType");
        formClearErrors("useDetails.WaterConnectionUsageType");
      }
      return;
    }

    if (watchPropertyType?.code) {
      const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
      const matched = list.find((item) => normalizeCode(item.code) === normalizeCode(watchPropertyType.code));
      const selNorm = normalizeCode(typeof selectedCategory === "object" ? selectedCategory?.code || selectedCategory?.name : selectedCategory);
      const isMatch = matchesCategory(matched || watchPropertyType, selNorm);
      if (!isMatch) {
        setValue("useDetails.propertyType", null, { shouldValidate: false, shouldDirty: true });
        setValue("useDetails.categoryType", null, { shouldValidate: false, shouldDirty: true });
        setValue("useDetails.WaterConnectionUsageType", null, { shouldValidate: false, shouldDirty: true });
        prevPropertyTypeCode.current = null;
        if (clearErrors) {
          clearErrors("useDetails.propertyType");
          clearErrors("useDetails.categoryType");
          clearErrors("useDetails.WaterConnectionUsageType");
        }
        if (formClearErrors) {
          formClearErrors("useDetails.propertyType");
          formClearErrors("useDetails.categoryType");
          formClearErrors("useDetails.WaterConnectionUsageType");
        }
      }
    }
  };

  const usageTypeOptions = useMemo(() => {
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const uniqueTypes = [...new Set(list.map((item) => item.waterConnectionUsageType).filter(Boolean))];
    const typesToMap = uniqueTypes.length > 0 ? uniqueTypes : ["Normal", "Bulk"];
    return typesToMap
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((type) => ({
        code: type,
        name: type,
        value: type,
      }));
  }, [propertyType2List, ptServicesMastersData]);

  // All property types across all categories for Mixed Occupancy dropdown
  const allPropertyTypeOptions = useMemo(() => {
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const activeList = list.filter((item) => item.active !== false);
    return activeList
      .map((item) => ({
        ...item,
        code: item.code,
        name: item.name || item.code,
        i18nKey: item.i18nKey || item.code,
      }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" }));
  }, [propertyType2List, ptServicesMastersData]);

  const availableCategoryOptions = useMemo(() => {
    const propType = watchPropertyType?.code ? watchPropertyType : null;
    if (!propType) {
      return categoryTypeList;
    }

    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const matched = list.find((item) => normalizeCode(item.code) === normalizeCode(propType.code)) || propType;

    let rawCats = matched?.categoryType;
    if (!rawCats) return categoryTypeList;
    if (!Array.isArray(rawCats)) rawCats = [rawCats];
    rawCats = rawCats
      .map((c) => (typeof c === "object" ? c?.name || c?.code || c?.value || "" : String(c || "")))
      .map((c) => c.trim())
      .filter(Boolean);

    if (rawCats.length === 0) return categoryTypeList;

    const normalizedAllowed = rawCats.map((c) => normalizeCode(c));

    const matchedOptions = categoryTypeList.filter(
      (item) => normalizedAllowed.includes(normalizeCode(item.code)) || normalizedAllowed.includes(normalizeCode(item.name))
    );

    if (matchedOptions.length > 0) {
      return matchedOptions;
    }

    return rawCats.map((catStr) => {
      const isDomestic = normalizeCode(catStr) === "DOMESTIC";
      const isNonDomestic = normalizeCode(catStr) === "NONDOMESTIC";
      const code = isDomestic ? "DOMESTIC" : isNonDomestic ? "NON_DOMESTIC" : String(catStr).toUpperCase();
      const name = isDomestic ? "Domestic" : isNonDomestic ? "Non-Domestic" : String(catStr);
      return {
        code,
        name,
        i18nKey: t && t(`WS_CATEGORY_${code}`) !== `WS_CATEGORY_${code}` ? `WS_CATEGORY_${code}` : name,
      };
    });
  }, [watchPropertyType, propertyType2List, ptServicesMastersData, categoryTypeList, t]);

  const isCommercialCategory = useMemo(() => {
    const catCode = typeof watchPropertyCategory === "object" ? watchPropertyCategory?.code || watchPropertyCategory?.name : watchPropertyCategory;
    return normalizeCode(catCode) === "COMMERCIAL";
  }, [watchPropertyCategory]);

  const matchedPropertyTypeFull = useMemo(() => {
    if (!watchPropertyType?.code) return null;
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    return list.find((item) => normalizeCode(item.code) === normalizeCode(watchPropertyType.code)) || watchPropertyType;
  }, [watchPropertyType, propertyType2List, ptServicesMastersData]);

  const categoryTypeRule = useMemo(() => {
    if (!isCommercialCategory) return null;
    return matchedPropertyTypeFull?.categoryTypeSelectionRule || null;
  }, [isCommercialCategory, matchedPropertyTypeFull]);

  const [ruleAnswer, setRuleAnswer] = useState(() => {
    return formData?.[config?.key]?.useDetails?.categoryTypeSelectionAnswer || formData?.[config?.key]?.categoryTypeSelectionAnswer || null;
  });

  const handleCategoryTypeRuleSelect = (option) => {
    const ansCode = String(option?.code || option?.name || option || "").toUpperCase();
    setRuleAnswer(ansCode);
    setValue("useDetails.categoryTypeSelectionAnswer", ansCode, { shouldDirty: true });

    const matchedRule = categoryTypeRule?.rules?.find((r) => String(r.answer || "").toUpperCase() === ansCode);

    const targetCategoryTypeName = matchedRule?.categoryType;
    if (targetCategoryTypeName) {
      const normTarget = normalizeCode(targetCategoryTypeName);
      const targetCat = categoryTypeList.find((c) => normalizeCode(c.code) === normTarget || normalizeCode(c.name) === normTarget) || {
        code: normTarget === "DOMESTIC" ? "DOMESTIC" : normTarget === "NONDOMESTIC" ? "NON_DOMESTIC" : targetCategoryTypeName,
        name: targetCategoryTypeName,
        i18nKey: t && t(`WS_CATEGORY_${normTarget}`) !== `WS_CATEGORY_${normTarget}` ? `WS_CATEGORY_${normTarget}` : targetCategoryTypeName,
      };

      setValue("useDetails.categoryType", targetCat, { shouldValidate: true, shouldDirty: true });
      if (clearErrors) clearErrors("useDetails.categoryType");
      if (formClearErrors) formClearErrors("useDetails.categoryType");
    }
  };

  const autoFillFromPropertyType = React.useCallback(
    (propTypeItem) => {
      if (!propTypeItem?.code) return;

      const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
      const matched = list.find((item) => normalizeCode(item.code) === normalizeCode(propTypeItem.code)) || propTypeItem;

      console.log("[PropertyWaterConnection] Property Type selected:", matched?.code);
      console.log("[PropertyWaterConnection] Matched item from MDMS:", matched);

      // 1. Category Type
      const hasCategoryTypeRule = isCommercialCategory && Boolean(matched?.categoryTypeSelectionRule);

      if (hasCategoryTypeRule) {
        // Commercial case with categoryTypeSelectionRule:
        // Category type is determined by the rule's question and answer
        const currentAns = ruleAnswer || formData?.[config?.key]?.useDetails?.categoryTypeSelectionAnswer;
        if (currentAns) {
          const matchedRule = matched.categoryTypeSelectionRule?.rules?.find(
            (r) => String(r.answer || "").toUpperCase() === String(currentAns).toUpperCase()
          );
          if (matchedRule?.categoryType) {
            const normTarget = normalizeCode(matchedRule.categoryType);
            const targetCat = categoryTypeList.find((c) => normalizeCode(c.code) === normTarget || normalizeCode(c.name) === normTarget) || {
              code: normTarget === "DOMESTIC" ? "DOMESTIC" : normTarget === "NONDOMESTIC" ? "NON_DOMESTIC" : matchedRule.categoryType,
              name: matchedRule.categoryType,
              i18nKey: t && t(`WS_CATEGORY_${normTarget}`) !== `WS_CATEGORY_${normTarget}` ? `WS_CATEGORY_${normTarget}` : matchedRule.categoryType,
            };
            setValue("useDetails.categoryType", targetCat, { shouldValidate: true, shouldDirty: true });
            if (clearErrors) clearErrors("useDetails.categoryType");
            if (formClearErrors) formClearErrors("useDetails.categoryType");
          }
        } else {
          setValue("useDetails.categoryType", null, { shouldValidate: false, shouldDirty: true });
        }
      } else if (matched?.categoryType) {
        let rawCats = matched.categoryType;
        if (!Array.isArray(rawCats)) rawCats = [rawCats];
        rawCats = rawCats
          .map((c) => (typeof c === "object" ? c?.name || c?.code || c?.value || "" : String(c || "")))
          .map((c) => c.trim())
          .filter(Boolean);

        const hasDomestic = rawCats.some((c) => normalizeCode(c) === "DOMESTIC");
        const hasNonDomestic = rawCats.some((c) => normalizeCode(c) === "NONDOMESTIC");

        let targetCat = null;
        if (hasDomestic) {
          // If Domestic is available (whether alone or with Non-Domestic), Domestic show ho
          targetCat = categoryTypeList.find((c) => normalizeCode(c.code) === "DOMESTIC" || normalizeCode(c.name) === "DOMESTIC") || {
            code: "DOMESTIC",
            name: "Domestic",
            i18nKey: t && t("WS_CATEGORY_DOMESTIC") !== "WS_CATEGORY_DOMESTIC" ? "WS_CATEGORY_DOMESTIC" : "Domestic",
          };
        } else if (hasNonDomestic) {
          // Only Non-Domestic available
          targetCat = categoryTypeList.find((c) => normalizeCode(c.code) === "NONDOMESTIC" || normalizeCode(c.name) === "NONDOMESTIC") || {
            code: "NON_DOMESTIC",
            name: "Non-Domestic",
            i18nKey: t && t("WS_CATEGORY_NON_DOMESTIC") !== "WS_CATEGORY_NON_DOMESTIC" ? "WS_CATEGORY_NON_DOMESTIC" : "Non-Domestic",
          };
        } else if (rawCats.length > 0) {
          const firstNorm = normalizeCode(rawCats[0]);
          targetCat = categoryTypeList.find((c) => normalizeCode(c.code) === firstNorm || normalizeCode(c.name) === firstNorm) || {
            code: rawCats[0].toUpperCase(),
            name: rawCats[0],
            i18nKey: t && t(`WS_CATEGORY_${rawCats[0]}`) !== `WS_CATEGORY_${rawCats[0]}` ? `WS_CATEGORY_${rawCats[0]}` : rawCats[0],
          };
        }

        if (targetCat) {
          setValue("useDetails.categoryType", targetCat, { shouldValidate: true, shouldDirty: true });
          if (clearErrors) clearErrors("useDetails.categoryType");
          if (formClearErrors) formClearErrors("useDetails.categoryType");
        }
      }

      // 2. Property Category
      if (matched?.propertyCategory) {
        const foundPropCat = categoryOptions.find(
          (c) =>
            normalizeCode(c.code) === normalizeCode(matched.propertyCategory) || normalizeCode(c.name) === normalizeCode(matched.propertyCategory)
        ) || {
          code: matched.propertyCategory,
          name: matched.propertyCategory,
          i18nKey: matched.propertyCategory,
        };
        setValue("useDetails.propertyCategory", foundPropCat, { shouldValidate: true, shouldDirty: true });
        if (clearErrors) clearErrors("useDetails.propertyCategory");
        if (formClearErrors) formClearErrors("useDetails.propertyCategory");
      }

      // 3. Water Connection Usage Type
      if (matched?.waterConnectionUsageType) {
        const foundUsage = usageTypeOptions.find(
          (u) =>
            normalizeCode(u.code) === normalizeCode(matched.waterConnectionUsageType) ||
            normalizeCode(u.name) === normalizeCode(matched.waterConnectionUsageType)
        ) || {
          code: matched.waterConnectionUsageType,
          name: matched.waterConnectionUsageType,
          value: matched.waterConnectionUsageType,
        };
        setValue("useDetails.WaterConnectionUsageType", foundUsage, { shouldValidate: true, shouldDirty: true });
        if (clearErrors) clearErrors("useDetails.WaterConnectionUsageType");
        if (formClearErrors) formClearErrors("useDetails.WaterConnectionUsageType");
      }
      if (clearErrors) clearErrors("useDetails.propertyType");
      if (formClearErrors) formClearErrors("useDetails.propertyType");
    },
    [
      propertyType2List,
      ptServicesMastersData,
      categoryTypeList,
      categoryOptions,
      usageTypeOptions,
      setValue,
      clearErrors,
      formClearErrors,
      t,
      isCommercialCategory,
      ruleAnswer,
      formData,
      config,
    ]
  );

  const prevPropertyTypeCode = React.useRef(null);

  useEffect(() => {
    if (!watchPropertyType?.code) {
      prevPropertyTypeCode.current = null;
      setRuleAnswer(null);
      return;
    }

    const isNewType = prevPropertyTypeCode.current !== watchPropertyType.code;
    if (isNewType) {
      if (prevPropertyTypeCode.current !== null) {
        setRuleAnswer(null);
        setValue("useDetails.categoryTypeSelectionAnswer", null);
      }
      prevPropertyTypeCode.current = watchPropertyType.code;
      if (formClearErrors) formClearErrors("useDetails.propertyType");
      if (clearErrors) clearErrors("useDetails.propertyType");
      autoFillFromPropertyType(watchPropertyType);
    }
  }, [watchPropertyType?.code, autoFillFromPropertyType, formClearErrors, clearErrors, setValue]);

  const activeQuestions = useMemo(() => {
    if (!watchPropertyType?.code) return [];
    let qList = watchPropertyType?.questions;
    if (!qList || !Array.isArray(qList)) {
      const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
      const matched = list.find((item) => normalizeCode(item.code) === normalizeCode(watchPropertyType.code));
      qList = matched?.questions;
    }
    if (!qList || !Array.isArray(qList)) return [];
    return qList
      .map((q) => (typeof q === "object" ? q?.question || q?.title || q?.name || "" : String(q || "")))
      .map((q) => q.trim())
      .filter((q) => q.length > 0);
  }, [watchPropertyType, propertyType2List, ptServicesMastersData]);

  const [questionAnswers, setQuestionAnswers] = useState(() => {
    const existing =
      formData?.[config?.key]?.useDetails?.questionAnswers ||
      formData?.[config?.key]?.useDetails?.questions ||
      formData?.[config?.key]?.questionAnswers ||
      [];
    return Array.isArray(existing) ? existing : [];
  });

  const prevActiveQuestions = React.useRef(null);
  useEffect(() => {
    if (!_.isEqual(prevActiveQuestions.current, activeQuestions)) {
      prevActiveQuestions.current = _.cloneDeep(activeQuestions);
      if (activeQuestions.length > 0) {
        setQuestionAnswers((prev) => {
          return activeQuestions.map((q) => {
            const found = prev?.find?.((item) => item.question === q);
            return { question: q, answer: found ? found.answer : "" };
          });
        });
      } else {
        setQuestionAnswers([]);
      }
    }
  }, [activeQuestions]);

  const handleAnswerChange = (index, questionText, val) => {
    setQuestionAnswers((prev) => {
      const updated = [...prev];
      updated[index] = { question: questionText, answer: val };
      return updated;
    });
  };

  const allQuestionsPayload = useMemo(() => {
    const list = [...(questionAnswers || [])];
    if (categoryTypeRule && ruleAnswer) {
      const qText = categoryTypeRule.question || "Is this shop located within a property that also contains residential units?";
      const existingIdx = list.findIndex(
        (q) => (categoryTypeRule.questionCode && q.questionCode === categoryTypeRule.questionCode) || q.question === qText
      );
      const ruleQObj = {
        question: qText,
        questionCode: categoryTypeRule.questionCode,
        answer: ruleAnswer,
      };
      if (existingIdx >= 0) {
        list[existingIdx] = ruleQObj;
      } else {
        list.push(ruleQObj);
      }
    }
    return list;
  }, [questionAnswers, categoryTypeRule, ruleAnswer]);

  const prevQuestionsRef = React.useRef(null);
  useEffect(() => {
    if (!_.isEqual(prevQuestionsRef.current, allQuestionsPayload)) {
      prevQuestionsRef.current = _.cloneDeep(allQuestionsPayload);
      setValue("useDetails.questions", allQuestionsPayload);
    }
  }, [allQuestionsPayload, setValue]);

  const lastSentValue = React.useRef(null);
  useEffect(() => {
    const effectiveIsMixedOcc = isInstitutionalCategory ? isMixedOcc : null;
    let effectiveMixedDetails = isInstitutionalCategory ? mixedOccRows : [];
    if (effectiveIsMixedOcc === "YES" && (!mixedOccRows || mixedOccRows.length === 0)) {
      if (mixedForm.propertyType && mixedForm.builtUpArea && mixedForm.heightOfTheBuilding) {
        effectiveMixedDetails = [
          {
            propertyType: mixedForm.propertyType,
            propertyTypeCode: mixedForm.propertyType?.code || mixedForm.propertyType?.name,
            propertyTypeName: mixedForm.propertyType?.name || mixedForm.propertyType?.code,
            builtUpArea: String(parseFloat(mixedForm.builtUpArea)),
            heightOfTheBuilding: String(parseFloat(mixedForm.heightOfTheBuilding)),
          },
        ];
      }
    }

    const payloadToSend = {
      ...formValue,
      questions: allQuestionsPayload,
      useDetails: {
        ...formValue?.useDetails,
        questions: allQuestionsPayload,
        categoryTypeSelectionQuestion: categoryTypeRule?.question || null,
        categoryTypeSelectionAnswer: ruleAnswer || null,
        categoryTypeSelectionQuestionCode: categoryTypeRule?.questionCode || null,
        isMixedOccupancy: effectiveIsMixedOcc,
        mixedOccupancyDetails: effectiveIsMixedOcc === "YES" ? effectiveMixedDetails : [],
      },
      isMixedOccupancy: effectiveIsMixedOcc,
      mixedOccupancyDetails: effectiveIsMixedOcc === "YES" ? effectiveMixedDetails : [],
    };
    if (!_.isEqual(lastSentValue.current, payloadToSend)) {
      lastSentValue.current = _.cloneDeep(payloadToSend);
      onSelect(config.key, payloadToSend);
    }
  }, [formValue, allQuestionsPayload, categoryTypeRule, ruleAnswer, isMixedOcc, mixedOccRows, mixedForm, isInstitutionalCategory, config.key, onSelect]);

  useEffect(() => {
    if (!formData?.cpt?.details) {
      if (formData?.cpt === null && initializedPropertyRef.current !== null) {
        initializedPropertyRef.current = null;
        setValue("useDetails.categoryType", null);
        setValue("useDetails.propertyCategory", null);
        setValue("useDetails.propertyType", null);
        setValue("useDetails.WaterConnectionUsageType", null);
        setValue("useDetails.plotArea", "");
        setValue("useDetails.builtUpArea", "");
        setValue("useDetails.farArea", "");
        setValue("useDetails.heightOfTheBuilding", "");
        setValue("useDetails.SelectYearofConstruction", null);
        setValue("useDetails.NumberofDwellingUnits", "");
        setValue("useDetails.NumberofRooms", "");
        setValue("useDetails.numberOfBeds", "");
        setValue("useDetails.numberOfStudents", "");
        setValue("useDetails.servantQuarterArea", "");
        setQuestionAnswers([]);
        setValue("useDetails.questions", []);
      }
      return;
    }

    // Populate the dependent dropdowns only after their master options load.
    if (!categoryTypeList.length || !ptServicesMastersData) return;

    const details = formData.cpt.details;
    const additionalDetails = details?.additionalDetails || {};
    const propKey = `${details?.propertyId}_${details?.auditDetails?.lastModifiedTime || ""}_${
      additionalDetails?.numberOfDwellingUnits || additionalDetails?.noOfDwellingUnits || ""
    }_${details?.landArea || ""}_${details?.superBuiltUpArea || ""}`;
    if (initializedPropertyRef.current === propKey) return;
    initializedPropertyRef.current = propKey;

    const usageCategory = getCode(additionalDetails.propertyCategory || additionalDetails.usageCategory || details.usageCategory);
    const catType = getCode(additionalDetails.categoryType) || (String(usageCategory).includes("RESIDENTIAL") ? "DOMESTIC" : "NON_DOMESTIC");

    setValue("useDetails.categoryType", categoryTypeList?.find((o) => normalizeCode(o.code) === normalizeCode(catType)) || null);

    const propCategoryMatch =
      categoryOptions?.find(
        (o) => normalizeCode(o.code) === normalizeCode(usageCategory) || normalizeCode(o.name) === normalizeCode(usageCategory)
      ) || ptServicesMastersData?.PropertyTax?.PropertyCategory?.find((o) => normalizeCode(o.code) === normalizeCode(usageCategory));
    setValue(
      "useDetails.propertyCategory",
      propCategoryMatch
        ? { code: propCategoryMatch.code, name: propCategoryMatch.name }
        : usageCategory
        ? { code: usageCategory, name: usageCategory }
        : null
    );

    const propTypeList = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const propTypeMatch = propTypeList.find(
      (o) => normalizeCode(o.code) === normalizeCode(getCode(additionalDetails.propertyType || details.propertyType))
    );
    setValue("useDetails.propertyType", propTypeMatch ? { code: propTypeMatch.code, name: propTypeMatch.name } : null);
    prevPropertyTypeCode.current = propTypeMatch?.code || null;

    const usageVal = getCode(additionalDetails.waterConnectionUsageType || additionalDetails.WaterConnectionUsageType);
    const usageTypeMatch = usageTypeOptions.find(
      (o) => normalizeCode(o.code) === normalizeCode(usageVal) || normalizeCode(o.name) === normalizeCode(usageVal)
    );
    setValue("useDetails.WaterConnectionUsageType", usageTypeMatch || null);
    setValue("useDetails.plotArea", additionalDetails.plotArea || details?.landArea?.toString() || "");
    setValue("useDetails.builtUpArea", additionalDetails.builtUpArea || details?.superBuiltUpArea?.toString() || "");
    setValue("useDetails.heightOfTheBuilding", additionalDetails.heightOfTheBuilding || details?.heightOfTheBuilding?.toString() || "");
    setValue("useDetails.SelectYearofConstruction", yearOptions?.find((o) => o.value === additionalDetails.yearOfConstruction) || null);
    setValue(
      "useDetails.NumberofDwellingUnits",
      additionalDetails.numberOfDwellingUnits ||
        additionalDetails.noOfDwellingUnits ||
        additionalDetails.NumberofDwellingUnits ||
        details?.noOfDwellingUnits ||
        details?.numberOfDwellingUnits ||
        details?.NumberofDwellingUnits ||
        ""
    );
    setValue("useDetails.NumberofRooms", additionalDetails.numberOfRooms || additionalDetails.noOfRooms || details?.noOfRooms || "");
    setValue("useDetails.farArea", additionalDetails.farArea || details?.farArea?.toString() || "");
    setValue("useDetails.servantQuarterArea", additionalDetails.servantQuarterArea || details?.servantQuarterArea?.toString() || "");
    setValue("useDetails.numberOfBeds", additionalDetails.numberOfBeds || details?.numberOfBeds?.toString() || "");
    setValue("useDetails.numberOfStudents", additionalDetails.numberOfStudents || details?.numberOfStudents?.toString() || "");
    const savedQAs = additionalDetails.questions || additionalDetails.questionAnswers || additionalDetails.propertyQuestions || [];
    if (Array.isArray(savedQAs) && savedQAs.length > 0) {
      setQuestionAnswers(savedQAs);
      setValue("useDetails.questions", savedQAs);
    }

    const savedIsMixed = additionalDetails.isMixedOccupancy || details?.isMixedOccupancy || null;
    const savedMixedDetails = additionalDetails.mixedOccupancyDetails || details?.mixedOccupancyDetails || [];
    if (savedIsMixed) {
      setIsMixedOcc(savedIsMixed);
      setValue("useDetails.isMixedOccupancy", savedIsMixed);
    }
    if (Array.isArray(savedMixedDetails) && savedMixedDetails.length > 0) {
      setMixedOccRows(savedMixedDetails);
      setValue("useDetails.mixedOccupancyDetails", savedMixedDetails);
    }
  }, [formData?.cpt?.details, formData?.cpt, categoryOptions, propertyTypeOptions, usageTypeOptions, yearOptions, categoryTypeList, setValue]);

  const lastErrorState = React.useRef(null);
  useEffect(() => {
    let hasErrors = Object.keys(errors).length > 0;
    // Check mixed occupancy built-up area and height equality (only for Property Creation/Edit when not read-only from property search)
    if (!isPropertyFound && isMixedOcc === "YES") {
      const parentBuilt = parseFloat(watchBuiltUpArea) || 0;
      const parentHeight = parseFloat(watchHeightOfTheBuilding) || 0;

      let effectiveRows = mixedOccRows;
      if (!effectiveRows || effectiveRows.length === 0) {
        if (mixedForm.propertyType && mixedForm.builtUpArea && mixedForm.heightOfTheBuilding) {
          effectiveRows = [
            {
              builtUpArea: mixedForm.builtUpArea,
              heightOfTheBuilding: mixedForm.heightOfTheBuilding,
            },
          ];
        }
      }

      if (!effectiveRows || effectiveRows.length === 0) {
        hasErrors = true;
      } else if (effectiveRows.length === 1) {
        // Single row (e.g. not added to table yet): check if builtUpArea and height equal parent values
        const rowBuilt = parseFloat(effectiveRows[0]?.builtUpArea) || 0;
        const rowHeight = parseFloat(effectiveRows[0]?.heightOfTheBuilding) || 0;
        if (Math.abs(rowBuilt - parentBuilt) > 0.01 || Math.abs(rowHeight - parentHeight) > 0.01) {
          hasErrors = true;
        }
      } else {
        // Multiple rows added: sum of built-up areas and sum of heights must equal parent values
        const totalUsageBuilt = effectiveRows.reduce((acc, r) => acc + (parseFloat(r.builtUpArea) || 0), 0);
        const totalUsageHeight = effectiveRows.reduce((acc, r) => acc + (parseFloat(r.heightOfTheBuilding) || 0), 0);
        if (Math.abs(totalUsageBuilt - parentBuilt) > 0.01 || Math.abs(totalUsageHeight - parentHeight) > 0.01) {
          hasErrors = true;
        }
      }
    }
    if (lastErrorState.current !== hasErrors) {
      lastErrorState.current = hasErrors;
      if (hasErrors) {
        if (setError) setError(config.key, { type: "custom", message: "Validation failed" });
      } else {
        if (clearErrors) clearErrors(config.key);
      }
    }
  }, [errors, isMixedOcc, mixedOccRows, mixedForm, watchBuiltUpArea, watchHeightOfTheBuilding, config.key, setError, clearErrors]);

  const errorStyle = { width: "70%", marginLeft: "30%", fontSize: "12px", marginTop: "-21px" };

  return (
    <React.Fragment>
      <CollapsibleCardPage
        title={t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS") + (config?.isAutomaticFill ? " " + t("(Automatic Fill by Property)") : "")}
        defaultOpen={config?.isAutomaticFill ? false : true}
        style={props.style}
      >
        <div className="formcomposer-section-grid">
          <LabelFieldPair>
            <FieldLabelWithTooltip label={t("WS_PROPERTY_CATEGORY")} isMandatory={true} infoText={t("WS_PROPERTY_CATEGORY_INFO_MSG")} />
            <div className="form-field">
              <Controller
                control={control}
                name="useDetails.propertyCategory"
                rules={{
                  validate: (val) => {
                    if (!val) return t("REQUIRED_FIELD");
                    const code = typeof val === "object" ? val?.code || val?.name : val;
                    return code && String(code).trim().length > 0 ? true : t("REQUIRED_FIELD");
                  },
                }}
                render={(props) => (
                  <Dropdown
                    option={categoryOptions}
                    optionKey="name"
                    selected={props.value}
                    select={(selected) => handleCategoryChange(selected)}
                    t={t}
                    onBlur={props.onBlur}
                    disable={isPropertyFound}
                    placeholder={t("WS_PROPERTY_CATEGORY")}
                  />
                )}
              />
              {(!watchPropertyCategory ||
                !(
                  watchPropertyCategory?.code ||
                  watchPropertyCategory?.name ||
                  (typeof watchPropertyCategory === "string" && watchPropertyCategory.trim().length > 0)
                )) &&
                errors?.useDetails?.propertyCategory && (
                  <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                    {errors.useDetails.propertyCategory.message}
                  </CardLabelError>
                )}
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip label={t("WS_PROPERTY_TYPE")} isMandatory={true} infoText={t("WS_PROPERTY_TYPE_INFO_MSG")} />
            <div className="form-field">
              <Controller
                control={control}
                name="useDetails.propertyType"
                rules={{
                  validate: (val) => {
                    if (!val) return t("REQUIRED_FIELD");
                    const code = typeof val === "object" ? val?.code || val?.name : val;
                    return code && String(code).trim().length > 0 ? true : t("REQUIRED_FIELD");
                  },
                }}
                render={(props) => (
                  <Dropdown
                    option={propertyTypeOptions}
                    optionKey="name"
                    selected={props.value}
                    select={(selected) => {
                      props.onChange(selected);
                      setValue("useDetails.propertyType", selected, { shouldValidate: false, shouldDirty: true });
                      if (formClearErrors) formClearErrors("useDetails.propertyType");
                      if (clearErrors) clearErrors("useDetails.propertyType");
                      prevPropertyTypeCode.current = selected?.code;
                      autoFillFromPropertyType(selected);
                    }}
                    t={t}
                    onBlur={props.onBlur}
                    disable={isPropertyFound || !hasSelectedCategory}
                    placeholder={
                      !hasSelectedCategory
                        ? t("WS_SELECT_PROPERTY_CATEGORY_FIRST") && t("WS_SELECT_PROPERTY_CATEGORY_FIRST") !== "WS_SELECT_PROPERTY_CATEGORY_FIRST"
                          ? t("WS_SELECT_PROPERTY_CATEGORY_FIRST")
                          : "Select Property Category first"
                        : t("WS_PROPERTY_TYPE")
                    }
                  />
                )}
              />
              {(!watchPropertyType ||
                !(
                  watchPropertyType?.code ||
                  watchPropertyType?.name ||
                  (typeof watchPropertyType === "string" && watchPropertyType.trim().length > 0)
                )) &&
                errors?.useDetails?.propertyType && (
                  <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                    {errors.useDetails.propertyType.message}
                  </CardLabelError>
                )}
            </div>
          </LabelFieldPair>

          {categoryTypeRule && (
            <LabelFieldPair key="categoryTypeSelectionRule">
              <CardLabel style={{ whiteSpace: "normal", wordBreak: "break-word", fontWeight: "bold" }}>
                <strong>
                  {categoryTypeRule.question?.toLowerCase().startsWith("question")
                    ? categoryTypeRule.question
                    : `Question : ${categoryTypeRule.question}`}
                </strong>
              </CardLabel>
              <div className="form-field" style={{ display: "flex", alignItems: "center" }}>
                <RadioButtons
                  t={t}
                  name="categoryTypeRuleRadio"
                  options={[
                    { code: "YES", name: t("CS_COMMON_YES") && t("CS_COMMON_YES") !== "CS_COMMON_YES" ? t("CS_COMMON_YES") : "Yes" },
                    { code: "NO", name: t("CS_COMMON_NO") && t("CS_COMMON_NO") !== "CS_COMMON_NO" ? t("CS_COMMON_NO") : "No" },
                  ]}
                  optionsKey="name"
                  selectedOption={
                    ruleAnswer
                      ? {
                          code: ruleAnswer,
                          name:
                            ruleAnswer === "YES"
                              ? t("CS_COMMON_YES") && t("CS_COMMON_YES") !== "CS_COMMON_YES"
                                ? t("CS_COMMON_YES")
                                : "Yes"
                              : t("CS_COMMON_NO") && t("CS_COMMON_NO") !== "CS_COMMON_NO"
                              ? t("CS_COMMON_NO")
                              : "No",
                        }
                      : null
                  }
                  onSelect={handleCategoryTypeRuleSelect}
                  disabled={isPropertyFound}
                  style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "0px" }}
                />
              </div>
            </LabelFieldPair>
          )}

          {activeQuestions &&
            activeQuestions.length > 0 &&
            activeQuestions.map((questionText, index) => {
              const rawQ = String(questionText || "").trim();
              const translatedQ =
                rawQ === "numberOfDwellingUnits" || rawQ.toLowerCase() === "numberofdwellingunits"
                  ? t("WS_NUMBER_OF_DWELLING_UNITS") && t("WS_NUMBER_OF_DWELLING_UNITS") !== "WS_NUMBER_OF_DWELLING_UNITS"
                    ? t("WS_NUMBER_OF_DWELLING_UNITS")
                    : "Number of Dwelling Units"
                  : t(rawQ);
              const label = translatedQ.toLowerCase().startsWith("question") ? translatedQ : `Question : ${translatedQ}`;
              const isInvalid = !questionAnswers[index]?.answer || String(questionAnswers[index]?.answer).trim() === "";
              return (
                <LabelFieldPair key={`question_${index}_${rawQ}`}>
                  <CardLabel style={{ whiteSpace: "normal", wordBreak: "break-word", fontWeight: "bold" }}>
                    <strong>
                      {label}
                      <span className="check-page-link-button" style={{ color: "red" }}>
                        {" "}
                        *
                      </span>
                    </strong>
                  </CardLabel>
                  <div className="form-field">
                    <TextInput
                      name={`useDetails.question_${index}`}
                      value={questionAnswers[index]?.answer !== undefined ? questionAnswers[index].answer : ""}
                      disabled={isPropertyFound}
                      placeholder="Enter Answer"
                      onChange={(e) => handleAnswerChange(index, questionText, e.target.value)}
                    />
                  </div>
                </LabelFieldPair>
              );
            })}

          <LabelFieldPair>
            <FieldLabelWithTooltip label={t("WS_CATEGORY_TYPE")} isMandatory={true} infoText={t("WS_CATEGORY_TYPE_INFO_MSG")} />
            <div className="form-field">
              <Controller
                control={control}
                name={"useDetails.categoryType"}
                rules={{
                  validate: (val) => {
                    if (!val) return t("REQUIRED_FIELD");
                    const code = typeof val === "object" ? val?.code || val?.name : val;
                    return code && String(code).trim().length > 0 ? true : t("REQUIRED_FIELD");
                  },
                }}
                render={(props) => (
                  <Dropdown
                    option={availableCategoryOptions}
                    optionKey="i18nKey"
                    selected={props.value}
                    select={(selected) => {
                      props.onChange(selected);
                      if (formClearErrors) formClearErrors("useDetails.categoryType");
                      if (clearErrors) clearErrors("useDetails.categoryType");
                      if (categoryTypeRule?.rules) {
                        const norm = normalizeCode(selected?.code || selected?.name);
                        const matchedRule = categoryTypeRule.rules.find((r) => normalizeCode(r.categoryType) === norm);
                        if (matchedRule) {
                          const ansUpper = String(matchedRule.answer).toUpperCase();
                          setRuleAnswer(ansUpper);
                          setValue("useDetails.categoryTypeSelectionAnswer", ansUpper, { shouldDirty: true });
                        }
                      }
                    }}
                    t={t}
                    onBlur={props.onBlur}
                    disable={true}
                    placeholder={t("WS_CATEGORY_TYPE")}
                  />
                )}
              />
              {(!watchCategoryType ||
                !(
                  watchCategoryType?.code ||
                  watchCategoryType?.name ||
                  (typeof watchCategoryType === "string" && watchCategoryType.trim().length > 0)
                )) &&
                errors?.useDetails?.categoryType && (
                  <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                    {errors.useDetails.categoryType.message}
                  </CardLabelError>
                )}
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_WATER_CONNECTION_USAGE_TYPE")}
              isMandatory={true}
              infoText={t("WS_WATER_CONNECTION_USAGE_TYPE_INFO_MSG")}
            />
            <div className="form-field">
              <Controller
                control={control}
                name="useDetails.WaterConnectionUsageType"
                rules={{
                  validate: (val) => {
                    if (!val) return t("REQUIRED_FIELD");
                    const code = typeof val === "object" ? val?.code || val?.name || val?.value : val;
                    return code && String(code).trim().length > 0 ? true : t("REQUIRED_FIELD");
                  },
                }}
                render={(props) => (
                  <Dropdown
                    option={usageTypeOptions}
                    optionKey="name"
                    selected={props.value}
                    select={props.onChange}
                    t={t}
                    onBlur={props.onBlur}
                    disable={true}
                    placeholder={t("WS_WATER_CONNECTION_USAGE_TYPE")}
                  />
                )}
              />
              {(!watchWaterConnectionUsageType ||
                !(
                  watchWaterConnectionUsageType?.code ||
                  watchWaterConnectionUsageType?.name ||
                  watchWaterConnectionUsageType?.value ||
                  (typeof watchWaterConnectionUsageType === "string" && watchWaterConnectionUsageType.trim().length > 0)
                )) &&
                errors?.useDetails?.WaterConnectionUsageType && (
                  <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                    {errors.useDetails.WaterConnectionUsageType.message}
                  </CardLabelError>
                )}
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip label={t("WS_PLOT_AREA")} isMandatory={true} infoText={t("WS_PLOT_AREA_INFO_MSG")} />
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  required: t("REQUIRED_FIELD"),
                  pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                  validate: (value) => {
                    const built = parseFloat(watchBuiltUpArea);
                    const plot = parseFloat(value);
                    if (!isNaN(plot) && !isNaN(built) && plot < built) {
                      return getPlotAreaError();
                    }
                    return true;
                  },
                })}
                rules={{ required: t("REQUIRED_FIELD") }}
                name="useDetails.plotArea"
                disabled={isPropertyFound}
                placeholder={t("WS_PLOT_AREA")}
                onBlur={handleAreaBlur}
              />
              {errors?.useDetails?.plotArea && (
                <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>{errors.useDetails.plotArea.message}</CardLabelError>
              )}
            </div>
          </LabelFieldPair>

          <LabelFieldPair>
            <FieldLabelWithTooltip label={t("WS_BUILT_UP_AREA")} isMandatory={true} infoText={t("WS_BUILT_UP_AREA_INFO_MSG")} />
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  required: t("REQUIRED_FIELD"),
                  pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                  validate: (value) => {
                    const plot = parseFloat(watchPlotArea);
                    const built = parseFloat(value);
                    if (!isNaN(plot) && !isNaN(built) && plot < built) {
                      return getPlotAreaError();
                    }
                    return true;
                  },
                })}
                name="useDetails.builtUpArea"
                rules={{ required: t("REQUIRED_FIELD") }}
                disabled={isPropertyFound}
                placeholder={t("WS_BUILT_UP_AREA")}
                onBlur={handleAreaBlur}
              />
              {errors?.useDetails?.builtUpArea ? (
                <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                  {errors.useDetails.builtUpArea.message}
                </CardLabelError>
              ) : isPlotAreaInvalid ? (
                <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>{getPlotAreaError()}</CardLabelError>
              ) : null}
            </div>
          </LabelFieldPair>
          {/* <div>
          <LabelFieldPair>
            <CardLabel>{`${t("WS_FAR_AREA")}`}</CardLabel>
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                  validate: (value) => {
                    if (formValue?.useDetails?.builtUpArea && parseFloat(value) > parseFloat(formValue?.useDetails?.builtUpArea)) {
                      return t("WS_FAR_AREA_IS_SMALLER_THAN_BUILT_UP_AREA");
                    }
                  },
                })}
                name="useDetails.farArea"
                disabled={isPropertyFound}
              />
            </div>
          </LabelFieldPair>
          {errors?.useDetails?.farArea && <CardLabelError style={errorStyle}>{errors.useDetails.farArea.message}</CardLabelError>}
          {formValue?.useDetails?.farArea &&
            formValue?.useDetails?.builtUpArea &&
            parseFloat(formValue?.useDetails?.farArea) > parseFloat(formValue?.useDetails?.builtUpArea) && (
              <CardLabelError style={{ width: "70%", marginLeft: "30%", fontSize: "12px", marginTop: "5px" }}>
                {t("WS_FAR_AREA_IS_SMALLER_THAN_BUILT_UP_AREA")}
              </CardLabelError>
            )}
        </div> */}
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_HEIGHT_OF_THE_BUILDING(meters)")}
              isMandatory={true}
              infoText={t("WS_HEIGHT_OF_THE_BUILDING_INFO_MSG")}
            />
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  required: t("REQUIRED_FIELD"),
                  validate: (value) => {
                    if (!value) return t("REQUIRED_FIELD");
                    const usageCode =
                      typeof watchWaterConnectionUsageType === "object"
                        ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
                        : watchWaterConnectionUsageType;
                    const isNormal = normalizeCode(usageCode) === "NORMAL";
                    const valStr = String(value).trim();
                    if (isNormal) {
                      if (!/^\d+(\.\d{1,2})?$/.test(valStr)) {
                        const trans = t("WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR");
                        return trans && trans !== "WS_HEIGHT_UPTO_TWO_DECIMAL_ERROR"
                          ? trans
                          : "Height of the building can have up to two decimal places only.";
                      }
                      const height = parseFloat(valStr);
                      if (!isNaN(height) && height > 17.5) {
                        return getHeightErrorMessage();
                      }
                    } else {
                      if (!/^\d+$/.test(valStr)) {
                        const trans = t("WS_HEIGHT_INTEGER_ONLY_ERROR");
                        return trans && trans !== "WS_HEIGHT_INTEGER_ONLY_ERROR"
                          ? trans
                          : "Decimal values are not allowed. Please enter a whole number.";
                      }
                    }
                    return true;
                  },
                })}
                name="useDetails.heightOfTheBuilding"
                rules={{ required: t("REQUIRED_FIELD") }}
                disabled={isPropertyFound}
                placeholder={t("WS_HEIGHT_OF_THE_BUILDING")}
                value={watchHeightOfTheBuilding !== undefined && watchHeightOfTheBuilding !== null ? watchHeightOfTheBuilding : ""}
                onChange={handleHeightChange}
                onBlur={handleHeightBlur}
              />
              {errors?.useDetails?.heightOfTheBuilding ? (
                <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                  {errors.useDetails.heightOfTheBuilding.message}
                </CardLabelError>
              ) : isHeightInvalid ? (
                <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>{getHeightErrorMessage()}</CardLabelError>
              ) : null}
            </div>
          </LabelFieldPair>
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_SELECT_YEAR_OF_CONSTRUCTION")}
              isMandatory={false}
              infoText={t("WS_SELECT_YEAR_OF_CONSTRUCTION_INFO_MSG")}
            />
            <div className="form-field">
              <Controller
                control={control}
                name="useDetails.SelectYearofConstruction"
                // rules={{ required: t("REQUIRED_FIELD") }}
                render={(props) => (
                  <Dropdown
                    option={yearOptions}
                    optionKey="value"
                    selected={props.value}
                    select={props.onChange}
                    t={t}
                    onBlur={props.onBlur}
                    disable={isPropertyFound}
                    placeholder={t("WS_SELECT_YEAR_OF_CONSTRUCTION")}
                  />
                )}
              />
              {errors?.useDetails?.SelectYearofConstruction && (
                <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                  {errors.useDetails.SelectYearofConstruction.message}
                </CardLabelError>
              )}
            </div>
          </LabelFieldPair>

          {/* Frontend questions commented out - only MDMS questions are asked */}
          {/* {isSchoolCollegeProperty ? (
          <React.Fragment>
            <LabelFieldPair>
              <FieldLabelWithTooltip
                label={t("WS_NUMBER_OF_STUDENTS")}
                isMandatory={false}
                infoText={t("WS_NUMBER_OF_STUDENTS_INFO_MSG")}
              />
              <div className="form-field">
                <TextInput
                  t={t}
                  inputRef={register({
                    pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                  })}
                  name="useDetails.numberOfStudents"
                  disabled={isPropertyFound}
                  placeholder={t("WS_NUMBER_OF_STUDENTS")}
                />
                {errors?.useDetails?.numberOfStudents && (
                  <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                    {errors.useDetails.numberOfStudents.message}
                  </CardLabelError>
                )}
              </div>
            </LabelFieldPair>
          </React.Fragment>
        ) : null}

        {isHotelRestaurantProperty ? (
          <React.Fragment>
            <LabelFieldPair>
              <FieldLabelWithTooltip
                label={t("WS_NUMBER_OF_ROOMS")}
                isMandatory={true}
                infoText={t("WS_NUMBER_OF_ROOMS_INFO_MSG")}
              />
              <div className="form-field">
                <TextInput
                  t={t}
                  inputRef={register({
                    pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                    required: isHotelRestaurantProperty ? t("REQUIRED_FIELD") : false,
                  })}
                  name="useDetails.NumberofRooms"
                  disabled={isPropertyFound}
                  placeholder={t("WS_NUMBER_OF_ROOMS")}
                />
                {errors?.useDetails?.NumberofRooms && (
                  <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                    {errors.useDetails.NumberofRooms.message}
                  </CardLabelError>
                )}
              </div>
            </LabelFieldPair>
          </React.Fragment>
        ) : null}

        {isHospitalProperty ? (
          <React.Fragment>
            <LabelFieldPair>
              <FieldLabelWithTooltip
                label={t("WS_NUMBER_OF_BEDS")}
                isMandatory={true}
                infoText={t("WS_NUMBER_OF_BEDS_INFO_MSG")}
              />
              <div className="form-field">
                <TextInput
                  t={t}
                  inputRef={register({
                    pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                    required: isHospitalProperty ? t("REQUIRED_FIELD") : false,
                  })}
                  name="useDetails.numberOfBeds"
                  disabled={isPropertyFound}
                  placeholder={t("WS_NUMBER_OF_BEDS")}
                />
                {errors?.useDetails?.numberOfBeds && (
                  <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                    {errors.useDetails.numberOfBeds.message}
                  </CardLabelError>
                )}
              </div>
            </LabelFieldPair>
          </React.Fragment>
        ) : null}

        {isDwellingUnit ? (
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_NUMBER_OF_DWELLING_UNITS")}
              isMandatory={true}
              infoText={t("WS_NUMBER_OF_DWELLING_UNITS_INFO_MSG")}
            />
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                  required: isDwellingUnit ? t("REQUIRED_FIELD") : false,
                })}
                name="useDetails.NumberofDwellingUnits"
                disabled={isPropertyFound}
                rules={{ required: t("REQUIRED_FIELD") }}
                placeholder={t("WS_NUMBER_OF_DWELLING_UNITS")}
              />
              {errors?.useDetails?.NumberofDwellingUnits && (
                <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                  {errors.useDetails.NumberofDwellingUnits.message}
                </CardLabelError>
              )}
            </div>
          </LabelFieldPair>
        ) : null} */}

          {/* {isServentHouse ? (
          <LabelFieldPair>
            <CardLabel>{`${t("WS_SERVENT_HOUSE")}`}</CardLabel>
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                })}
                name="useDetails.servantQuarterArea"
                disabled={isPropertyFound}
                placeholder={t("WS_SERVENT_HOUSE")}
              />
            </div>
          </LabelFieldPair>
        ) : null}
        {isServentHouse && errors?.useDetails?.servantQuarterArea && (
          <CardLabelError style={errorStyle}>{errors.useDetails.servantQuarterArea.message}</CardLabelError>
        )} */}
        </div>
      </CollapsibleCardPage>

      {/* Mixed Occupancy Section - Only for Institutional category */}
      {isInstitutionalCategory && (
        <CollapsibleCardPage
          title={t("WS_MIXED_OCCUPANCY_TITLE") || "Mixed Occupancy Details"}
          defaultOpen={config?.isAutomaticFill ? false : true}
          style={{ marginTop: "24px", ...props.style }}
        >
        <div style={{ padding: "8px 0" }}>
          {/* Mixed Occupancy Question */}
          <div style={{ marginBottom: "20px" }}>
            <CardLabel style={{ fontWeight: "600", fontSize: "16px", marginBottom: "6px" }}>
              {t("WS_IS_PROPERTY_USED_FOR_MIXED_OCCUPANCIES") || "Is this property used for mixed occupancies?"}
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>
            </CardLabel>
            <div style={{ fontSize: "13px", color: "#505a5f", marginBottom: "12px" }}>
              {t("WS_MIXED_OCCUPANCIES_INFO_MSG") ||
                "Does this property include multiple types of usage, such as residential block, medical shop, etc.?"}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <RadioButtons
                t={t}
                name="mixedOccupancyRadio"
                disabled={isPropertyFound}
                options={[
                  { code: "YES", name: t("CS_COMMON_YES") && t("CS_COMMON_YES") !== "CS_COMMON_YES" ? t("CS_COMMON_YES") : "Yes" },
                  { code: "NO", name: t("CS_COMMON_NO") && t("CS_COMMON_NO") !== "CS_COMMON_NO" ? t("CS_COMMON_NO") : "No" },
                ]}
                optionsKey="name"
                isPTFlow={true}
                selectedOption={
                  isMixedOcc
                    ? {
                        code: isMixedOcc,
                        name:
                          isMixedOcc === "YES"
                            ? t("CS_COMMON_YES") && t("CS_COMMON_YES") !== "CS_COMMON_YES"
                              ? t("CS_COMMON_YES")
                              : "Yes"
                            : t("CS_COMMON_NO") && t("CS_COMMON_NO") !== "CS_COMMON_NO"
                            ? t("CS_COMMON_NO")
                            : "No",
                      }
                    : null
                }
                onSelect={(option) => {
                  if (isPropertyFound) return;
                  const choice = typeof option === "object" ? option?.code : option;
                  setIsMixedOcc(choice);
                  setValue("useDetails.isMixedOccupancy", choice, { shouldDirty: true });
                  if (choice === "NO") {
                    setMixedOccRows([]);
                    setEditingRowIndex(null);
                    setMixedForm({ propertyType: null, builtUpArea: "", heightOfTheBuilding: "" });
                    setValue("useDetails.mixedOccupancyDetails", [], { shouldDirty: true });
                  }
                }}
                style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "0px" }}
              />
            </div>
          </div>

          {/* If YES, show Add Details of Usage of Property */}
          {isMixedOcc === "YES" && (
            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "20px", marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "16px" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#0b0c0c" }}>
                    {isPropertyFound ? t("WS_MIXED_OCCUPANCY_DETAILS") || "Mixed Occupancy Details" : t("WS_ADD_DETAILS_OF_USAGE_OF_PROPERTY") || "Add Details of Usage of Property"}
                  </h4>
                  {!isPropertyFound && (
                    <div style={{ fontSize: "13px", color: "#505a5f" }}>
                      {t("WS_MIXED_USAGE_DESC_PREFIX") ||
                        "Add each property usage type with its built-up area and height of the building. The total built-up area must be equal to "}
                      <strong>{watchBuiltUpArea ? `${parseFloat(watchBuiltUpArea) || 0} sq. meter` : t("WS_PARENT_BUILT_UP_AREA")}</strong>
                      {"."}
                    </div>
                  )}
                </div>
              </div>

              {/* Form to Add / Edit a Usage Type row (Only shown in Property Creation / Edit, NOT in New Connection / old-application) */}
              {!isPropertyFound && (
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5ebf3",
                    borderRadius: "4px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px", color: "#0b0c0c" }}>
                    {editingRowIndex !== null ? `${t("WS_EDIT_PROPERTY_USAGE")} (#${editingRowIndex + 1})` : t("WS_ADD_NEW_PROPERTY_USAGE")}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", alignItems: "flex-start" }}>
                    {/* 1. Select Property Type */}
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                        {t("WS_PROPERTY_TYPE")} <span style={{ color: "red" }}>*</span>
                      </div>
                      <Dropdown
                        option={allPropertyTypeOptions}
                        optionKey="name"
                        selected={mixedForm.propertyType}
                        select={(val) => setMixedForm((prev) => ({ ...prev, propertyType: val }))}
                        t={t}
                        placeholder={t("WS_PROPERTY_TYPE")}
                      />
                    </div>

                    {/* 2. Enter Built-up Area */}
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                        {t("WS_BUILT_UP_AREA")} <span style={{ color: "red" }}>*</span>
                      </div>
                      <TextInput
                        t={t}
                        type="text"
                        value={mixedForm.builtUpArea}
                        placeholder={t("WS_BUILT_UP_AREA")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || DECIMAL_PATTERN.test(val)) {
                            setMixedForm((prev) => ({ ...prev, builtUpArea: val }));
                          }
                        }}
                      />
                    </div>

                    {/* 3. Enter Height of the Building */}
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                        {t("WS_HEIGHT_OF_THE_BUILDING(meters)")} <span style={{ color: "red" }}>*</span>
                      </div>
                      <TextInput
                        t={t}
                        type="text"
                        value={mixedForm.heightOfTheBuilding}
                        placeholder={t("WS_HEIGHT_OF_THE_BUILDING")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || DECIMAL_PATTERN.test(val)) {
                            setMixedForm((prev) => ({ ...prev, heightOfTheBuilding: val }));
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Add / Update / Cancel Buttons */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end" }}>
                    {editingRowIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRowIndex(null);
                          setMixedForm({ propertyType: null, builtUpArea: "", heightOfTheBuilding: "" });
                        }}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#fff",
                          border: "1px solid #d6d5d4",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {t("CS_COMMON_CANCEL") || "Cancel"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!mixedForm.propertyType) {
                          setShowToast({ key: true, label: t("WS_ERR_SELECT_PROPERTY_TYPE") || "Please select Property Type" });
                          return;
                        }
                        if (!mixedForm.builtUpArea || isNaN(parseFloat(mixedForm.builtUpArea)) || parseFloat(mixedForm.builtUpArea) <= 0) {
                          setShowToast({ key: true, label: t("WS_ERR_VALID_BUILT_UP_AREA") || "Please enter valid Built-up Area" });
                          return;
                        }
                        if (
                          !mixedForm.heightOfTheBuilding ||
                          isNaN(parseFloat(mixedForm.heightOfTheBuilding)) ||
                          parseFloat(mixedForm.heightOfTheBuilding) <= 0
                        ) {
                          setShowToast({ key: true, label: t("WS_ERR_VALID_HEIGHT") || "Please enter valid Height of The Building" });
                          return;
                        }

                        const newRow = {
                          propertyType: mixedForm.propertyType,
                          propertyTypeCode: mixedForm.propertyType?.code || mixedForm.propertyType?.name,
                          propertyTypeName: mixedForm.propertyType?.name || mixedForm.propertyType?.code,
                          builtUpArea: String(parseFloat(mixedForm.builtUpArea)),
                          heightOfTheBuilding: String(parseFloat(mixedForm.heightOfTheBuilding)),
                        };

                        let updatedRows;
                        if (editingRowIndex !== null) {
                          updatedRows = mixedOccRows.map((r, idx) => (idx === editingRowIndex ? newRow : r));
                          setEditingRowIndex(null);
                        } else {
                          updatedRows = [...mixedOccRows, newRow];
                        }
                        setMixedOccRows(updatedRows);
                        setValue("useDetails.mixedOccupancyDetails", updatedRows, { shouldDirty: true });
                        setMixedForm({ propertyType: null, builtUpArea: "", heightOfTheBuilding: "" });
                      }}
                      style={{
                        padding: "8px 18px",
                        backgroundColor: "#00703c",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {editingRowIndex !== null ? `✓ ${t("CS_COMMON_UPDATE") || "Update Usage"}` : `+ ${t("WS_ADD_USAGE") || "Add Usage"}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Usage Table */}
              {mixedOccRows.length > 0 ? (
                <div style={{ overflowX: "auto", border: "1px solid #e0e0e0", borderRadius: "4px", marginBottom: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: "10px 14px", width: "40px" }}>{t("CS_COMMON_S_NO")}</th>
                        <th style={{ padding: "10px 14px" }}>{t("WS_PROPERTY_TYPE")}</th>
                        <th style={{ padding: "10px 14px" }}>{t("WS_BUILT_UP_AREA")}</th>
                        <th style={{ padding: "10px 14px" }}>{t("WS_HEIGHT_OF_THE_BUILDING(meters)")}</th>
                        {!isPropertyFound && (
                          <th style={{ padding: "10px 14px", textAlign: "center", width: "100px" }}>{t("CS_COMMON_ACTIONS")} *</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {mixedOccRows.map((row, idx) => {
                        return (
                          <tr
                            key={`mixed_row_${idx}`}
                            style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}
                          >
                            <td style={{ padding: "10px 14px" }}>{idx + 1}</td>
                            <td style={{ padding: "10px 14px", fontWeight: "600", color: "#0b0c0c" }}>
                              {row.propertyTypeName || row.propertyType?.name || row.propertyTypeCode}
                            </td>
                            <td style={{ padding: "10px 14px" }}>{row.builtUpArea} sq. meter</td>
                            <td style={{ padding: "10px 14px" }}>
                              {row.heightOfTheBuilding} meter
                            </td>
                            {!isPropertyFound && (
                              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", gap: "14px", alignItems: "center" }}>
                                  <span
                                    title={t("CS_COMMON_EDIT") || "Edit"}
                                    onClick={() => {
                                      setEditingRowIndex(idx);
                                      setMixedForm({
                                        propertyType: row.propertyType ||
                                          allPropertyTypeOptions.find((p) => p.code === row.propertyTypeCode) || {
                                            name: row.propertyTypeName,
                                            code: row.propertyTypeCode,
                                          },
                                        builtUpArea: row.builtUpArea,
                                        heightOfTheBuilding: row.heightOfTheBuilding,
                                      });
                                    }}
                                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                                  >
                                    <EditIcon style={{ width: "18px", height: "18px", fill: "#00703c" }} />
                                  </span>
                                  <span
                                    title={t("CS_COMMON_DELETE") || "Delete"}
                                    onClick={() => {
                                      const filtered = mixedOccRows.filter((_, i) => i !== idx);
                                      setMixedOccRows(filtered);
                                      setValue("useDetails.mixedOccupancyDetails", filtered, { shouldDirty: true });
                                      if (editingRowIndex === idx) {
                                        setEditingRowIndex(null);
                                        setMixedForm({ propertyType: null, builtUpArea: "", heightOfTheBuilding: "" });
                                      }
                                    }}
                                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                                  >
                                    <DeleteIcon style={{ width: "18px", height: "18px", fill: "#d4351c" }} />
                                  </span>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CollapsibleCardPage>
      )}
      {showToast && (
        <Toast
          error={showToast.key}
          label={showToast.label}
          isDleteBtn={true}
          onClose={() => {
            setShowToast(null);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default PropertyWaterConnection;
