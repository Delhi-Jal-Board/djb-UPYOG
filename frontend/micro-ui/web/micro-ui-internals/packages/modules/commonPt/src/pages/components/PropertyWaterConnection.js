import { LabelFieldPair, Dropdown, TextInput, CardLabelError, CardLabel, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import _ from "lodash";

const NUMBER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

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
        propertyCategory: null,
        propertyType: null,
        WaterConnectionUsageType: null,
        noOfFloors: null,
        plotArea: "",
        builtUpArea: "",
        farArea: "",
        SelectYearofConstruction: null,
        NumberofDwellingUnits: "",
        NumberofRooms: "",
        numberOfBeds: "",
        numberOfStudents: "",
        servantQuarterArea: "",
      },
    },
  });

  const tenantId = Digit.ULBService.getCurrentTenantId();

  const { data: ptServicesMastersData } = Digit.Hooks.pt.usePropertyMDMS(tenantId, "PropertyTax", [
    "PropertyCategory",
    "PropertyType",
    "NoOfFloors",
    "PropertyNewUsageType",
    "PropertyToUsageMapping",
  ]);

  const { data: wsServicesMastersData } = Digit.Hooks.ws.useMDMS(tenantId, "ws-services-masters", ["WsCategoryType"]);

  const [categoryTypeList, setCategoryTypeList] = useState([]);

  useEffect(() => {
    const categories = wsServicesMastersData?.["ws-services-masters"]?.WsCategoryType || [];
    categories.forEach((data) => (data.i18nKey = data.i18nKey || `WS_CATEGORY_${data.code}`));
    setCategoryTypeList(categories);
  }, [wsServicesMastersData]);

  const isPropertyFound = window.location.href.includes("ws/old-application");

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
  const isDwellingUnit =
    watchPropertyType?.code === "Apartment" || watchPropertyType?.code === "FlatOrApartment" || watchPropertyType?.code === "IndividualHouse";
  const isServentHouse =
    watchPropertyType?.code === "Apartment" || watchPropertyType?.code === "FlatOrApartment" || watchPropertyType?.code === "IndividualHouse";

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push({ value: i.toString(), name: i.toString() });
    }
    return years;
  }, []);

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

  const floorOptions = useMemo(() => {
    return ptServicesMastersData?.PropertyTax?.NoOfFloors?.filter((item) => item.active).map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }, [ptServicesMastersData]);

  const lastSentValue = React.useRef(null);
  useEffect(() => {
    if (!_.isEqual(lastSentValue.current, formValue)) {
      lastSentValue.current = _.cloneDeep(formValue);
      onSelect(config.key, formValue);
    }
  }, [formValue, config.key, onSelect]);

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
      setValue(
        "useDetails.noOfFloors",
        floorOptions?.find((o) => {
          const val1 = additionalDetails.numberOfFloors;
          const val2 = additionalDetails.noOfFloors;
          const val3 = details.noOfFloors?.toString();
          return o.code === val1 || o.code === val2 || o.code === val3 || (val3 && o.code === `${val3}_FLOOR`);
        }) || null
      );
      setValue("useDetails.plotArea", additionalDetails.plotArea || details?.landArea?.toString() || "");
      setValue("useDetails.builtUpArea", additionalDetails.builtUpArea || details?.superBuiltUpArea?.toString() || "");
      setValue("useDetails.SelectYearofConstruction", yearOptions?.find((o) => o.value === additionalDetails.yearOfConstruction) || null);
      setValue(
        "useDetails.NumberofDwellingUnits",
        additionalDetails.numberOfDwellingUnits || additionalDetails.noOfDwellingUnits || details?.noOfDwellingUnits || ""
      );
      setValue("useDetails.NumberofRooms", additionalDetails.numberOfRooms || additionalDetails.noOfRooms || details?.noOfRooms || "");
    } else if (formData?.cpt === null) {
      setValue("useDetails.categoryType", null);
      setValue("useDetails.propertyCategory", null);
      setValue("useDetails.propertyType", null);
      setValue("useDetails.WaterConnectionUsageType", null);
      setValue("useDetails.noOfFloors", null);
      setValue("useDetails.plotArea", "");
      setValue("useDetails.builtUpArea", "");
      setValue("useDetails.farArea", "");
      setValue("useDetails.SelectYearofConstruction", null);
      setValue("useDetails.NumberofDwellingUnits", "");
      setValue("useDetails.NumberofRooms", "");
      setValue("useDetails.numberOfBeds", "");
      setValue("useDetails.numberOfStudents", "");
      setValue("useDetails.servantQuarterArea", "");
    }
  }, [
    formData?.cpt?.details,
    formData?.cpt,
    categoryOptions,
    propertyTypeOptions,
    usageTypeOptions,
    floorOptions,
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
                  disable={isPropertyFound}
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
                <Dropdown
                  option={categoryOptions}
                  optionKey="name"
                  selected={props.value}
                  select={props.onChange}
                  t={t}
                  onBlur={props.onBlur}
                  disable={isPropertyFound}
                />
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
                  disable={isPropertyFound}
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
                <Dropdown
                  option={usageTypeOptions}
                  optionKey="name"
                  selected={props.value}
                  select={props.onChange}
                  t={t}
                  onBlur={props.onBlur}
                  disable={isPropertyFound}
                />
              )}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.WaterConnectionUsageType && (
          <CardLabelError style={errorStyle}>{errors.useDetails.WaterConnectionUsageType.message}</CardLabelError>
        )}

        <LabelFieldPair>
          <CardLabel>{`${t("WS_NUMBER_OF_FLOORS")}`}</CardLabel>
          <div className="form-field">
            <Controller
              control={control}
              name="useDetails.noOfFloors"
              // rules={{ required: t("REQUIRED_FIELD") }}
              render={(props) => (
                <Dropdown
                  option={floorOptions}
                  optionKey="name"
                  selected={props.value}
                  select={props.onChange}
                  t={t}
                  onBlur={props.onBlur}
                  disable={isPropertyFound}
                />
              )}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.noOfFloors && <CardLabelError style={errorStyle}>{errors.useDetails.noOfFloors.message}</CardLabelError>}

        <LabelFieldPair>
          <CardLabel>{`${t("WS_PLOT_AREA")}`}</CardLabel>
          <div className="form-field">
            <TextInput
              t={t}
              inputRef={register({
                pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
              })}
              name="useDetails.plotArea"
              disabled={isPropertyFound}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.plotArea && <CardLabelError style={errorStyle}>{errors.useDetails.plotArea.message}</CardLabelError>}
        <div>
          <LabelFieldPair>
            <CardLabel>{`${t("WS_BUILT_UP_AREA")}`}</CardLabel>
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  pattern: { value: DECIMAL_PATTERN, message: t("ERR_INVALID_DECIMAL") },
                })}
                name="useDetails.builtUpArea"
                disabled={isPropertyFound}
              />
            </div>
          </LabelFieldPair>
          {errors?.useDetails?.builtUpArea && <CardLabelError style={errorStyle}>{errors.useDetails.builtUpArea.message}</CardLabelError>}
        </div>
        <div>
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
        </div>

        <LabelFieldPair>
          <CardLabel>{`${t("WS_SELECT_YEAR_OF_CONSTRUCTION")}*`}</CardLabel>
          <div className="form-field">
            <Controller
              control={control}
              name="useDetails.SelectYearofConstruction"
              rules={{ required: t("REQUIRED_FIELD") }}
              render={(props) => (
                <Dropdown
                  option={yearOptions}
                  optionKey="value"
                  selected={props.value}
                  select={props.onChange}
                  t={t}
                  onBlur={props.onBlur}
                  disable={isPropertyFound}
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
            <CardLabel>{`${t("WS_NUMBER_OF_DWELLING_UNITS")}`}</CardLabel>
            <div className="form-field">
              <TextInput
                t={t}
                inputRef={register({
                  pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                })}
                name="useDetails.NumberofDwellingUnits"
                disabled={isPropertyFound}
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
                disabled={isPropertyFound}
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
                disabled={isPropertyFound}
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
                disabled={isPropertyFound}
              />
            </div>
          </LabelFieldPair>
        ) : null}
        {isServentHouse && errors?.useDetails?.servantQuarterArea && (
          <CardLabelError style={errorStyle}>{errors.useDetails.servantQuarterArea.message}</CardLabelError>
        )}
      </div>
    </CollapsibleCardPage>
  );
};

export default PropertyWaterConnection;
