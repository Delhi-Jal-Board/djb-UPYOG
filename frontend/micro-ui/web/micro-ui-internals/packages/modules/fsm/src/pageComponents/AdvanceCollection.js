import React, { useEffect, useState } from "react";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, Loader, CardLabelError } from "@djb25/digit-ui-react-components";
import { useParams, useLocation } from "react-router-dom";
import { fetchBillingSlabDetails, normalizeTenantId } from "../utils";

const AdvanceCollection = ({ t, config, onSelect, formData, userType, FSMTextFieldStyle }) => {
  const tenantId = normalizeTenantId(Digit.ULBService.getCurrentTenantId());
  const state = Digit.ULBService.getStateId();
  const { pathname: url } = useLocation();
  let { id: applicationNumber } = useParams();
  const userInfo = Digit.UserService.getUser();
  const [TotalAmount, setTotalAmount] = useState();
  const [AdvanceAmount, setAdvanceAmounts] = useState();
  const { isLoading: applicationLoading, isError, data: applicationData, error } = Digit.Hooks.fsm.useSearch(
    tenantId,
    { applicationNos: applicationNumber, uuid: userInfo.uuid },
    { staleTime: Infinity }
  );

  const [vehicle, setVehicle] = useState({
    label: formData?.tripData?.vehicleCapacity,
  });
  const [billError, setError] = useState(false);

  const { isLoading: isVehicleMenuLoading, data: vehicleData } = Digit.Hooks.fsm.useMDMS(state, "Vehicle", "VehicleType", {
    staleTime: Infinity,
  });

  const { data: dsoData, isLoading: isDsoLoading, isSuccess: isDsoSuccess, error: dsoError } = Digit.Hooks.fsm.useDsoSearch(tenantId, {
    limit: -1,
    status: "ACTIVE",
  });

  const inputs = [
    {
      label: "ES_NEW_APPLICATION_ADVANCE_COLLECTION",
      type: "text",
      name: "advanceAmount",
      validation: {
        isRequired: true,
        min: "0",
        pattern: `^[0-9]+`,
        title: t("ES_NEW_APPLICATION_AMOUNT_INVALID"),
      },

      default: formData?.advanceAmount,
      isMandatory: true,
    },
  ];

  function setValue(object) {
    onSelect(config.key, { ...formData[config.key], ...object });
  }
  function setAdvanceAmount(value) {
    onSelect(config.key, { ...formData[config.key], advanceAmount: value });
  }

  useEffect(() => {
    (async () => {
      if (formData?.tripData?.vehicleType !== vehicle) {
        setVehicle({ label: formData?.tripData?.vehicleType?.capacity });
      }

      const trips = Number(formData?.tripData?.noOfTrips) || 1;
      const targetTenant = normalizeTenantId(formData?.address?.city?.code || tenantId);

      let rate = formData?.tripData?.amountPerTrip;
      if (
        (rate === undefined || rate === null || rate === "") &&
        formData?.propertyType &&
        formData?.subtype &&
        formData?.address &&
        formData?.tripData?.vehicleType?.capacity &&
        formData?.address?.propertyLocation?.code === "WITHIN_ULB_LIMITS"
      ) {
        const billSlab = await fetchBillingSlabDetails(tenantId, formData);
        if (billSlab && (billSlab?.price || billSlab?.price === 0)) {
          rate = billSlab.price;
        }
      }

      if (rate !== undefined && rate !== null && rate !== "") {
        const totaltripAmount = Number(rate) * trips;
        try {
          const res = await Digit.FSMService.advanceBalanceCalculate(targetTenant, {
            totalTripAmount: totaltripAmount,
          });
          const advanceBalanceAmount = res?.advanceAmount !== undefined ? res.advanceAmount : 0;
          Digit.SessionStorage.set("total_amount", totaltripAmount);
          Digit.SessionStorage.set("advance_amount", advanceBalanceAmount);
          setTotalAmount(totaltripAmount);
          setAdvanceAmounts(advanceBalanceAmount);
          if (!url.includes("modify") || (url.includes("modify") && advanceBalanceAmount > formData?.advancepaymentPreference?.advanceAmount)) {
            if (formData?.advancepaymentPreference?.advanceAmount !== advanceBalanceAmount) {
              setValue({
                advanceAmount: advanceBalanceAmount,
              });
            }
          }
          setError(false);
        } catch (calcErr) {
          console.warn("advanceBalanceCalculate failed, using fallback:", calcErr);
          Digit.SessionStorage.set("total_amount", totaltripAmount);
          Digit.SessionStorage.set("advance_amount", 0);
          setTotalAmount(totaltripAmount);
          setAdvanceAmounts(0);
          if (formData?.advancepaymentPreference?.advanceAmount !== 0) {
            setValue({
              advanceAmount: 0,
            });
          }

          setError(false);
        }
      } else {
        sessionStorage.removeItem("Digit.total_amount");
        sessionStorage.removeItem("Digit.advance_amount");
        setError(true);
      }
    })();
  }, [
    formData?.propertyType,
    formData?.subtype,
    formData?.address?.slum,
    formData?.address?.city?.code,
    formData?.tripData?.vehicleType?.capacity,
    formData?.tripData?.noOfTrips,
    formData?.tripData?.amountPerTrip,
    formData?.address?.propertyLocation?.code,
  ]);

  return isVehicleMenuLoading && isDsoLoading ? (
    <Loader />
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", width: "100%" }}>
      {formData?.tripData?.amountPerTrip !== 0 &&
        inputs?.map((input, index) => {
          let currentValue = formData && formData[config.key] && formData[config.key][input.name];

          return (
            <React.Fragment key={index}>
              <LabelFieldPair key={index}>
                <CardLabel className="card-label-smaller">
                  {t(input.label) + " (₹)"}
                  {input.isMandatory ? <span className="check-page-link-button"> * </span> : null}
                </CardLabel>
                <div className="field">
                  <TextInput
                    disabled={url.includes("modify") ? true : false}
                    type={input.type}
                    key={input.name}
                    style={FSMTextFieldStyle}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    value={input.default ? input.default : formData && formData[config.key] ? formData[config.key][input.name] : 0}
                    {...input.validation}
                  />
                  {currentValue > TotalAmount && (
                    <CardLabelError
                      style={{
                        width: "100%",
                        marginTop: "-15px",
                        fontSize: "14px",
                        marginBottom: "0px",
                      }}
                    >
                      {t("FSM_ADVANCE_AMOUNT_MAX")}
                    </CardLabelError>
                  )}
                  {currentValue < AdvanceAmount && (
                    <CardLabelError
                      style={{
                        width: "100%",
                        marginTop: "-15px",
                        fontSize: "14px",
                        marginBottom: "0px",
                      }}
                    >
                      {t("FSM_ADVANCE_AMOUNT_MIN")}
                    </CardLabelError>
                  )}
                  {url.includes("modify-application") &&
                    Number(AdvanceAmount) === 0 &&
                    applicationData?.advanceAmount > 0 &&
                    Number(currentValue) === 0 && (
                      <CardLabelError
                        style={{
                          width: "100%",
                          marginTop: "-15px",
                          fontSize: "14px",
                          marginBottom: "0px",
                        }}
                      >
                        {t("FSM_ADVANCE_AMOUNT_NOT_ZERO")}
                      </CardLabelError>
                    )}
                </div>
              </LabelFieldPair>
            </React.Fragment>
          );
        })}
    </div>
  );
};

export default AdvanceCollection;
