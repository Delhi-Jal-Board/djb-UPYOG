import React, { useEffect, useState } from "react";
import { getVehicleType, fetchBillingSlabDetails, normalizeTenantId } from "../utils";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, Loader, CardLabelError } from "@djb25/digit-ui-react-components";
import { useLocation, useParams } from "react-router-dom";

const SelectTripData = ({ t, config, onSelect, formData = {}, userType }) => {
  const tenantId = normalizeTenantId(Digit.ULBService.getCurrentTenantId());
  const state = Digit.ULBService.getStateId();
  const { pathname: url } = useLocation();
  const editScreen = url.includes("/modify-application/");
  let { id: applicationNumber } = useParams();
  const userInfo = Digit.UserService.getUser();
  const { isLoading: applicationLoading, isError, data: applicationData, error } = Digit.Hooks.fsm.useSearch(
    tenantId,
    { applicationNos: applicationNumber, uuid: userInfo.uuid },
    { staleTime: Infinity }
  );
  const { pathname } = useLocation();
  const presentInModifyApplication = pathname.includes("modify");

  const [vehicle, setVehicle] = useState({ label: formData?.tripData?.vehicleCapacity });
  const [billError, setError] = useState(false);

  const { isLoading: isVehicleMenuLoading, data: vehicleData } = Digit.Hooks.fsm.useMDMS(state, "Vehicle", "VehicleType", { staleTime: Infinity });

  const { data: dsoData, isLoading: isDsoLoading, isSuccess: isDsoSuccess, error: dsoError } = Digit.Hooks.fsm.useDsoSearch(tenantId, {
    limit: -1,
    status: "ACTIVE",
  });

  const [vehicleMenu, setVehicleMenu] = useState([]);

  useEffect(() => {
    if (dsoData && vehicleData) {
      const allVehicles = dsoData.reduce((acc, curr) => {
        return curr.vehicles && curr.vehicles.length ? acc.concat(curr.vehicles) : acc;
      }, []);

      const cpacityMenu = Array.from(new Set(allVehicles.map((a) => a.capacity))).map((capacity) => allVehicles.find((a) => a.capacity === capacity));

      setVehicleMenu(cpacityMenu);
    }
  }, [dsoData, vehicleData]);

  const inputs = [
    {
      label: "ES_NEW_APPLICATION_AMOUNT_PER_TRIP",
      type: "text",
      name: "amountPerTrip",
      error: t("ES_NEW_APPLICATION_AMOUNT_INVALID"),
      validation: {
        isRequired: true,
        pattern: "[0-9]{1,10}",
        title: t("ES_APPLICATION_BILL_SLAB_ERROR"),
      },
      default: formData?.tripData?.amountPerTrip,
      disable: formData?.address?.propertyLocation?.code === "FROM_GRAM_PANCHAYAT"
      ? false
      : true,
      isMandatory: true,
    },
    {
      label: "ES_PAYMENT_DETAILS_TOTAL_AMOUNT",
      type: "text",
      name: "amount",
      validation: {
        isRequired: true,
        title: t("ES_APPLICATION_BILL_SLAB_ERROR"),
      },
      default: formData?.tripData?.amount,
      disable: true,
      isMandatory: true,
    },
  ];

  function setAmount(value) {
    const numVal = value === "" ? "" : Number(value);
    const trips = Number(formData?.tripData?.noOfTrips) || 1;
    const totalAmount = numVal === "" || isNaN(numVal) ? "" : numVal * trips;
    onSelect(config.key, {
      ...formData[config.key],
      amountPerTrip: value,
      amount: totalAmount,
    });
    if (value !== "" && !isNaN(numVal)) {
      setError(false);
      Digit.SessionStorage.set("total_amount", totalAmount);
    }
  }

  function setValue(object) {
    let a = { ...formData[config.key], ...object };
    onSelect(config.key, a);
  }
  useEffect(() => {
    (async () => {
      if (formData?.tripData?.vehicleType !== vehicle) {
        setVehicle({ label: formData?.tripData?.vehicleType?.capacity });
      }

      const trips = Number(formData?.tripData?.noOfTrips) || 1;

      if (formData?.address?.propertyLocation?.code === "FROM_GRAM_PANCHAYAT") {
        if (formData?.tripData?.amount !== totalAmt) {
          setValue({
            amount: totalAmt,
          });
        }
        Digit.SessionStorage.set("total_amount", totalAmt);
        setError(false);
      } else if (
        formData?.propertyType &&
        formData?.subtype &&
        formData?.address &&
        formData?.tripData?.vehicleType?.capacity &&
        formData?.address?.propertyLocation?.code === "WITHIN_ULB_LIMITS"
      ) {
        const billSlab = await fetchBillingSlabDetails(tenantId, formData);
        if (billSlab && (billSlab?.price || billSlab?.price === 0)) {
          const rate = billSlab.price;
          const totalAmt = rate * trips;
          if (formData?.tripData?.amountPerTrip !== rate || formData?.tripData?.amount !== totalAmt) {
            setValue({
              amountPerTrip: rate,
              amount: totalAmt,
            });
          }
          Digit.SessionStorage.set("total_amount", totalAmt);
          setError(false);
        } else {
          // If no slab found, keep manually entered rate if employee already provided one
          if (formData?.tripData?.amountPerTrip !== undefined && formData?.tripData?.amountPerTrip !== null && formData?.tripData?.amountPerTrip !== "") {
            const totalAmt = Number(formData.tripData.amountPerTrip) * trips;
            if (formData?.tripData?.amount !== totalAmt) {
              setValue({
                amount: totalAmt,
              });
            }
            Digit.SessionStorage.set("total_amount", totalAmt);
            setError(false);
          } else {
            if (formData?.tripData?.amountPerTrip !== "" || formData?.tripData?.amount !== "") {
              setValue({
                amountPerTrip: "",
                amount: "",
              });
            }
            setError(true);
          }
        }
      }
    })();
  }, [
    formData?.propertyType,
    formData?.subtype,
    formData?.address?.slum,
    formData?.address?.city?.code,
    formData?.tripData?.vehicleType?.capacity,
    formData?.tripData?.noOfTrips,
    formData?.address?.propertyLocation?.code,
  ]);

  return isVehicleMenuLoading && isDsoLoading ? (
    <Loader />
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", width: "100%" }}>
      {inputs?.map((input, index) => (
        <LabelFieldPair key={index}>
          <CardLabel className="card-label-smaller">
            {t(input.label) + " (₹)"}
            {input.isMandatory ? " * " : null}
          </CardLabel>
          <div className="field">
            <TextInput
              type={input.type}
              onChange={(e) => {
                if (index === 0) {
                  setAmount(e.target.value);
                }
              }}
              key={input.name}
              value={input.default ? input.default : formData && formData[config.key] ? formData[config.key][input.name] : null}
              {...input.validation}
              disable={input.disable}
            />
          </div>
        </LabelFieldPair>
      ))}
      {billError && (!formData?.tripData?.amountPerTrip && formData?.tripData?.amountPerTrip !== 0) ? (
        <CardLabelError style={{ width: "100%", textAlign: "center", gridColumn: "span 2" }}>
          {t("ES_APPLICATION_BILL_SLAB_ERROR")}
        </CardLabelError>
      ) : null}
    </div>
  );
};

export default SelectTripData;
