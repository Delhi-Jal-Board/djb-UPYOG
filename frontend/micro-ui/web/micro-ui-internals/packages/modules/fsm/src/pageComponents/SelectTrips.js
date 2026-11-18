import React, { useEffect, useState } from "react";
import { getVehicleType, fetchBillingSlabDetails, normalizeTenantId } from "../utils";
import { LabelFieldPair, CardLabel, TextInput, Dropdown, Loader, CardLabelError } from "@djb25/digit-ui-react-components";
import { useLocation, useParams } from "react-router-dom";

const SelectTrips = ({ t, config, onSelect, formData = {}, userType, styles, FSMTextFieldStyle }) => {
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
      label: "ES_NEW_APPLICATION_PAYMENT_NO_OF_TRIPS",
      type: "text",
      name: "noOfTrips",
      error: t("ES_NEW_APPLICATION_NO_OF_TRIPS_INVALID"),
      validation: {
        isRequired: true,
        pattern: `^[1-9]+`,
        min: "1",
        title: t("ES_NEW_APPLICATION_NO_OF_TRIPS_INVALID"),
      },
      default: formData?.tripData?.noOfTrips,
      disable: false,
      isMandatory: true,
    },
  ];

  function selectVehicle(value) {
    setVehicle({ label: value.capacity });
    onSelect(config.key, { ...formData[config.key], vehicleType: value });
  }

  function setValue(value, input) {
    if (input !== undefined && input !== null) {
      const trips = input === "noOfTrips" ? Number(value) : Number(formData?.tripData?.noOfTrips) || 1;
      const rate = Number(formData?.tripData?.amountPerTrip);
      const totalAmount = !isNaN(trips) && !isNaN(rate) && rate > 0 ? trips * rate : formData?.tripData?.amount;
      onSelect(config.key, {
        ...formData[config.key],
        [input]: value,
        ...(totalAmount !== undefined && totalAmount !== null ? { amount: totalAmount } : {}),
      });
    }
  }

  useEffect(() => {
    (async () => {
      if (formData?.tripData?.vehicleType !== vehicle) {
        setVehicle({ label: formData?.tripData?.vehicleType?.capacity });
      }

      const trips = Number(formData?.tripData?.noOfTrips) || 1;

      if (
        formData?.address?.propertyLocation?.code === "FROM_GRAM_PANCHAYAT" &&
        formData.tripData?.noOfTrips &&
        formData.tripData?.amountPerTrip
      ) {
        const calculatedAmt = Number(formData.tripData.amountPerTrip) * trips;
        if (formData?.[config.key]?.amount !== calculatedAmt) {
          onSelect(config.key, {
            ...formData[config.key],
            amount: calculatedAmt,
          });
        }
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
          if (formData?.[config.key]?.amountPerTrip !== rate || formData?.[config.key]?.amount !== totalAmt) {
            onSelect(config.key, {
              ...formData[config.key],
              amountPerTrip: rate,
              amount: totalAmt,
            });
            Digit.SessionStorage.set("total_amount", totalAmt);
          }
          setError(false);
        } else {
          // If no slab found, preserve manual amount if present
          if (formData?.tripData?.amountPerTrip !== undefined && formData?.tripData?.amountPerTrip !== null && formData?.tripData?.amountPerTrip !== "") {
            setError(false);
          } else {
            setError(false);
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
    formData?.address?.propertyLocation?.code
  ]);

  return isVehicleMenuLoading && isDsoLoading ? (
    <Loader />
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", width: "100%" }}>
      <LabelFieldPair>
        <CardLabel className="card-label-smaller">{t("ES_NEW_APPLICATION_LOCATION_VEHICLE_REQUESTED") + " * "}</CardLabel>
        <Dropdown
          className="form-field"
          style={styles}
          isMandatory
          option={vehicleMenu?.map((vehicle) => ({ ...vehicle, label: vehicle.capacity })).sort((a, b) => a.capacity - b.capacity)}
          optionKey="label"
          id="vehicle"
          selected={vehicle}
          select={selectVehicle}
          t={t}
          disable={editScreen && applicationData?.applicationStatus != "CREATED" ? true : false}
        />
      </LabelFieldPair>
      {inputs?.map((input, index) => (
        <LabelFieldPair key={index}>
          <CardLabel className="card-label-smaller">
            {t(input.label)}
            {input.isMandatory ? " * " : null}
          </CardLabel>
          <div className="field">
            <TextInput
              type={input.type}
              style={{ ...styles, ...FSMTextFieldStyle }}
              onChange={(e) => setValue(e.target.value, input.name)}
              key={input.name}
              value={formData && formData[config.key] ? formData[config.key][input.name] : null}
              {...input.validation}
              disable={input.disable}
            />
          </div>
        </LabelFieldPair>
      ))}
    </div>
  );
};

export default SelectTrips;
