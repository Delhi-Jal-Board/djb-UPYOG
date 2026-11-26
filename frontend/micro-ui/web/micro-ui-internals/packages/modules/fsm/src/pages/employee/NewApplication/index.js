import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Loader, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useHistory } from "react-router-dom";

const isConventionalSpecticTank = (tankDimension) => tankDimension === "lbd";

export const NewApplication = ({ parentUrl, heading }) => {
  // const __initPropertyType__ = window.Digit.SessionStorage.get("propertyType");
  // const __initSubType__ = window.Digit.SessionStorage.get("subType");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();
  // const { data: commonFields, isLoading } = useQuery('newConfig', () => fetch(`http://localhost:3002/commonFields`).then(res => res.json()))
  // const { data: postFields, isLoading: isTripConfigLoading } = useQuery('tripConfig', () => fetch(`http://localhost:3002/tripDetails`).then(res => res.json()))
  const { data: commonFields, isLoading } = Digit.Hooks.fsm.useMDMS(stateId, "FSM", "CommonFieldsConfig");
  const { data: preFields, isLoading: isApplicantConfigLoading } = Digit.Hooks.fsm.useMDMS(stateId, "FSM", "PreFieldsConfig");
  const { data: postFields, isLoading: isTripConfigLoading } = Digit.Hooks.fsm.useMDMS(stateId, "FSM", "PostFieldsConfig");

  const [mutationHappened, setMutationHappened, clear] = Digit.Hooks.useSessionStorage("FSM_MUTATION_HAPPENED", false);
  const [errorInfo, setErrorInfo, clearError] = Digit.Hooks.useSessionStorage("FSM_ERROR_DATA", false);
  const [successData, setsuccessData, clearSuccessData] = Digit.Hooks.useSessionStorage("FSM_MUTATION_SUCCESS_DATA", false);

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
    clearError();
  }, []);
  // const { data: vehicleMenu } = Digit.Hooks.fsm.useMDMS(state, "Vehicle", "VehicleType", { staleTime: Infinity });
  // const { data: channelMenu } = Digit.Hooks.fsm.useMDMS(tenantId, "FSM", "EmployeeApplicationChannel");
  const { t } = useTranslation();
  const history = useHistory();

  const [canSubmit, setSubmitValve] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const prevAutoStepRef = useRef(1);
  const formWrapperRef = useRef(null);
  // const [channel, setChannel] = useState(null);

  const defaultValues = {
    paymentPreference: "POST_PAY",
    channel: { code: "COUNTER" },
    tripData: {
      noOfTrips: 1,
      amountPerTrip: null,
      amount: null,
    },
  };

  const onFormValueChange = (setValue, formData) => {
    const pitDetailValues = formData?.pitDetail ? Object.values(formData?.pitDetail).filter((value) => value > 0) : null;
    const isPitDimensionsValid =
      pitDetailValues === null ||
      pitDetailValues?.length === 0 ||
      (isConventionalSpecticTank(formData?.pitType?.dimension) ? pitDetailValues?.length >= 3 : pitDetailValues?.length >= 2);

    const isStep1Done = Boolean(
      formData?.channel &&
        formData?.applicationData?.applicantName?.trim() &&
        formData?.applicationData?.mobileNumber
    );
    const isStep2Done = Boolean(formData?.propertyType && formData?.subtype);
    const isStep3Done = Boolean(
      (formData?.address?.locality?.code || formData?.address?.city?.code) &&
        formData?.address?.street &&
        formData?.address?.doorNo
    );
    const isStep4Done = Boolean(formData?.pitType && isPitDimensionsValid);

    const nextAutoStep = !isStep1Done ? 1 : !isStep2Done ? 2 : !isStep3Done ? 3 : !isStep4Done ? 4 : 5;
    if (nextAutoStep !== prevAutoStepRef.current) {
      prevAutoStepRef.current = nextAutoStep;
      setCurrentStep(nextAutoStep);
    }

    if (
      formData?.channel &&
      formData?.propertyType &&
      formData?.subtype &&
      (formData?.address?.locality?.code || formData?.address?.city?.code) &&
      formData?.address?.street &&
      formData?.address?.doorNo &&
      formData?.pitType &&
      formData?.tripData?.vehicleType &&
      formData?.tripData?.noOfTrips &&
      (formData?.tripData?.amountPerTrip || formData?.tripData?.amountPerTrip === 0)
    ) {
      setSubmitValve(formData?.pitType ? isPitDimensionsValid : true);
    } else {
      setSubmitValve(false);
    }
  };

  const onSubmit = (data) => {
    const applicationChannel = data?.channel || { code: "COUNTER" };
    const sanitationtype = data?.pitType?.code;
    const pitDimension = data?.pitDetail;
    const applicantName = data?.applicationData?.applicantName;
    const mobileNumber = data?.applicationData?.mobileNumber;
    const emailId = data?.applicationData?.emailId;
    const pincode = data?.address?.pincode;
    const street = data?.address?.street?.trim();
    const doorNo = data?.address?.doorNo?.trim();
    const slum = data?.address?.slum;
    const landmark = data?.address?.landmark?.trim();
    const propertyID = data?.propertyID?.propertyID || data?.cpt?.details?.propertyId || "";
    const noOfTrips = data?.tripData?.noOfTrips;
    const amount = data?.tripData?.amount !== undefined ? data?.tripData?.amount : data?.tripData?.undefined?.amount;
    const cityCode = data?.address?.city?.code;
    const city = data?.address?.city?.name;
    const state = data?.address?.city?.state;
    const localityCode = data?.cpt?.details?.address?.locality?.code || data?.address?.locality?.code;
    const localityName = data?.cpt?.details?.address?.locality?.name || data?.address?.locality?.name;
    const gender = data?.applicationData?.applicantGender;
    const paymentPreference = data?.paymentPreference ? (data?.paymentPreference?.code || data?.paymentPreference) : "POST_PAY";
    const advanceAmount = data?.advancepaymentPreference?.advanceAmount ?? 0;
    const distancefromroad = data?.tripData?.distancefromroad || "";
    const roadWidth = data?.tripData?.roadWidth || "";
    const gramPanchayat = data?.address?.gramPanchayat;
    const village = data?.address?.village;
    const propertyLocation = data?.address?.propertyLocation?.code;
    const newLocality = data?.address?.newLocality;
    const newGp = data?.address?.newGp;
    const newVillage = data?.address?.newVillage;

    const formData = {
      fsm: {
        citizen: {
          name: applicantName,
          mobileNumber,
          gender: gender,
          emailId: emailId,
        },
        tenantId: tenantId,
        sanitationtype: sanitationtype,
        source: applicationChannel?.code || "COUNTER",
        additionalDetails: {
          tripAmount: typeof amount === "number" ? JSON.stringify(amount) : amount,
          distancefromroad: distancefromroad,
          roadWidth: roadWidth,
          propertyID: propertyID,
        },
        propertyUsage: data?.subtype,
        vehicleCapacity: data?.tripData?.vehicleType?.capacity,
        pitDetail: {
          ...pitDimension,
          distanceFromRoad: data?.distanceFromRoad,
        },
        address: {
          tenantId: cityCode,
          landmark,
          doorNo,
          street,
          city,
          state,
          pincode,
          slumName: slum,
          locality: {
            code: propertyLocation === "FROM_GRAM_PANCHAYAT" ? gramPanchayat?.code : localityCode,
            name: propertyLocation === "FROM_GRAM_PANCHAYAT" ? gramPanchayat?.name : localityName,
          },
          geoLocation: {
            latitude: data?.address?.latitude,
            longitude: data?.address?.longitude,
          },
          additionalDetails: {
            boundaryType: propertyLocation === "FROM_GRAM_PANCHAYAT" ? "GP" : "Locality",
            gramPanchayat: {
              code: gramPanchayat?.code,
              name: gramPanchayat?.name,
            },
            village: village?.code
              ? {
                code: village?.code ? village?.code : "",
                name: village?.name ? village?.name : "",
              }
              : newVillage,
            newLocality: newLocality,
            newGramPanchayat: newGp,
          },
        },
        noOfTrips,
        paymentPreference,
        advanceAmount: typeof advanceAmount === "number" ? JSON.stringify(advanceAmount) : advanceAmount || "0",
      },
      workflow: null,
    };

    window.Digit.SessionStorage.set("propertyType", null);
    window.Digit.SessionStorage.set("subType", null);
    Digit.SessionStorage.set("city_property", null);
    Digit.SessionStorage.set("selected_localities", null);
    Digit.SessionStorage.set("locality_property", null);
    history.push("/digit-ui/employee/fsm/response", formData);
  };

  if (isLoading || isTripConfigLoading || isApplicantConfigLoading) {
    return <Loader />;
  }

  const configs = [...preFields, ...commonFields];
  let conf = [
    {
      head: "ES_TITLE_APPLICANT_DETAILS",
      route: "applicant-details",
      isCollapsible: true,
      isDefaultOpen: true,
      body: [
        {
          label: "ES_NEW_APPLICATION_APPLICATION_CHANNEL",
          isMandatory: true,
          type: "component",
          key: "channel",
          colSpan: "span 1",
          component: "SelectChannel",
          nextStep: "applicantName",
        },
        {
          type: "component",
          key: "applicationData",
          withoutLabel: true,
          colSpan: "span 1",
          fields: ["applicantName"],
          component: "SelectName",
        },
        {
          type: "component",
          key: "applicationData",
          withoutLabel: true,
          colSpan: "span 1",
          fields: ["mobileNumber"],
          component: "SelectName",
        },
        {
          type: "component",
          key: "applicationData",
          withoutLabel: true,
          colSpan: "span 1",
          fields: ["applicantGender"],
          component: "SelectName",
        },
        {
          type: "component",
          key: "paymentPreference",
          withoutLabel: true,
          colSpan: "span 1",
          component: "SelectPaymentType",
        },
      ],
    },
    {
      head: "ES_NEW_APPLICATION_PROPERTY_DETAILS",
      route: "property-details",
      isCollapsible: true,
      isDefaultOpen: true,
      body: [
        {
          label: "ES_NEW_APPLICATION_PROPERTY_ID",
          isMandatory: false,
          type: "component",
          key: "propertyID",
          colSpan: "span 1",
          component: "SelectPropertyID",
        },
        {
          label: "ES_NEW_APPLICATION_PROPERTY_TYPE",
          isMandatory: true,
          type: "component",
          route: "property-type",
          key: "propertyType",
          colSpan: "span 1",
          component: "SelectPropertyType",
          texts: {
            headerCaption: "",
            header: "CS_FILE_APPLICATION_PROPERTY_LABEL",
            cardText: "CS_FILE_APPLICATION_PROPERTY_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
          },
          nextStep: "property-subtype",
        },
        {
          label: "ES_NEW_APPLICATION_PROPERTY_SUB-TYPE",
          isMandatory: true,
          type: "component",
          route: "property-subtype",
          key: "subtype",
          colSpan: "span 1",
          component: "SelectPropertySubtype",
          texts: {
            headerCaption: "",
            header: "CS_FILE_APPLICATION_PROPERTY_SUBTYPE_LABEL",
            cardText: "CS_FILE_APPLICATION_PROPERTY_SUBTYPE_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
          },
          nextStep: "map",
        },
      ],
    },
    {
      head: "ES_NEW_APPLICATION_LOCATION_DETAILS",
      route: "location-details",
      isCollapsible: true,
      isDefaultOpen: true,
      body: [
        {
          route: "pincode",
          component: "FSMSelectPincode",
          texts: {
            headerCaption: "",
            header: "CS_FILE_APPLICATION_PINCODE_LABEL",
            cardText: "CS_FILE_APPLICATION_PINCODE_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
            skipText: "CORE_COMMON_SKIP_CONTINUE",
          },
          withoutLabel: true,
          key: "address",
          colSpan: "span 1",
          nextStep: "check-slum",
          type: "component",
        },
        {
          route: "address",
          component: "FSMSelectAddress",
          withoutLabel: true,
          texts: {
            headerCaption: "CS_FILE_APPLICATION_PROPERTY_LOCATION_LABEL",
            header: "CS_FILE_APPLICATION_PROPERTY_LOCATION_ADDRESS_TEXT",
            cardText: "CS_FILE_APPLICATION_PROPERTY_LOCATION_CITY_MOHALLA_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
          },
          key: "address",
          colSpan: "contents",
          nextStep: "locality-gramPanchayat",
          isMandatory: true,
          type: "component",
        },
        {
          route: "locality-gramPanchayat",
          component: "SelectLocalityOrGramPanchayat",
          withoutLabel: true,
          texts: {
            headerCaption: "CS_FILE_APPLICATION_PROPERTY_LOCATION_LABEL",
            header: "CS_FILE_APPLICATION_PROPERTY_LOCATION_ADDRESS_TEXT",
            cardText: "CS_FILE_APPLICATION_PROPERTY_LOCATION_CITY_MOHALLA_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
          },
          key: "address",
          colSpan: "contents",
          nextStep: "select-trip-number",
          isMandatory: true,
          type: "component",
        },
        {
          type: "component",
          route: "slum-details",
          isMandatory: true,
          component: "SelectSlumName",
          colSpan: "contents",
          texts: {
            header: "CS_NEW_APPLICATION_SLUM_NAME",
            cardText: "CS_NEW_APPLICATION_SLUM_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
          },
          withoutLabel: true,
          key: "address",
          nextStep: "street",
        },
        {
          type: "component",
          route: "street",
          component: "FSMSelectStreet",
          key: "address",
          colSpan: "contents",
          withoutLabel: true,
          texts: {
            headerCaption: "CS_FILE_APPLICATION_PROPERTY_LOCATION_LABEL",
            header: "CS_FILE_APPLICATION_PROPERTY_LOCATION_ADDRESS_TEXT",
            cardText: "CS_FILE_APPLICATION_PROPERTY_LOCATION_STREET_DOOR_NO_LABEL",
            submitBarLabel: "CS_COMMON_NEXT",
            skipText: "CORE_COMMON_SKIP_CONTINUE",
          },
          nextStep: "landmark",
        },
        {
          type: "component",
          route: "landmark",
          component: "FSMSelectLandmark",
          withoutLabel: true,
          colSpan: "span 1",
          texts: {
            headerCaption: "CS_FILE_APPLICATION_PROPERTY_LOCATION_LABEL",
            header: "CS_FILE_APPLICATION_PROPERTY_LOCATION_PROVIDE_LANDMARK_TITLE",
            cardText: "CS_FILE_APPLICATION_PROPERTY_LOCATION_PROVIDE_LANDMARK_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
            skipText: "CORE_COMMON_SKIP_CONTINUE",
          },
          key: "address",
          nextStep: "pit-type",
        },
      ],
    },
    {
      head: "CS_CHECK_PIT_SEPTIC_TANK_DETAILS",
      route: "pit-details",
      isCollapsible: true,
      isDefaultOpen: true,
      body: [
        {
          label: "ES_NEW_APPLICATION_PIT_TYPE",
          isMandatory: true,
          type: "component",
          route: "pit-type",
          key: "pitType",
          colSpan: "span 1",
          component: "SelectPitType",
          texts: {
            header: "CS_FILE_PROPERTY_PIT_TYPE",
            cardText: "CS_FILE_PROPERTY_PIT_TYPE_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
          },
          nextStep: "tank-size",
        },
        {
          route: "tank-size",
          component: "SelectTankSize",
          isMandatory: false,
          colSpan: "span 1",
          texts: {
            headerCaption: "",
            header: "CS_FILE_APPLICATION_PIT_SEPTIC_TANK_SIZE_TITLE",
            cardText: "CS_FILE_APPLICATION_PIT_SEPTIC_TANK_SIZE_TEXT",
            submitBarLabel: "CS_COMMON_NEXT",
            skipText: "CORE_COMMON_SKIP_CONTINUE",
          },
          type: "component",
          key: "pitDetail",
          nextStep: "select-payment-preference",
          label: "ES_NEW_APPLICATION_PIT_DIMENSION",
        },
      ],
    },
    {
      head: "ES_TITLE_PAYMENT_DETAILS",
      route: "payment-details",
      isCollapsible: true,
      isDefaultOpen: true,
      body: [
        {
          type: "component",
          key: "tripData",
          withoutLabel: true,
          colSpan: "span 2",
          component: "SelectTrips",
        },
        {
          type: "component",
          key: "tripData",
          withoutLabel: true,
          colSpan: "span 2",
          component: "SelectTripData",
        },
        {
          type: "component",
          key: "advancepaymentPreference",
          withoutLabel: true,
          colSpan: "span 2",
          component: "AdvanceCollection",
        },
      ],
    },
  ];
  const filteredConfig = conf
    .filter((i) => !i.hideInEmployee)
    .map((config) => ({
      ...config,
      body: config.body.filter((a) => !a.hideInEmployee),
    }));

  const timelineConfig = filteredConfig.map((section, index) => ({
    route: section.route || `step-${index + 1}`,
    timeLine: [{ actions: section.head, currentStep: index + 1 }],
  }));

  const handleStepSelect = (_route, index) => {
    setCurrentStep(index + 1);
    const cards = formWrapperRef.current?.querySelectorAll(".collapsible-card");
    if (cards && cards[index]) {
      cards[index].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="employee-form-section-wrapper">
      <VerticalTimeline config={timelineConfig} currentActiveIndex={currentStep - 1} showFinalStep={false} onSelect={handleStepSelect} />
      <div ref={formWrapperRef} className="employee-form-section" style={{ flex: "1", minWidth: 0 }}>
        <FormComposer
          heading={heading}
          isDisabled={!canSubmit}
          label={t("ES_COMMON_APPLICATION_SUBMIT")}
          config={filteredConfig}
          fieldStyle={{ marginRight: 0 }}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          onFormValueChange={onFormValueChange}
          noCard={true}
          noBreakLine={true}
        />
      </div>
    </div>
  );
};