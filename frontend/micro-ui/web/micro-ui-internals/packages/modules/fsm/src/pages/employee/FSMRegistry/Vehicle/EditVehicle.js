import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposer, Loader, Toast, Header, InfoIcon } from "@djb25/digit-ui-react-components";
import { useHistory, useParams } from "react-router-dom";
import { useQueryClient } from "react-query";
import VehicleConfig from "../../configs/VehicleConfig";

const EditVehicle = ({ parentUrl, parentRoute, heading }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();
  let { id: dsoId } = useParams();
  const [showToast, setShowToast] = useState(null);
  const [canSubmit, setSubmitValve] = useState(false);
  const [defaultValues, setDefaultValues] = useState({});
  const [vehicleDetails, setVehicleDetails] = useState({});
  const queryClient = useQueryClient();

  const [mutationHappened, setMutationHappened, clear] = Digit.Hooks.useSessionStorage("FSM_MUTATION_HAPPENED", false);
  const [errorInfo, setErrorInfo, clearError] = Digit.Hooks.useSessionStorage("FSM_ERROR_DATA", false);
  const [successData, setsuccessData, clearSuccessData] = Digit.Hooks.useSessionStorage("FSM_MUTATION_SUCCESS_DATA", false);

  const { data: vehicleData, isLoading: vehicleDataLoading, isSuccess: isVehicleSuccess, error: vehicleError } = Digit.Hooks.fsm.useVehicleDetails(
    tenantId,
    { registrationNumber: dsoId },
    { staleTime: Infinity }
  );

  const { isLoading: isLoading, isError: vendorCreateError, data: updateResponse, error: updateError, mutate } = Digit.Hooks.fsm.useUpdateVehicle(
    tenantId
  );

  useEffect(() => {
    setMutationHappened(false);
    clearSuccessData();
    clearError();
  }, []);

  useEffect(() => {
    if (vehicleData && vehicleData[0]) {
      let vehicleDetails = vehicleData[0];
      setVehicleDetails(vehicleDetails?.vehicleData);
      let values = {
        registrationNumber: vehicleDetails?.vehicleData?.registrationNumber,
        vehicle: {
          type: vehicleDetails?.vehicleData?.type,
          modal: vehicleDetails?.vehicleData?.model,
          tankCapacity: vehicleDetails?.vehicleData?.tankCapacity,
        },
        pollutionCert:
          vehicleDetails?.vehicleData?.pollutionCertiValidTill &&
          Digit.DateUtils.ConvertTimestampToDate(vehicleDetails?.vehicleData?.pollutionCertiValidTill, "yyyy-MM-dd"),
        insurance:
          vehicleDetails?.vehicleData?.InsuranceCertValidTill &&
          Digit.DateUtils.ConvertTimestampToDate(vehicleDetails?.vehicleData?.InsuranceCertValidTill, "yyyy-MM-dd"),
        roadTax:
          vehicleDetails?.vehicleData?.roadTaxPaidTill &&
          Digit.DateUtils.ConvertTimestampToDate(vehicleDetails?.vehicleData?.roadTaxPaidTill, "yyyy-MM-dd"),
        fitnessValidity:
          vehicleDetails?.vehicleData?.fitnessValidTill &&
          Digit.DateUtils.ConvertTimestampToDate(vehicleDetails?.vehicleData?.fitnessValidTill, "yyyy-MM-dd"),
        phone: vehicleDetails?.vehicleData?.owner?.mobileNumber,
        ownerName: vehicleDetails?.vehicleData?.owner?.name,
        selectGender: vehicleDetails?.vehicleData?.owner?.gender,
        dob: vehicleDetails?.vehicleData?.owner?.dob && Digit.DateUtils.ConvertTimestampToDate(vehicleDetails?.vehicleData?.owner?.dob, "yyyy-MM-dd"),
        emailId: vehicleDetails?.vehicleData?.owner?.emailId === "abc@egov.com" ? "" : vehicleDetails?.vehicleData?.owner?.emailId,
        additionalDetails: vehicleDetails?.vehicleData?.additionalDetails?.description,
      };
      setDefaultValues(values);
    }
  }, [vehicleData]);

  const { t } = useTranslation();
  const history = useHistory();

  const Config = VehicleConfig(t, false);

  Config[0].body.forEach((item) => {
    if (item.label === "ES_FSM_REGISTRY_VEHICLE_NUMBER") {
      item.labelChildren = (
        <div className="tooltip" style={{ paddingLeft: "10px", marginBottom: "-3px" }}>
          <InfoIcon />
          <span className="tooltiptext" style={{ width: "150px", left: "230%", fontSize: "14px" }}>
            {t(item.populators.validation.title)}
          </span>
        </div>
      );
    }
  });

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
      (formData?.vehicle?.modal?.code || formData?.vehicle?.modal) &&
      (formData?.vehicle?.type?.code || formData?.vehicle?.type) &&
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
    const vehicleType = data?.vehicle?.type?.code || data?.vehicle?.type;
    const vehicleModal = data?.vehicle?.modal?.code || data?.vehicle?.modal;
    const tankCapacity = data?.vehicle?.type?.capacity || data?.vehicle?.tankCapacity;
    const pollutionCert = data?.pollutionCert > 0 || data?.pollutionCert?.length > 0 ? new Date(`${data?.pollutionCert}`).getTime() : null;
    const insurance = data?.insurance > 0 || data?.insurance?.length > 0 ? new Date(`${data?.insurance}`).getTime() : null;
    const roadTax = data?.roadTax > 0 || data?.roadTax?.length > 0 ? new Date(`${data?.roadTax}`).getTime() : null;
    const fitnessValidity = data?.fitnessValidity > 0 || data?.fitnessValidity?.length > 0 ? new Date(`${data?.fitnessValidity}`).getTime() : null;
    const additionalDetails = data?.additionalDetails;
    const gender = data?.selectGender?.code || data?.selectGender || vehicleDetails.owner?.gender || "OTHER";
    const dob = data?.dob ? new Date(`${data.dob}`).getTime() : vehicleDetails.owner?.dob;
    const formData = {
      vehicle: {
        ...vehicleDetails,
        registrationNumber: data?.registrationNumber,
        model: vehicleModal,
        type: vehicleType,
        tankCapacity: tankCapacity,
        pollutionCertiValidTill: pollutionCert,
        InsuranceCertValidTill: insurance,
        fitnessValidTill: fitnessValidity,
        roadTaxPaidTill: roadTax,
        additionalDetails: {
          ...vehicleDetails.additionalDetails,
          description: additionalDetails,
        },
        owner: {
          ...vehicleDetails.owner,
          gender: gender,
          dob: dob,
          emailId: data?.emailId || "abc@egov.com",
          name: data?.ownerName || vehicleDetails.owner?.name,
          mobileNumber: data?.phone || vehicleDetails.owner?.mobileNumber,
        },
      },
    };
    mutate(formData, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: "UPDATE_VEHICLE" });
        setTimeout(closeToast, 5000);
        queryClient.invalidateQueries("DSO_SEARCH");
        setTimeout(() => {
          closeToast();
          history.push(`${parentRoute || "/digit-ui/employee/fsm"}/registry/vehicle-details/${data?.registrationNumber || dsoId}`);
        }, 5000);
      },
    });
  };

  if (vehicleDataLoading || Object.keys(defaultValues).length == 0) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <FormComposer
        isDisabled={!canSubmit}
        label={t("ES_COMMON_APPLICATION_SUBMIT")}
        config={Config.filter((i) => !i.hideInEmployee).map((config) => {
          return {
            ...config,
            body: config.body.filter((a) => !a.hideInEmployee),
          };
        })}
        fieldStyle={{ marginRight: 0 }}
        onSubmit={onSubmit}
        defaultValues={defaultValues}
        onFormValueChange={onFormValueChange}
        noBreakLine={true}
        formClassName="vehicle-details-card"
      />
      {showToast && (
        <Toast
          error={showToast.key === "error" ? true : false}
          label={t(showToast.key === "success" ? `ES_FSM_REGISTRY_${showToast.action}_SUCCESS` : showToast.action)}
          onClose={closeToast}
        />
      )}
    </React.Fragment>
  );
};

export default EditVehicle;
