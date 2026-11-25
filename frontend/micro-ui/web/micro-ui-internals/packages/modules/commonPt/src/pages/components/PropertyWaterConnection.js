import { LabelFieldPair, Dropdown, TextInput, CardLabelError, CardLabel, CollapsibleCardPage, Toast, FieldLabelWithTooltip, RadioButtons } from "@djb25/digit-ui-react-components";
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
    const trans = t("WS_HEIGHT_OF_BUILDING_NORMAL_ERROR");
    return trans && trans !== "WS_HEIGHT_OF_BUILDING_NORMAL_ERROR"
      ? trans
      : "Height of the building must be 17.5 meters or less for Normal connection.";
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
    const usageCode = typeof watchWaterConnectionUsageType === "object"
      ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
      : watchWaterConnectionUsageType;
    const isNormal = normalizeCode(usageCode) === "NORMAL";
    if (!isNormal) return false;
    const height = parseFloat(watchHeightOfTheBuilding);
    return !isNaN(height) && height > 17.5;
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

  const handleHeightBlur = (e) => {
    const usageCode = typeof watchWaterConnectionUsageType === "object"
      ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
      : watchWaterConnectionUsageType;
    const isNormal = normalizeCode(usageCode) === "NORMAL";
    const height = parseFloat(e?.target?.value !== undefined ? e.target.value : watchHeightOfTheBuilding);
    if (isNormal && !isNaN(height) && height > 17.5) {
      setShowToast({
        key: true,
        label: getHeightErrorMessage(),
      });
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
        typeof watchPropertyCategory === "object"
          ? watchPropertyCategory?.name || watchPropertyCategory?.code
          : String(watchPropertyCategory);
      const code =
        typeof watchPropertyCategory === "object"
          ? watchPropertyCategory?.code || watchPropertyCategory?.name
          : String(watchPropertyCategory);
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
      typeof watchPropertyCategory === "object"
        ? watchPropertyCategory?.code || watchPropertyCategory?.name
        : watchPropertyCategory;
    const catNorm = normalizeCode(selectedCategory);

    let filtered = catNorm ? activeList.filter((item) => matchesCategory(item, catNorm)) : [];

    if (
      watchPropertyType?.code &&
      !filtered.some((item) => normalizeCode(item.code) === normalizeCode(watchPropertyType.code))
    ) {
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
    typeof watchPropertyCategory === "object"
      ? watchPropertyCategory?.code || watchPropertyCategory?.name
      : watchPropertyCategory;
  const hasSelectedCategory = Boolean(normalizeCode(selectedCategoryCode));

  const handleCategoryChange = (selectedCategory) => {
    setRuleAnswer(null);
    setValue("useDetails.categoryTypeSelectionAnswer", null);
    setValue("useDetails.propertyCategory", selectedCategory, { shouldValidate: true, shouldDirty: true });
    if (clearErrors) clearErrors("useDetails.propertyCategory");
    if (formClearErrors) formClearErrors("useDetails.propertyCategory");

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
      const selNorm = normalizeCode(
        typeof selectedCategory === "object" ? selectedCategory?.code || selectedCategory?.name : selectedCategory
      );
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
    const catCode =
      typeof watchPropertyCategory === "object"
        ? watchPropertyCategory?.code || watchPropertyCategory?.name
        : watchPropertyCategory;
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
    return (
      formData?.[config?.key]?.useDetails?.categoryTypeSelectionAnswer ||
      formData?.[config?.key]?.categoryTypeSelectionAnswer ||
      null
    );
  });

  const handleCategoryTypeRuleSelect = (option) => {
    const ansCode = String(option?.code || option?.name || option || "").toUpperCase();
    setRuleAnswer(ansCode);
    setValue("useDetails.categoryTypeSelectionAnswer", ansCode, { shouldDirty: true });

    const matchedRule = categoryTypeRule?.rules?.find(
      (r) => String(r.answer || "").toUpperCase() === ansCode
    );

    const targetCategoryTypeName = matchedRule?.categoryType;
    if (targetCategoryTypeName) {
      const normTarget = normalizeCode(targetCategoryTypeName);
      const targetCat = categoryTypeList.find(
        (c) => normalizeCode(c.code) === normTarget || normalizeCode(c.name) === normTarget
      ) || {
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
            const targetCat = categoryTypeList.find(
              (c) => normalizeCode(c.code) === normTarget || normalizeCode(c.name) === normTarget
            ) || {
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
    [propertyType2List, ptServicesMastersData, categoryTypeList, categoryOptions, usageTypeOptions, setValue, clearErrors, formClearErrors, t, isCommercialCategory, ruleAnswer, formData, config]
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
    const payloadToSend = {
      ...formValue,
      questions: allQuestionsPayload,
      useDetails: {
        ...formValue?.useDetails,
        questions: allQuestionsPayload,
        categoryTypeSelectionQuestion: categoryTypeRule?.question || null,
        categoryTypeSelectionAnswer: ruleAnswer || null,
        categoryTypeSelectionQuestionCode: categoryTypeRule?.questionCode || null,
      },
    };
    if (!_.isEqual(lastSentValue.current, payloadToSend)) {
      lastSentValue.current = _.cloneDeep(payloadToSend);
      onSelect(config.key, payloadToSend);
    }
  }, [formValue, allQuestionsPayload, categoryTypeRule, ruleAnswer, config.key, onSelect]);

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
    const propKey = `${details?.propertyId}_${details?.auditDetails?.lastModifiedTime || ""}_${additionalDetails?.numberOfDwellingUnits || additionalDetails?.noOfDwellingUnits || ""}_${details?.landArea || ""}_${details?.superBuiltUpArea || ""}`;
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
  }, [formData?.cpt?.details, formData?.cpt, categoryOptions, propertyTypeOptions, usageTypeOptions, yearOptions, categoryTypeList, setValue]);

  const lastErrorState = React.useRef(null);
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (lastErrorState.current !== hasErrors) {
      lastErrorState.current = hasErrors;
      if (hasErrors) {
        if (setError) setError(config.key, { type: "custom", message: "Validation failed" });
      } else {
        if (clearErrors) clearErrors(config.key);
      }
    }
  }, [errors, config.key, setError, clearErrors]);

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
          <FieldLabelWithTooltip
            label={t("WS_PROPERTY_CATEGORY")}
            isMandatory={true}
            infoText={t("WS_PROPERTY_CATEGORY_INFO_MSG")}
          />
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
          <FieldLabelWithTooltip
            label={t("WS_PROPERTY_TYPE")}
            isMandatory={true}
            infoText={t("WS_PROPERTY_TYPE_INFO_MSG")}
          />
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
            const label = rawQ.toLowerCase().startsWith("question") ? rawQ : `Question : ${rawQ}`;
            return (
              <LabelFieldPair key={`question_${index}_${rawQ}`}>
                <CardLabel style={{ whiteSpace: "normal", wordBreak: "break-word", fontWeight: "bold" }}>
                  <strong>{label}</strong>
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
          <FieldLabelWithTooltip
            label={t("WS_CATEGORY_TYPE")}
            isMandatory={true}
            infoText={t("WS_CATEGORY_TYPE_INFO_MSG")}
          />
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
                  disable={isPropertyFound}
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
          <FieldLabelWithTooltip
            label={t("WS_PLOT_AREA")}
            isMandatory={true}
            infoText={t("WS_PLOT_AREA_INFO_MSG")}
          />
          <div className="form-field">
            <TextInput
              t={t}
              inputRef={register({
                required: t("REQUIRED_FIELD"),
                pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                validate: (value) => {
                  const built = parseFloat(watchBuiltUpArea);
                  const plot = parseFloat(value);
                  if (!isNaN(plot) && !isNaN(built) && plot <= built) {
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
              <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                {errors.useDetails.plotArea.message}
              </CardLabelError>
            )}
          </div>
        </LabelFieldPair>

        <LabelFieldPair>
          <FieldLabelWithTooltip
            label={t("WS_BUILT_UP_AREA")}
            isMandatory={true}
            infoText={t("WS_BUILT_UP_AREA_INFO_MSG")}
          />
          <div className="form-field">
            <TextInput
              t={t}
              inputRef={register({
                required: t("REQUIRED_FIELD"),
                pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                validate: (value) => {
                  const plot = parseFloat(watchPlotArea);
                  const built = parseFloat(value);
                  if (!isNaN(plot) && !isNaN(built) && plot <= built) {
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
              <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                {getPlotAreaError()}
              </CardLabelError>
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
                pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                validate: (value) => {
                  const usageCode = typeof watchWaterConnectionUsageType === "object"
                    ? watchWaterConnectionUsageType?.code || watchWaterConnectionUsageType?.value || watchWaterConnectionUsageType?.name
                    : watchWaterConnectionUsageType;
                  const isNormal = normalizeCode(usageCode) === "NORMAL";
                  const height = parseFloat(value);
                  if (isNormal && !isNaN(height) && height > 17.5) {
                    return getHeightErrorMessage();
                  }
                  return true;
                },
              })}
              name="useDetails.heightOfTheBuilding"
              rules={{ required: t("REQUIRED_FIELD") }}
              disabled={isPropertyFound}
              placeholder={t("WS_HEIGHT_OF_THE_BUILDING")}
              onBlur={handleHeightBlur}
            />
            {errors?.useDetails?.heightOfTheBuilding ? (
              <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                {errors.useDetails.heightOfTheBuilding.message}
              </CardLabelError>
            ) : isHeightInvalid ? (
              <CardLabelError style={{ fontSize: "12px", color: "#d4351c", marginTop: "4px" }}>
                {getHeightErrorMessage()}
              </CardLabelError>
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
