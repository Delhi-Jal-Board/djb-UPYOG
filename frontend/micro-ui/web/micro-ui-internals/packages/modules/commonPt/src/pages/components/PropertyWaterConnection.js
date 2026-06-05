import { LabelFieldPair, Dropdown, TextInput, CardLabelError, CardLabel, CollapsibleCardPage, CloseSvg } from "@djb25/digit-ui-react-components";
import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import _ from "lodash";

const NUMBER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

const PropertyWaterConnection = ({ t, config, onSelect, formData, formState, setError, clearErrors, ...props }) => {
  const {
    control,
    register,
    formState: { errors, touched },
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
        SelectYearofConstruction: null,
        NumberofDwellingUnits: "",
        NumberofRooms: "",
        hospitalBeds: "",
      },
    },
  });

  const tenantId = Digit.ULBService.getCurrentTenantId();

  const { isLoading: isWSServicesMastersLoading, data: ptServicesMastersData } = Digit.Hooks.pt.usePropertyMDMS(tenantId, "PropertyTax", [
    "PropertyCategory",
    "PropertyType",
    "NoOfFloors",
    "PropertyNewUsageType",
  ]);

  const isPropertyFound = window.location.href.includes("ws/old-application");

  const formValue = watch();
  const watchPropertyType = watch("useDetails.propertyType");
  const watchPropertyCategory = watch("useDetails.propertyCategory");
  const isHospitalProperty = watchPropertyType?.code === "HOSPITAL_NURSING_HOME" || watchPropertyType?.code === "HospitalNursingHome";

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push({ value: i.toString(), name: i.toString() });
    }
    return years;
  }, []);

  const categoryOptions = useMemo(() => {
    return ptServicesMastersData?.PropertyTax?.PropertyCategory?.filter((item) => item.active).map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }, [ptServicesMastersData]);

  const propertyTypeOptions = useMemo(() => {
    let options = ptServicesMastersData?.PropertyTax?.PropertyType?.filter((item) => item.active) || [];
    if (watchPropertyCategory?.code) {
      if (watchPropertyCategory?.code?.toUpperCase() !== "MIXED") {
        options = options.filter((item) => item.type?.toUpperCase() === watchPropertyCategory.code?.toUpperCase());
      }
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
    return ptServicesMastersData?.PropertyTax?.PropertyNewUsageType?.filter((item) => item.active).map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }, [ptServicesMastersData]);

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

      setValue("useDetails.propertyCategory", categoryOptions?.find((o) => o.code === additionalDetails.propertyCategory) || null);
      setValue("useDetails.propertyType", propertyTypeOptions?.find((o) => o.code === additionalDetails.propertyType) || null);
      setValue("useDetails.WaterConnectionUsageType", usageTypeOptions?.find((o) => o.code === additionalDetails.waterConnectionUsageType) || null);
      setValue(
        "useDetails.noOfFloors",
        floorOptions?.find((o) => o.code === (details.noOfFloors?.toString() || additionalDetails.noOfFloors)) || null
      );
      setValue("useDetails.plotArea", additionalDetails.plotArea || "");
      setValue("useDetails.builtUpArea", additionalDetails.builtUpArea || "");
      setValue("useDetails.SelectYearofConstruction", yearOptions?.find((o) => o.value === additionalDetails.yearOfConstruction) || null);
      setValue("useDetails.NumberofDwellingUnits", additionalDetails.numberOfDwellingUnits || "");
      setValue("useDetails.NumberofRooms", additionalDetails.numberOfRooms || "");
    }
  }, [formData?.cpt?.details, categoryOptions, propertyTypeOptions, usageTypeOptions, floorOptions, yearOptions, setValue]);

  const lastErrorState = React.useRef(null);
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (lastErrorState.current !== hasErrors) {
      lastErrorState.current = hasErrors;
      if (hasErrors) {
        setError(config.key, { type: "custom", message: "Validation failed" });
      } else {
        clearErrors(config.key);
      }
    }
  }, [errors, config.key, setError, clearErrors]);

  const errorStyle = { width: "70%", marginLeft: "30%", fontSize: "12px", marginTop: "-21px" };

  return (
    <CollapsibleCardPage title={t("WS_PROPERTY_AND_WATER_CONNECTION_USE_DETAILS")} defaultOpen={true} style={props.style}>
      <div className="formcomposer-section-grid">
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

        <LabelFieldPair>
          <CardLabel>{`${t("WS_NUMBER_OF_DWELLING_UNITS")}*`}</CardLabel>
          <div className="form-field">
            <TextInput
              t={t}
              inputRef={register({
                pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                required: t("REQUIRED_FIELD"),
              })}
              name="useDetails.NumberofDwellingUnits"
              disabled={isPropertyFound}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.NumberofDwellingUnits && (
          <CardLabelError style={errorStyle}>{errors.useDetails.NumberofDwellingUnits.message}</CardLabelError>
        )}

        <LabelFieldPair>
          <CardLabel>{`${t("WS_NUMBER_OF_ROOMS")}*`}</CardLabel>
          <div className="form-field">
            <TextInput
              t={t}
              inputRef={register({
                pattern: { value: NUMBER_PATTERN, message: t("ERR_INVALID_NUMBER") },
                required: t("REQUIRED_FIELD"),
              })}
              name="useDetails.NumberofRooms"
              disabled={isPropertyFound}
            />
          </div>
        </LabelFieldPair>
        {errors?.useDetails?.NumberofRooms && <CardLabelError style={errorStyle}>{errors.useDetails.NumberofRooms.message}</CardLabelError>}

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
                name="useDetails.hospitalBeds"
                disabled={isPropertyFound}
              />
            </div>
          </LabelFieldPair>
        ) : null}
        {isHospitalProperty && errors?.useDetails?.hospitalBeds && (
          <CardLabelError style={errorStyle}>{errors.useDetails.hospitalBeds.message}</CardLabelError>
        )}
      </div>
    </CollapsibleCardPage>
  );
};

export default PropertyWaterConnection;
