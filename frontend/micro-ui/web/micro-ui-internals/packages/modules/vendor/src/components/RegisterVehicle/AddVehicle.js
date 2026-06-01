import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Toast, InfoIcon, VerticalTimeline } from "@djb25/digit-ui-react-components";
import { useHistory } from "react-router-dom";
import { useQueryClient } from "react-query";
import VehicleConfig from "../../config/VehicleConfig";

const AddVehicle = ({ parentUrl, heading }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();
  const [showToast, setShowToast] = useState(null);
  const history = useHistory();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [, setMutationHappened] = Digit.Hooks.useSessionStorage("FSM_MUTATION_HAPPENED", false);
  const [, , clearError] = Digit.Hooks.useSessionStorage("FSM_ERROR_DATA", false);
  const [, , clearSuccessData] = Digit.Hooks.useSessionStorage("FSM_MUTATION_SUCCESS_DATA", false);

  const isCitizen = Digit.UserService.getType() === "WT_VENDOR" || Digit.UserService.hasAccess(["WT_VENDOR"]);
  const { mutate } = Digit.Hooks.fsm.useVehicleCreate(stateId);
  const { mutate: mutateVendor } = Digit.Hooks.fsm.useVendorUpdate("dl.djb");

  const mobileNumber = Digit.UserService.getUser()?.info?.mobileNumber;

  const { data: vendorData, isLoading: isVendorLoading } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { mobileNumber: mobileNumber },
    { enabled: !!(isCitizen && mobileNumber) }
  );

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Config = VehicleConfig(t);

  Config[0].body.forEach((item) => {
    if (item.label === "ES_FSM_REGISTRY_VEHICLE_NUMBER") {
      item.labelChildren = (
        <div className="tooltip" style={{ paddingLeft: "10px", marginBottom: "-3px" }}>
          <InfoIcon />
          <span className="tooltiptext" style={{ width: "320px", left: "230%", fontSize: "14px" }}>
            {item.populators.validation.title}
          </span>
        </div>
      );
    }
  });

  const [canSubmit, setSubmitValve] = useState(false);

  const defaultValues = {
    serviceType: {
      code: "WT",
      name: "WT",
      i18nKey: "WT",
    },
    tripData: {
      noOfTrips: 1,
      amountPerTrip: null,
      amount: null,
    },
  };
  const formatVehicleNumber = (input) => {
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleaned.length <= 2) return cleaned;

    const state = cleaned.slice(0, 2);
    const rest = cleaned.slice(2);
    if (!rest) return state;

    const rtoMatch = rest.match(/^(\d{1,2})/);
    if (!rtoMatch) return state + "-" + rest;

    const rtoDigits = rtoMatch[1];
    const afterRto = rest.slice(rtoDigits.length);

    const lettersMatch = afterRto.match(/^([A-Z]*)/);
    const middleLetters = lettersMatch ? lettersMatch[1] : "";
    const number = afterRto.slice(middleLetters.length);

    if (!number) {
      // No number digits yet — still typing the middle part
      return state + "-" + rtoDigits + middleLetters;
    }

    // Number has started — determine 3-group vs 4-group format
    if (middleLetters.length >= 3) {
      // 4-group: split letters (1 + rest for 3 letters, 2 + 2 for 4 letters)
      const splitAt = middleLetters.length <= 3 ? 1 : 2;
      const series = middleLetters.slice(0, splitAt);
      const subSeries = middleLetters.slice(splitAt);
      return state + "-" + rtoDigits + series + "-" + subSeries + "-" + number.slice(0, 4);
    }
    // 3-group: RTO digits + series letters combined
    return state + "-" + rtoDigits + middleLetters + "-" + number.slice(0, 4);
  };

  const onFormValueChange = (setValue, formData) => {
    if (formData?.registrationNumber) {
      let updatedRegNo = formatVehicleNumber(formData.registrationNumber);
      if (updatedRegNo.length > 15) {
        updatedRegNo = updatedRegNo.slice(0, 15);
      }
      if (updatedRegNo !== formData.registrationNumber) {
        setValue("registrationNumber", updatedRegNo);
      }
    }
    if (
      formData?.registrationNumber &&
      formData?.ownerName &&
      formData?.phone &&
      formData?.vehicle?.modal &&
      formData?.vehicle?.type &&
      formData?.selectGender &&
      formData?.dob &&
      new Date(formData?.dob).getTime() <= new Date().setFullYear(new Date().getFullYear() - 18)
    ) {
      setSubmitValve(true);
    } else {
      setSubmitValve(false);
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onSubmit = (data) => {
    const registrationNumber = data?.registrationNumber;
    const vehicleType = data?.vehicle?.type?.code;
    const vehicleModal = data?.vehicle?.modal?.code;
    const tankCapacity = data?.vehicle?.type?.capacity;
    const pollutionCert = new Date(`${data?.pollutionCert}`).getTime();
    const insurance = new Date(`${data?.insurance}`).getTime();
    const roadTax = new Date(`${data?.roadTax}`).getTime();
    const fitnessValidity = new Date(`${data?.fitnessValidity}`).getTime();
    const ownerName = data?.ownerName;
    const phone = data?.phone;
    const additionalDetails = data?.serviceType?.code;
    const gender = data?.selectGender?.code;
    const emailId = data?.emailId;
    const dob = new Date(`${data.dob}`).getTime() || new Date(`1/1/1970`).getTime();
    const formData = {
      vehicle: {
        tenantId: "dl.djb",
        registrationNumber: registrationNumber,
        model: vehicleModal,
        type: vehicleType,
        tankCapacity: tankCapacity,
        suctionType: "SEWER_SUCTION_MACHINE",
        pollutionCertiValidTill: pollutionCert,
        InsuranceCertValidTill: insurance,
        fitnessValidTill: fitnessValidity,
        roadTaxPaidTill: roadTax,
        gpsEnabled: true,
        source: "Municipal records",
        owner: {
          tenantId: stateId,
          name: ownerName,
          fatherOrHusbandName: ownerName,
          relationship: "OTHER",

          correspondenceAddress: "",
          mobileNumber: phone,
          gender: gender,
          dob: dob,
          emailId: emailId || "abc@egov.com",
        },
        additionalDetails: {
          serviceType: additionalDetails,
        },
        vehicleOwner: "ULB",
      },
    };

    mutate(formData, {
      onError: (error, variables) => {
        const errorMessage = error?.response?.data?.Errors?.[0]?.message || error?.message || "An error occurred";
        setShowToast({ key: "error", action: errorMessage });
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        const isError = data?.error === true || data?.Errors?.length > 0 || data?.data?.Errors?.length > 0;
        if (isError) {
          const errorMessage = data?.data?.Errors?.[0]?.message || data?.Errors?.[0]?.message || data?.message || "An error occurred";
          setShowToast({ key: "error", action: errorMessage });
          setTimeout(closeToast, 5000);
          return;
        }

        setShowToast({ key: "success", action: "ADD_VEHICLE" });
        queryClient.invalidateQueries("FSM_VEICLES_SEARCH");

        if (isCitizen && vendorData?.[0]?.dsoDetails) {
          const newVehicle = data?.vehicle?.map((v) => ({ ...v, vendorVehicleStatus: "ACTIVE", status: "ACTIVE" })) || [];
          const vendor = vendorData[0].dsoDetails;
          const updatedVendor = {
            vendor: {
              ...vendor,
              vehicles: vendor.vehicles ? [...vendor.vehicles, ...newVehicle] : [...newVehicle],
            },
          };

          mutateVendor(updatedVendor, {
            onError: (error) => {
              const errorMessage = error?.response?.data?.Errors?.[0]?.message || error?.message || "An error occurred";
              setShowToast({ key: "error", action: errorMessage });
              setTimeout(closeToast, 5000);
            },
            onSuccess: (vendorDataRes) => {
              const isError = vendorDataRes?.error === true || vendorDataRes?.Errors?.length > 0 || vendorDataRes?.data?.Errors?.length > 0;
              if (isError) {
                const errorMessage = vendorDataRes?.data?.Errors?.[0]?.message || vendorDataRes?.Errors?.[0]?.message || vendorDataRes?.message || "An error occurred";
                setShowToast({ key: "error", action: errorMessage });
                setTimeout(closeToast, 5000);
                return;
              }
              setShowToast({ key: "success", action: "ADD_VEHICLE" });
              queryClient.invalidateQueries("DSO_SEARCH");
              const userType = Digit.UserService.getUser()?.info?.type?.toLowerCase() || "citizen";
              setTimeout(() => {
                closeToast();
                history.push(`/digit-ui/${userType}/vendor/search-vendor?selectedTabs=VEHICLE`);
              }, 3000);
            },
          });
        } else {
          const userType = Digit.UserService.getUser()?.info?.type?.toLowerCase() || "citizen";
          queryClient.invalidateQueries("FSM_VEICLES_SEARCH");
          setTimeout(() => {
            closeToast();
            history.push(`/digit-ui/${userType}/vendor/search-vendor?selectedTabs=VEHICLE`);
          }, 3000);
        }
      },
    });
  };

  return (
    <React.Fragment>
      <VerticalTimeline
        config={[
          {
            route: "vendor-details",
            timeLine: [{ actions: t("ES_FSM_REGISTRY_TITLE_NEW_VEHICLE"), currentStep: 1 }],
          },
        ]}
        currentActiveIndex={0}
        showFinalStep={false}
      />
      <div style={{ flex: "1", overflowY: "auto" }}>
        <FormComposer
          isDisabled={!canSubmit}
          label={t("ES_COMMON_APPLICATION_SUBMIT")}
          config={Config.filter((i) => !i.hideInEmployee).map((config) => {
            return {
              ...config,
              isCollapsible: true,
              isDefaultOpen: true,
              body: config.body.filter((a) => !a.hideInEmployee),
            };
          })}
          fieldStyle={{ marginRight: 0 }}
          onSubmit={onSubmit}
          defaultValues={defaultValues}
          onFormValueChange={onFormValueChange}
          noBreakLine={true}
          mode="onChange"
          noCard={true}
        />
        {showToast && (
          <Toast
            error={showToast.key === "error" ? true : false}
            label={t(showToast.key === "success" ? `ES_FSM_REGISTRY_${showToast.action}_SUCCESS` : showToast.action)}
            onClose={closeToast}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default AddVehicle;
