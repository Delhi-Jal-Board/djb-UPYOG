import { LabelFieldPair, Dropdown, TextInput, CardLabelError, CardLabel, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
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
  } = useForm({
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
  const propertyDetailsInitialized = React.useRef(false);

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

  useEffect(() => {
    if (!isDwellingUnit) {
      setValue("useDetails.NumberofDwellingUnits", "");
      if (clearErrors) {
        clearErrors("useDetails.NumberofDwellingUnits");
      }
    }
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

  const categoryOptions = useMemo(() => {
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const uniqueCats = [...new Set(list.map((item) => item.propertyCategory).filter(Boolean))];
    return uniqueCats.map((cat) => ({
      code: cat,
      name: cat,
      i18nKey: cat,
    }));
  }, [propertyType2List, ptServicesMastersData]);

  const propertyTypeOptions = useMemo(() => {
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    return list
      .filter((item) => item.active !== false)
      .map((item) => ({
        ...item,
        code: item.code,
        name: item.name || item.code,
        i18nKey: item.i18nKey || item.code,
      }));
  }, [propertyType2List, ptServicesMastersData]);

  const usageTypeOptions = useMemo(() => {
    const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
    const uniqueTypes = [...new Set(list.map((item) => item.waterConnectionUsageType).filter(Boolean))];
    const typesToMap = uniqueTypes.length > 0 ? uniqueTypes : ["Normal", "Bulk"];
    return typesToMap.map((type) => ({
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

  const autoFillFromPropertyType = React.useCallback(
    (propTypeItem) => {
      if (!propTypeItem?.code) return;

      const list = propertyType2List?.length > 0 ? propertyType2List : ptServicesMastersData?.PropertyTax?.PropertyType || [];
      const matched = list.find((item) => normalizeCode(item.code) === normalizeCode(propTypeItem.code)) || propTypeItem;

      console.log("[PropertyWaterConnection] Property Type selected:", matched?.code);
      console.log("[PropertyWaterConnection] Matched item from MDMS:", matched);

      // 1. Category Type
      if (matched?.categoryType) {
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
      }
    },
    [propertyType2List, ptServicesMastersData, categoryTypeList, categoryOptions, usageTypeOptions, setValue, clearErrors, t]
  );

  const prevPropertyTypeCode = React.useRef(null);

  useEffect(() => {
    if (!watchPropertyType?.code) {
      prevPropertyTypeCode.current = null;
      return;
    }

    const isNewType = prevPropertyTypeCode.current !== watchPropertyType.code;
    if (isNewType) {
      prevPropertyTypeCode.current = watchPropertyType.code;
      autoFillFromPropertyType(watchPropertyType);
    }
  }, [watchPropertyType?.code, autoFillFromPropertyType]);

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

  const prevQuestionsRef = React.useRef(null);
  useEffect(() => {
    if (!_.isEqual(prevQuestionsRef.current, questionAnswers)) {
      prevQuestionsRef.current = _.cloneDeep(questionAnswers);
      setValue("useDetails.questions", questionAnswers);
    }
  }, [questionAnswers, setValue]);

  const lastSentValue = React.useRef(null);
  useEffect(() => {
    const payloadToSend = {
      ...formValue,
      questions: questionAnswers,
      useDetails: {
        ...formValue?.useDetails,
        questions: questionAnswers,
      },
    };
    if (!_.isEqual(lastSentValue.current, payloadToSend)) {
      lastSentValue.current = _.cloneDeep(payloadToSend);
      onSelect(config.key, payloadToSend);
    }
  }, [formValue, questionAnswers, config.key, onSelect]);

  useEffect(() => {
    if (propertyDetailsInitialized.current || !formData?.cpt?.details) return;

    // Populate the dependent dropdowns only after their master options load.
    // Re-running this effect after a user selection would restore old values.
    if (!categoryTypeList.length || !ptServicesMastersData) return;

    if (formData?.cpt?.details) {
      const details = formData.cpt.details;
      const additionalDetails = details?.additionalDetails || {};

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
        additionalDetails.numberOfDwellingUnits || additionalDetails.noOfDwellingUnits || details?.noOfDwellingUnits || ""
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
    } else if (formData?.cpt === null) {
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
    propertyDetailsInitialized.current = true;
  }, [
    formData?.cpt?.details,
    formData?.cpt,
    categoryOptions,
    propertyTypeOptions,
    usageTypeOptions,
    yearOptions,
    categoryTypeList,
    setValue,
  ]);

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
    <CollapsibleCardPage
      title={t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS") + (config?.isAutomaticFill ? " " + t("(Automatic Fill by Property)") : "")}
      defaultOpen={config?.isAutomaticFill ? false : true}
      style={props.style}
    >
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <CardLabel>
            {`${t("WS_PROPERTY_TYPE")}`} <span className="check-page-link-button">*</span>
          </CardLabel>
          <div className="form-field">
            <Controller
              control={control}
              name="useDetails.propertyType"
              rules={{ required: t("REQUIRED_FIELD") }}
              render={(props) => (
                <Dropdown
                  option={propertyTypeOptions}
                  optionKey="name"
                  selected={props.value}
                  select={(selected) => {
                    props.onChange(selected);
                    prevPropertyTypeCode.current = selected?.code;
                    autoFillFromPropertyType(selected);
                  }}
                  t={t}
                  onBlur={props.onBlur}
                  disable={isPropertyFound}
                  placeholder={t("WS_PROPERTY_TYPE")}
                />
              )}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.propertyType && <CardLabelError style={errorStyle}>{errors.useDetails.propertyType.message}</CardLabelError>}
        <LabelFieldPair>
          <CardLabel>
            {`${t("WS_CATEGORY_TYPE")}`} <span className="check-page-link-button">*</span>
          </CardLabel>
          <div className="form-field">
            <Controller
              control={control}
              name={"useDetails.categoryType"}
              rules={{ required: t("REQUIRED_FIELD") }}
              render={(props) => (
                <Dropdown
                  option={availableCategoryOptions}
                  optionKey="i18nKey"
                  selected={props.value}
                  select={props.onChange}
                  t={t}
                  onBlur={props.onBlur}
                  disable={isPropertyFound}
                  placeholder={t("WS_CATEGORY_TYPE")}
                />
              )}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.categoryType && <CardLabelError style={errorStyle}>{errors.useDetails.categoryType.message}</CardLabelError>}
        <LabelFieldPair>
          <CardLabel>
            {`${t("WS_PROPERTY_CATEGORY")}`} <span className="check-page-link-button">*</span>
          </CardLabel>
          <div className="form-field">
            <Controller
              control={control}
              name="useDetails.propertyCategory"
              rules={{ required: t("REQUIRED_FIELD") }}
              render={(props) => (
                <Dropdown
                  option={categoryOptions}
                  optionKey="name"
                  selected={props.value}
                  select={props.onChange}
                  t={t}
                  onBlur={props.onBlur}
                  disable={true}
                  placeholder={t("WS_PROPERTY_CATEGORY")}
                />
              )}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.propertyCategory && <CardLabelError style={errorStyle}>{errors.useDetails.propertyCategory.message}</CardLabelError>}

        <LabelFieldPair>
          <CardLabel>
            {`${t("WS_WATER_CONNECTION_USAGE_TYPE")}`} <span className="check-page-link-button">*</span>
          </CardLabel>
          <div className="form-field">
            <Controller
              control={control}
              name="useDetails.WaterConnectionUsageType"
              rules={{ required: t("REQUIRED_FIELD") }}
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
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.WaterConnectionUsageType && (
          <CardLabelError style={errorStyle}>{errors.useDetails.WaterConnectionUsageType.message}</CardLabelError>
        )}

        {activeQuestions &&
          activeQuestions.length > 0 &&
          activeQuestions.map((questionText, index) => {
            const rawQ = String(questionText || "").trim();
            const label = rawQ.toLowerCase().startsWith("question") ? rawQ : `Question : ${rawQ}`;
            return (
              <LabelFieldPair key={`question_${index}_${rawQ}`}>
                <CardLabel style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{label}</CardLabel>
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
          <CardLabel>
            {`${t("WS_PLOT_AREA")}`} <span className="check-page-link-button">*</span>
          </CardLabel>
          <div className="form-field">
            <TextInput
              t={t}
              inputRef={register({
                pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
              })}
              rules={{ required: t("REQUIRED_FIELD") }}
              name="useDetails.plotArea"
              disabled={isPropertyFound}
              placeholder={t("WS_PLOT_AREA")}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.plotArea && <CardLabelError style={errorStyle}>{errors.useDetails.plotArea.message}</CardLabelError>}
        <div>
          <LabelFieldPair>
            <CardLabel>
              {`${t("WS_BUILT_UP_AREA")}`} <span className="check-page-link-button">*</span>
            </CardLabel>
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  required: t("REQUIRED_FIELD"),
                  pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                })}
                name="useDetails.builtUpArea"
                rules={{ required: t("REQUIRED_FIELD") }}
                disabled={isPropertyFound}
                placeholder={t("WS_BUILT_UP_AREA")}
              />
            </div>
          </LabelFieldPair>
          {errors?.useDetails?.builtUpArea && <CardLabelError style={errorStyle}>{errors.useDetails.builtUpArea.message}</CardLabelError>}
        </div>
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
          <CardLabel>
            {`${t("WS_HEIGHT_OF_THE_BUILDING(meters)")}`}
            <span className="check-page-link-button"> *</span>
          </CardLabel>
          <div className="form-field">
            <TextInput
              t={t}
              inputRef={register({
                required: t("REQUIRED_FIELD"),
                pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
              })}
              name="useDetails.heightOfTheBuilding"
              rules={{ required: t("REQUIRED_FIELD") }}
              disabled={isPropertyFound}
              placeholder={t("WS_HEIGHT_OF_THE_BUILDING")}
            />
          </div>
          {errors?.useDetails?.heightOfTheBuilding && (
            <CardLabelError style={errorStyle}>{errors.useDetails.heightOfTheBuilding.message}</CardLabelError>
          )}
        </LabelFieldPair>
        <LabelFieldPair>
          <CardLabel>{`${t("WS_SELECT_YEAR_OF_CONSTRUCTION")}`}</CardLabel>
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
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.SelectYearofConstruction && (
          <CardLabelError style={errorStyle}>{errors.useDetails.SelectYearofConstruction.message}</CardLabelError>
        )}
        {isDwellingUnit ? (
          <LabelFieldPair>
            <CardLabel>
              {`${t("WS_NUMBER_OF_DWELLING_UNITS")}`}
              <span className="check-page-link-button"> *</span>
            </CardLabel>
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
            </div>
          </LabelFieldPair>
        ) : null}

        {isDwellingUnit && errors?.useDetails?.NumberofDwellingUnits && (
          <CardLabelError style={errorStyle}>{errors.useDetails.NumberofDwellingUnits.message}</CardLabelError>
        )}

        {isHotelRestaurantProperty ? (
          <LabelFieldPair>
            <CardLabel>
              {`${t("WS_NUMBER_OF_ROOMS")}`}
              <span className="check-page-link-button"> *</span>
            </CardLabel>
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
            </div>
          </LabelFieldPair>
        ) : null}
        {isHotelRestaurantProperty && errors?.useDetails?.NumberofRooms && (
          <CardLabelError style={errorStyle}>{errors.useDetails.NumberofRooms.message}</CardLabelError>
        )}

        {isHospitalProperty ? (
          <LabelFieldPair>
            <CardLabel>
              {`${t("WS_NUMBER_OF_BEDS")}`}
              <span className="check-page-link-button"> *</span>
            </CardLabel>
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
            </div>
          </LabelFieldPair>
        ) : null}
        {isHospitalProperty && errors?.useDetails?.numberOfBeds && (
          <CardLabelError style={errorStyle}>{errors.useDetails.numberOfBeds.message}</CardLabelError>
        )}

        {isSchoolCollegeProperty ? (
          <LabelFieldPair>
            <CardLabel>{`${t("WS_NUMBER_OF_STUDENTS")}`}</CardLabel>
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
            </div>
          </LabelFieldPair>
        ) : null}
        {isSchoolCollegeProperty && errors?.useDetails?.numberOfStudents && (
          <CardLabelError style={errorStyle}>{errors.useDetails.numberOfStudents.message}</CardLabelError>
        )}

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
  );
};

export default PropertyWaterConnection;
