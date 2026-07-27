import {
  LabelFieldPair,
  Dropdown,
  TextInput,
  CardLabelError,
  CardLabel,
  CollapsibleCardPage,
  VerticalTimeline,
  SubmitBar,
  Card,
  Loader,
} from "@djb25/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { WSCalculationPayload } from "../utils/index";

const colonyNameOptions = [
  { code: "A", name: "A" },
  { code: "B", name: "B" },
  { code: "C", name: "C" },
  { code: "D", name: "D" },
  { code: "E", name: "E" },
  { code: "F", name: "F" },
  { code: "G", name: "G" },
  { code: "H", name: "H" },
];

const NUMBER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

const WSCalculation = ({ config, onSelect, formData, formState, setError, clearErrors, ...props }) => {
  const {
    control,
    register,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: formData?.[config?.key] || {
      useDetails: {
        propertyCategory: null,
        propertyType: null,
        WaterConnectionUsageType: null,
        plotArea: "",
        builtUpArea: "",
        farArea: "",
        NumberofDwellingUnits: "",
        NumberofRooms: "",
        numberOfBeds: "",
        numberOfStudents: "",
        servantQuarterArea: "",
        colonyName: "",
      },
    },
  });

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();

  const { mutate: calculateCharges, isLoading } = Digit.Hooks.ws.useWSCalculater({ tenantId });

  const { data: ptServicesMastersData } = Digit.Hooks.pt.usePropertyMDMS(tenantId, "PropertyTax", [
    "PropertyCategory",
    "PropertyType",
    "PropertyNewUsageType",
    "PropertyToUsageMapping",
  ]);

  const { data: wsServicesMastersData } = Digit.Hooks.ws.useMDMS(tenantId, "ws-services-masters", ["WsCategoryType"]);

  const [categoryTypeList, setCategoryTypeList] = useState([]);
  const [calculationData, setCalculationData] = useState(null);

  useEffect(() => {
    const categories = wsServicesMastersData?.["ws-services-masters"]?.WsCategoryType || [];
    categories.forEach((data) => (data.i18nKey = data.i18nKey || `WS_CATEGORY_${data.code}`));
    setCategoryTypeList(categories);
  }, [wsServicesMastersData]);

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
  const watchColonyName = watch("useDetails.colonyName");

  const isCalculateButtonEnabled =
    watchCategoryType &&
    watchPropertyCategory &&
    watchPropertyType &&
    watchWaterConnectionUsageType &&
    watchColonyName

  const isHospitalProperty = watchPropertyType?.code === "HOSPITAL_NURSING_HOME" || watchPropertyType?.code === "DharamshalasOrHostels" || watchPropertyType?.code === "HospitalNursingHome";
  const isHotelRestaurantProperty = watchPropertyType?.code === "HOTEL_OR_RESTAURANT" || watchPropertyType?.code === "HotelOrRestaurant";
  const isSchoolCollegeProperty = watchPropertyType?.code === "School" || watchPropertyType?.code === "College";
  const isDwellingUnit = watchPropertyCategory?.code === "RESIDENTIAL" || watchPropertyCategory?.code === "RESIDENTIAL";
  const isServentHouse =
    watchPropertyType?.code === "Apartment" || watchPropertyType?.code === "FlatOrApartment" || watchPropertyType?.code === "IndividualHouse";

  const categoryOptions = useMemo(() => {
    if (!watchCategoryType?.code) return [];
    let options = ptServicesMastersData?.PropertyTax?.PropertyCategory?.filter((item) => item.active) || [];
    options = options.filter((item) => item.type === watchCategoryType.code);
    return options.map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }, [ptServicesMastersData, watchCategoryType]);

  useEffect(() => {
    if (watchCategoryType && watchPropertyCategory) {
      const isCategoryValid = categoryOptions.some((opt) => opt.code === watchPropertyCategory.code);
      if (!isCategoryValid) {
        setValue("useDetails.propertyCategory", null);
      }
    }
  }, [watchCategoryType, categoryOptions, setValue, watchPropertyCategory]);

  const propertyTypeOptions = useMemo(() => {
    if (!watchPropertyCategory?.code) return [];
    let options = ptServicesMastersData?.PropertyTax?.PropertyType?.filter((item) => item.active) || [];
    let mapping = ptServicesMastersData?.PropertyTax?.PropertyToUsageMapping || [];

    if (mapping.length > 0) {
      options = options.filter((item) => mapping.some((m) => m.propertyTypeCode === item.code));
    }

    if (watchPropertyCategory?.code?.toUpperCase() !== "MIXED") {
      options = options.filter((item) => item.type?.toUpperCase() === watchPropertyCategory.code?.toUpperCase());
    }
    return options.map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }, [ptServicesMastersData, watchPropertyCategory]);

  useEffect(() => {
    if (watchPropertyCategory && watchPropertyType) {
      const isTypeValid = propertyTypeOptions.some((opt) => opt.code === watchPropertyType.code);
      if (!isTypeValid) {
        setValue("useDetails.propertyType", null);
      }
    }
  }, [watchPropertyCategory, propertyTypeOptions, setValue, watchPropertyType]);

  const usageTypeOptions = useMemo(() => {
    if (!watchPropertyType?.code) return [];
    let options = ptServicesMastersData?.PropertyTax?.PropertyNewUsageType?.filter((item) => item.active) || [];
    let mapping = ptServicesMastersData?.PropertyTax?.PropertyToUsageMapping || [];

    const selectedMapping = mapping.find((m) => m.propertyTypeCode === watchPropertyType.code);
    if (selectedMapping && selectedMapping.allowedUsages) {
      options = options.filter((item) => selectedMapping.allowedUsages.includes(item.code));
    } else {
      options = [];
    }

    return options.map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }, [ptServicesMastersData, watchPropertyCategory, watchPropertyType]);

  useEffect(() => {
    if (watchPropertyType && watchWaterConnectionUsageType) {
      const isUsageTypeValid = usageTypeOptions.some((opt) => opt.code === watchWaterConnectionUsageType.code);
      if (!isUsageTypeValid) {
        setValue("useDetails.WaterConnectionUsageType", null);
      }
    }
  }, [watchPropertyType, usageTypeOptions, setValue, watchWaterConnectionUsageType]);

  const lastSentValue = React.useRef(null);
  useEffect(() => {
    if (!_.isEqual(lastSentValue.current, formValue)) {
      lastSentValue.current = _.cloneDeep(formValue);
      onSelect?.(config?.key, formValue);
    }
  }, [formValue, config?.key, onSelect]);

  useEffect(() => {
    if (formData?.cpt?.details) {
      const details = formData.cpt.details;
      const additionalDetails = details?.additionalDetails || {};

      const catType = additionalDetails.categoryType || (details.usageCategory?.includes("RESIDENTIAL") ? "DOMESTIC" : "NON_DOMESTIC");

      setValue("useDetails.categoryType", categoryTypeList?.find((o) => o.code === catType) || null);
      setValue(
        "useDetails.propertyCategory",
        categoryOptions?.find((o) => o.code === (additionalDetails.propertyCategory || details.usageCategory)) || null
      );
      setValue(
        "useDetails.propertyType",
        propertyTypeOptions?.find((o) => o.code === (additionalDetails.propertyType || details.propertyType)) || null
      );
      setValue("useDetails.WaterConnectionUsageType", usageTypeOptions?.find((o) => o.code === additionalDetails.waterConnectionUsageType) || null);
      setValue("useDetails.plotArea", additionalDetails.plotArea || details?.landArea?.toString() || "");
      setValue("useDetails.builtUpArea", additionalDetails.builtUpArea || details?.superBuiltUpArea?.toString() || "");
      setValue(
        "useDetails.NumberofDwellingUnits",
        additionalDetails.numberOfDwellingUnits || additionalDetails.noOfDwellingUnits || details?.noOfDwellingUnits || ""
      );
      setValue("useDetails.NumberofRooms", additionalDetails.numberOfRooms || additionalDetails.noOfRooms || details?.noOfRooms || "");
      setValue("useDetails.colonyName", additionalDetails.colonyName || "");
    } else if (formData?.cpt === null) {
      setValue("useDetails.categoryType", null);
      setValue("useDetails.propertyCategory", null);
      setValue("useDetails.propertyType", null);
      setValue("useDetails.WaterConnectionUsageType", null);
      setValue("useDetails.plotArea", "");
      setValue("useDetails.builtUpArea", "");
      setValue("useDetails.farArea", "");
      setValue("useDetails.NumberofDwellingUnits", "");
      setValue("useDetails.NumberofRooms", "");
      setValue("useDetails.numberOfBeds", "");
      setValue("useDetails.numberOfStudents", "");
      setValue("useDetails.servantQuarterArea", "");
      setValue("useDetails.colonyName", "");
    }
  }, [formData?.cpt?.details, formData?.cpt, categoryOptions, propertyTypeOptions, usageTypeOptions, categoryTypeList, setValue]);

  const lastErrorState = React.useRef(null);
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (lastErrorState.current !== hasErrors) {
      lastErrorState.current = hasErrors;
      if (hasErrors) {
        if (setError) setError(config?.key, { type: "custom", message: "Validation failed" });
      } else {
        if (clearErrors) clearErrors(config?.key);
      }
    }
  }, [errors, config?.key, setError, clearErrors]);

  const errorStyle = { width: "70%", marginLeft: "30%", fontSize: "12px", marginTop: "-21px" };
  const isMobile = window.Digit.Utils.browser.isMobile();

  const handleSubmit = () => {
    const payload = WSCalculationPayload(formValue, tenantId);

    calculateCharges(payload, {
      onSuccess: (data) => {
        setCalculationData(data);
        onSelect?.(config?.key, { ...formValue, payload, calculationResponse: data });
      },
      onError: (error) => {
        if (setError) setError(config?.key, { type: "custom", message: error?.response?.data?.Errors?.[0]?.message || t("WS_CALCULATION_FAILED") });
      },
    });
  };

  const RenderCalculationDetails = ({ data }) => {
    if (!data) return null;
    const calc = data.Calculation?.[0];
    if (!calc) return null;

    const propertyDetail = calc.calculationDetail?.propertyDetail || {};
    const waterDemandDetail = calc.calculationDetail?.waterDemandDetail || {};
    const infraDetail = calc.calculationDetail?.infrastructureChargeDetail || {};
    const taxHeadEstimates = calc.taxHeadEstimates || [];
    const totalAmount = calc.totalAmount;

    return (
      <div className="ws-calc-details-wrapper">
        <Card>
          {/* 1. Property Details */}
          <div className="ws-calc-detail-card">
            <div className="ws-calc-detail-card-header">
              <span className="ws-calc-detail-card-badge">1</span>
              <h3 className="ws-calc-detail-card-title">{t("WS_PROPERTY_DETAILS")}</h3>
            </div>
            <div className="ws-calc-property-box">
              <div className="ws-calc-grid-4">
                <div>
                  <div className="ws-calc-label">{t("WS_PROPERTY_TYPE")}</div>
                  <div className="ws-calc-value">{propertyDetail.propertyType || "-"}</div>
                </div>
                <div>
                  <div className="ws-calc-label">{t("WS_PROPERTY_CATEGORY")}</div>
                  <div className="ws-calc-value">{propertyDetail.usageCategory || "-"}</div>
                </div>
                <div>
                  <div className="ws-calc-label">{t("WS_WATER_CONNECTION_USAGE_TYPE")}</div>
                  <div className="ws-calc-value">{propertyDetail.waterConnectionUsageType || "-"}</div>
                </div>
                <div>
                  <div className="ws-calc-label">{t("WS_COLONY_CATEGORY")}</div>
                  <div className="ws-calc-pill">{propertyDetail.colonyCategory || "-"}</div>
                </div>
              </div>
              <hr className="ws-calc-hr" />
              <div className="ws-calc-grid-4">
                <div>
                  <div className="ws-calc-label">{t("WS_LAND_AREA")}</div>
                  <div className="ws-calc-value">{propertyDetail.landArea || 0} sq. m.</div>
                </div>
                <div>
                  <div className="ws-calc-label">{t("WS_FAR_AREA")}</div>
                  <div className="ws-calc-value">{propertyDetail.farArea || 0} sq. m.</div>
                </div>

                <div>
                  <div className="ws-calc-label">{t("WS_BUILT_UP_AREA")}</div>
                  <div className="ws-calc-value">{waterDemandDetail.contextVariables?.built_up_area || 0} sq. m.</div>
                </div>

                {(propertyDetail.coveredArea > 0 || waterDemandDetail.contextVariables?.covered_area > 0) && (
                  <div>
                    <div className="ws-calc-label">{t("WS_COVERED_AREA")}</div>
                    <div className="ws-calc-value">{propertyDetail.coveredArea || waterDemandDetail.contextVariables?.covered_area} sq. m.</div>
                  </div>
                )}

                {(propertyDetail.numberOfDwellingUnits > 0 || waterDemandDetail.contextVariables?.dwelling_units > 0 || waterDemandDetail.contextVariables?.total_du > 0) && (
                  <div>
                    <div className="ws-calc-label">{t("WS_NUMBER_OF_DWELLING_UNITS")}</div>
                    <div className="ws-calc-value">{propertyDetail.numberOfDwellingUnits || waterDemandDetail.contextVariables?.dwelling_units || waterDemandDetail.contextVariables?.total_du}</div>
                  </div>
                )}

                {(propertyDetail.numberOfBeds > 0 || waterDemandDetail.contextVariables?.total_beds > 0) && (
                  <div>
                    <div className="ws-calc-label">{t("WS_NUMBER_OF_BEDS")}</div>
                    <div className="ws-calc-value">{propertyDetail.numberOfBeds || waterDemandDetail.contextVariables?.total_beds}</div>
                  </div>
                )}

                {(propertyDetail.numberOfRooms > 0 || waterDemandDetail.contextVariables?.total_rooms > 0) && (
                  <div>
                    <div className="ws-calc-label">{t("WS_NUMBER_OF_ROOMS")}</div>
                    <div className="ws-calc-value">{propertyDetail.numberOfRooms || waterDemandDetail.contextVariables?.total_rooms}</div>
                  </div>
                )}

                {(propertyDetail.numberOfStudents > 0 || waterDemandDetail.contextVariables?.total_students > 0) && (
                  <div>
                    <div className="ws-calc-label">{t("WS_NUMBER_OF_STUDENTS")}</div>
                    <div className="ws-calc-value">{propertyDetail.numberOfStudents || waterDemandDetail.contextVariables?.total_students}</div>
                  </div>
                )}

                {(propertyDetail.numberOfStaff > 0 || waterDemandDetail.contextVariables?.total_staff > 0) && (
                  <div>
                    <div className="ws-calc-label">{t("WS_NUMBER_OF_STAFF")}</div>
                    <div className="ws-calc-value">{propertyDetail.numberOfStaff || waterDemandDetail.contextVariables?.total_staff}</div>
                  </div>
                )}

                {waterDemandDetail.contextVariables?.total_seats > 0 && (
                  <div>
                    <div className="ws-calc-label">{t("WS_NUMBER_OF_SEATS")}</div>
                    <div className="ws-calc-value">{waterDemandDetail.contextVariables.total_seats}</div>
                  </div>
                )}

                {waterDemandDetail.contextVariables?.highest_shift_strength > 0 && (
                  <div>
                    <div className="ws-calc-label">{t("WS_HIGHEST_SHIFT_STRENGTH")}</div>
                    <div className="ws-calc-value">{waterDemandDetail.contextVariables.highest_shift_strength}</div>
                  </div>
                )}

                {waterDemandDetail.contextVariables?.sanctioned_beds > 0 && (
                  <div>
                    <div className="ws-calc-label">{t("WS_SANCTIONED_BEDS")}</div>
                    <div className="ws-calc-value">{waterDemandDetail.contextVariables.sanctioned_beds}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Water Demand Details */}
          <div className="ws-calc-detail-card">
            <div className="ws-calc-detail-card-header">
              <span className="ws-calc-detail-card-badge">2</span>
              <h3 className="ws-calc-detail-card-title">{t("WS_WATER_DEMAND_DETAILS")}</h3>
            </div>
            <div className="ws-calc-split-card">
              <div className="ws-calc-split-left">
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_MATCHED_NORM_CODE")}</span>
                  <span className="ws-calc-row-value">{waterDemandDetail.matchedNormCode || "-"}</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_MATCHED_NORM_NAME")}</span>
                  <span className="ws-calc-row-value-right">{waterDemandDetail.matchedNormName || "-"}</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_FORMULA_USED")}</span>
                  <span className="ws-calc-row-value">{waterDemandDetail.formulaUsed || "-"}</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_CALCULATED_OCCUPANCY")}</span>
                  <span className="ws-calc-row-value">{waterDemandDetail.calculatedOccupancy || 0} Persons</span>
                </div>
                <div className="ws-calc-row-last">
                  <span className="ws-calc-row-label">{t("WS_LPCD_SELECTED")}</span>
                  <span className="ws-calc-row-value">{waterDemandDetail.chosenLpcd || 0} LPD</span>
                </div>
              </div>
              <div className="ws-calc-split-right">
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_BASE_DEMAND")}</span>
                  <span className="ws-calc-row-value">{waterDemandDetail.baseDemand || 0} L/day</span>
                </div>
                <div className="ws-calc-row" style={{ marginBottom: "24px" }}>
                  <span className="ws-calc-row-label">{t("WS_CONTINGENCY")}</span>
                  <span className="ws-calc-row-value">{waterDemandDetail.contingencyPercentage || 0}%</span>
                </div>
                <div className="ws-calc-highlight-blue">
                  <span className="ws-calc-highlight-blue-label">{t("WS_TOTAL_WATER_DEMAND")}</span>
                  <span className="ws-calc-highlight-blue-value">{waterDemandDetail.totalWaterDemandLPD || 0} L/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Infrastructure Charge Details */}
          <div className="ws-calc-detail-card">
            <div className="ws-calc-detail-card-header">
              <span className="ws-calc-detail-card-badge">3</span>
              <h3 className="ws-calc-detail-card-title">{t("WS_INFRASTRUCTURE_CHARGE_DETAILS")}</h3>
            </div>
            <div className="ws-calc-split-card">
              <div className="ws-calc-split-left">
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_COLONY_CATEGORY")}</span>
                  <span className="ws-calc-row-value">{infraDetail.colonyCategory || "-"}</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_PLOT_AREA")}</span>
                  <span className="ws-calc-row-value">{infraDetail.plotArea || 0} sq. m.</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_MINIMUM_PLOT_AREA")}</span>
                  <span className="ws-calc-row-value">{infraDetail.minimumPlotArea || 0} sq. m.</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_WATER_RATE")}</span>
                  <span className="ws-calc-row-value">₹ {infraDetail.waterRatePerLPD || 0} / LPD</span>
                </div>
                <div className="ws-calc-row-last">
                  <span className="ws-calc-row-label">{t("WS_SEWER_RATE")}</span>
                  <span className="ws-calc-row-value">₹ {infraDetail.sewerRatePerLPD || 0} / LPD</span>
                </div>
              </div>
              <div className="ws-calc-split-right">
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_WATER_COMPONENT_IFC")}</span>
                  <span className="ws-calc-row-value">₹ {infraDetail.waterComponentIFC?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_SEWER_COMPONENT_IFC")}</span>
                  <span className="ws-calc-row-value">₹ {infraDetail.sewerComponentIFC?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">{t("WS_GROSS_IFC")}</span>
                  <span className="ws-calc-row-value">₹ {infraDetail.grossIFC?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="ws-calc-row">
                  <span className="ws-calc-row-label">
                    {t("WS_REBATE")} ({infraDetail.rebatePercentage || 0}%)
                  </span>
                  <span className="ws-calc-row-value-red">- ₹ {infraDetail.rebateAmount?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="ws-calc-highlight-green">
                  <span className="ws-calc-highlight-green-label">{t("WS_NET_INFRASTRUCTURE_CHARGE")}</span>
                  <span className="ws-calc-highlight-green-value">₹ {infraDetail.netIFC?.toLocaleString("en-IN") || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Fee Summary */}
          <div className="ws-calc-detail-card" style={{ marginBottom: "0" }}>
            <div className="ws-calc-detail-card-header">
              <span className="ws-calc-detail-card-badge">4</span>
              <h3 className="ws-calc-detail-card-title">{t("WS_FEE_SUMMARY")}</h3>
            </div>
            <div className="ws-calc-split-card" style={{ marginBottom: "0" }}>
              <div className="ws-calc-split-left" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {taxHeadEstimates.map((taxHead, index) => (
                  <div key={index} className="ws-calc-row">
                    <span className="ws-calc-row-label">{t(taxHead.taxHeadCode)}</span>
                    <span className="ws-calc-row-value">₹ {taxHead.estimateAmount?.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="ws-calc-highlight-purple">
                <span className="ws-calc-highlight-purple-label">{t("WS_TOTAL_AMOUNT_PAYABLE")}</span>
                <span className="ws-calc-highlight-purple-value">₹ {totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="employee-form-section-wrapper">
      <VerticalTimeline config={[{ timeLine: [{ actions: t("WS_CALCULATION"), currentStep: 1 }] }]} showFinalStep={false} />
      <div style={{ flex: 1 }}>
        <CollapsibleCardPage title={t("WS_CALCULATION")} defaultOpen={true} style={props.style}>
          <div className="formcomposer-section-grid">
            <LabelFieldPair>
              <CardLabel>{`${t("WS_CATEGORY_TYPE")}*`}</CardLabel>
              <div className="form-field">
                <Controller
                  control={control}
                  name={"useDetails.categoryType"}
                  rules={{ required: t("REQUIRED_FIELD") }}
                  render={(props) => (
                    <Dropdown
                      option={categoryTypeList}
                      optionKey="i18nKey"
                      selected={props.value}
                      select={props.onChange}
                      t={t}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.categoryType && <CardLabelError style={errorStyle}>{errors.useDetails.categoryType.message}</CardLabelError>}
            <LabelFieldPair>
              <CardLabel>{`${t("WS_PROPERTY_CATEGORY")}*`}</CardLabel>
              <div className="form-field">
                <Controller
                  control={control}
                  name="useDetails.propertyCategory"
                  rules={{ required: t("REQUIRED_FIELD") }}
                  render={(props) => (
                    <Dropdown option={categoryOptions} optionKey="name" selected={props.value} select={props.onChange} t={t} onBlur={props.onBlur} />
                  )}
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.propertyCategory && <CardLabelError style={errorStyle}>{errors.useDetails.propertyCategory.message}</CardLabelError>}

            <LabelFieldPair>
              <CardLabel>{`${t("WS_PROPERTY_TYPE")}*`}</CardLabel>
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
                      select={props.onChange}
                      t={t}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.propertyType && <CardLabelError style={errorStyle}>{errors.useDetails.propertyType.message}</CardLabelError>}

            <LabelFieldPair>
              <CardLabel>{`${t("WS_WATER_CONNECTION_USAGE_TYPE")}*`}</CardLabel>
              <div className="form-field">
                <Controller
                  control={control}
                  name="useDetails.WaterConnectionUsageType"
                  rules={{ required: t("REQUIRED_FIELD") }}
                  render={(props) => (
                    <Dropdown option={usageTypeOptions} optionKey="name" selected={props.value} select={props.onChange} t={t} onBlur={props.onBlur} />
                  )}
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.WaterConnectionUsageType && (
              <CardLabelError style={errorStyle}>{errors.useDetails.WaterConnectionUsageType.message}</CardLabelError>
            )}

            <LabelFieldPair>
              <CardLabel>{`${t("WS_COLONY_NAME")}*`}</CardLabel>
              <div className="form-field">
                <Controller
                  control={control}
                  name="useDetails.colonyName"
                  rules={{ required: t("REQUIRED_FIELD") }}
                  render={(props) => (
                    <Dropdown
                      option={colonyNameOptions}
                      optionKey="name"
                      selected={props.value}
                      select={props.onChange}
                      t={t}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.colonyName && <CardLabelError style={errorStyle}>{errors.useDetails.colonyName.message}</CardLabelError>}

            <LabelFieldPair>
              <CardLabel>{`${t("WS_PLOT_AREA")}`}</CardLabel>
              <div className="form-field">
                <TextInput
                  t={t}
                  inputRef={register({
                    pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                  })}
                  name="useDetails.plotArea"
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.plotArea && <CardLabelError style={errorStyle}>{errors.useDetails.plotArea.message}</CardLabelError>}

            <LabelFieldPair>
              <CardLabel>{`${t("WS_BUILT_UP_AREA")}`}</CardLabel>
              <div className="form-field">
                <TextInput
                  t={t}
                  inputRef={register({
                    pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                  })}
                  name="useDetails.builtUpArea"
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.builtUpArea && <CardLabelError style={errorStyle}>{errors.useDetails.builtUpArea.message}</CardLabelError>}
            <LabelFieldPair>
              <CardLabel>{`${t("WS_FAR_AREA")}`}</CardLabel>
              <div className="form-field">
                <TextInput
                  t={t}
                  inputRef={register({
                    pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                  })}
                  name="useDetails.farArea"
                />
              </div>
            </LabelFieldPair>
            {errors?.useDetails?.farArea && <CardLabelError style={errorStyle}>{errors.useDetails.farArea.message}</CardLabelError>}

            {isDwellingUnit ? (
              <LabelFieldPair>
                <CardLabel>{`${t("WS_NUMBER_OF_DWELLING_UNITS")}`}</CardLabel>
                <div className="form-field">
                  <TextInput
                    t={t}
                    inputRef={register({
                      pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                    })}
                    name="useDetails.NumberofDwellingUnits"
                  />
                </div>
              </LabelFieldPair>
            ) : null}

            {isDwellingUnit && errors?.useDetails?.NumberofDwellingUnits && (
              <CardLabelError style={errorStyle}>{errors.useDetails.NumberofDwellingUnits.message}</CardLabelError>
            )}

            {isHotelRestaurantProperty ? (
              <LabelFieldPair>
                <CardLabel>{`${t("WS_NUMBER_OF_ROOMS")}*`}</CardLabel>
                <div className="form-field">
                  <TextInput
                    t={t}
                    inputRef={register({
                      pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                      required: isHotelRestaurantProperty ? t("REQUIRED_FIELD") : false,
                    })}
                    name="useDetails.NumberofRooms"
                  />
                </div>
              </LabelFieldPair>
            ) : null}
            {isHotelRestaurantProperty && errors?.useDetails?.NumberofRooms && (
              <CardLabelError style={errorStyle}>{errors.useDetails.NumberofRooms.message}</CardLabelError>
            )}

            {isHospitalProperty ? (
              <LabelFieldPair>
                <CardLabel>{`${t("WS_NUMBER_OF_BEDS")}*`}</CardLabel>
                <div className="form-field">
                  <TextInput
                    t={t}
                    inputRef={register({
                      pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                      required: isHospitalProperty ? t("REQUIRED_FIELD") : false,
                    })}
                    name="useDetails.numberOfBeds"
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
                  />
                </div>
              </LabelFieldPair>
            ) : null}
            {isSchoolCollegeProperty && errors?.useDetails?.numberOfStudents && (
              <CardLabelError style={errorStyle}>{errors.useDetails.numberOfStudents.message}</CardLabelError>
            )}

            {isServentHouse ? (
              <LabelFieldPair>
                <CardLabel>{`${t("WS_SERVENT_HOUSE")}`}</CardLabel>
                <div className="form-field">
                  <TextInput
                    t={t}
                    inputRef={register({
                      pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                    })}
                    name="useDetails.servantQuarterArea"
                  />
                </div>
              </LabelFieldPair>
            ) : null}
            {isServentHouse && errors?.useDetails?.servantQuarterArea && (
              <CardLabelError style={errorStyle}>{errors.useDetails.servantQuarterArea.message}</CardLabelError>
            )}
          </div>
        </CollapsibleCardPage>
        <div style={{ display: "flex", marginTop: "24px", marginBottom: "32px", justifyContent: isMobile ? "center" : "flex-end", alignItems: "center" }}>
          <button
            type="button"
            className="clear-search generic-button"
            style={{ marginRight: "24px" }}
            onClick={() => {
              reset();
              setCalculationData(null);
            }}
          >
            {t("CS_COMMON_CLEAR_SEARCH")}
          </button>
          {isLoading ? (
            <Loader />
          ) : (
            <SubmitBar label={t("ES_COMMON_CALCULATE")} onSubmit={handleSubmit} disabled={!isCalculateButtonEnabled} />
          )}
        </div>

        {calculationData && <RenderCalculationDetails data={calculationData} />}
      </div>
    </div>
  );
};

export default WSCalculation;
