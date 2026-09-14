import React, { useState, useEffect, useMemo } from "react";
import { FormStep, CardLabel, Dropdown, TextInput } from "@djb25/digit-ui-react-components";
import { Link } from "react-router-dom";

const EmergencyFixedPointDispatchDetails = ({ t, config, onSelect, formData }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [fillingPoint, setFillingPoint] = useState(formData?.dispatchDetails?.fillingPoint || "");
  const [vendor, setVendor] = useState(formData?.dispatchDetails?.vendor || "");
  const [vehicle, setVehicle] = useState(formData?.dispatchDetails?.vehicle || "");
  const [driver, setDriver] = useState(formData?.dispatchDetails?.driver || "");

  // Fetch all Filling Points
  const { data: fillingPointsData } = Digit.Hooks.wt.useFillPointSearch(
    {
      tenantId,
      filters: { limit: 1000 },
    },
    { enabled: true }
  );

  const fillingPointOptions = useMemo(() => fillingPointsData?.fillingPoints?.map(fp => ({
    ...fp,
    name: fp?.fillingPointName || "NA",
  })) || [], [fillingPointsData]);

  // Fetch Vendors
  const { data: vendorData } = Digit.Hooks.fsm.useVendorSearch({
    tenantId,
    filters: {
      ...(fillingPoint?.fillingPointId ? { fillingPointId: fillingPoint.id } : {})
    },
    config: { enabled: true }
  });

  const vendorOptions = useMemo(() => vendorData?.vendor?.map(v => ({
    ...v,
    name: v?.name || v?.vendor_id || "NA",
  })) || [], [vendorData]);

  const vehicleOptions = useMemo(() => {
    if (vendor && typeof vendor === "object") {
      return vendor.vehicles?.map(veh => ({
        ...veh,
        name: veh?.registrationNumber || veh?.type || "NA",
      })) || [];
    }
    return [];
  }, [vendor]);

  const filters = useMemo(() => ({ registrationNumber: vehicle?.registrationNumber }), [vehicle?.registrationNumber]);

  const { data: vehicleSearchData } = Digit.Hooks.fsm.useVehiclesSearch({
    tenantId,
    filters,
    config: {
      enabled: !!vehicle?.registrationNumber,
    },
  });

  useEffect(() => {
    const drv = vehicleSearchData?.vehicle?.[0]?.driverData;
    if (drv) {
      const formattedDriver = {
        ...drv,
        name: drv?.name || drv?.licenseNumber || "NA",
      };
      if (driver?.id !== formattedDriver.id) {
        setDriver(formattedDriver);
      }
    } else if (vehicleSearchData && driver !== "") {
      setDriver("");
    }
  }, [vehicleSearchData, driver]);

  const handleVendorSelect = (selected) => {
    setVendor(selected);
    setVehicle("");
    setDriver("");
  };

  const goNext = () => {
    onSelect(config.key, { fillingPoint, vendor, vehicle, driver }, false);
  };

  const lastSentValue = React.useRef(null);
  React.useEffect(() => {
    const dispatchDetails = { fillingPoint, vendor, vehicle, driver };
    let isDifferent = true;
    try {
      isDifferent = JSON.stringify(lastSentValue.current) !== JSON.stringify(dispatchDetails);
    } catch (e) {
      isDifferent = Object.keys(dispatchDetails).some(k => lastSentValue.current?.[k] !== dispatchDetails[k]);
    }
    if (isDifferent) {
      lastSentValue.current = dispatchDetails;
      onSelect(config.key, { ...dispatchDetails, silent: true }, false);
    }
  }, [fillingPoint, vendor, vehicle, driver, onSelect, config.key]);

  return (
    <React.Fragment>
      <FormStep
        config={config}
        onSelect={goNext}
        t={t}
        isDisabled={!fillingPoint || !vendor || !vehicle || !driver}
        // className={"search-form-wrapper"}
      >
        <div className="form-field wns-search-field">
          <CardLabel>{`${t("WT_FILLING_POINT", "Filling Point")}`}</CardLabel>
          <Dropdown
            className="form-field"
            selected={fillingPoint}
            option={fillingPointOptions}
            select={setFillingPoint}
            optionKey="name"
            t={t}
            name="fillingPoint"
            placeholder={t("WT_SELECT_FILLING_POINT", "Select Filling Point")}
          />
        </div>

        <div className="form-field wns-search-field">
          <CardLabel>{`${t("WT_VENDOR", "Vendor")}`}</CardLabel>
          <Dropdown
            className="form-field"
            selected={vendor}
            option={vendorOptions}
            select={handleVendorSelect}
            optionKey="name"
            t={t}
            name="vendor"
            placeholder={t("WT_SELECT_VENDOR", "Select Vendor")}
          />
        </div>

        <div className="form-field wns-search-field">
          <CardLabel>{`${t("WT_VEHICLE", "Vehicle")}`}</CardLabel>
          <Dropdown
            className="form-field"
            selected={vehicle}
            option={vehicleOptions}
            select={setVehicle}
            optionKey="name"
            t={t}
            name="vehicle"
            placeholder={t("WT_SELECT_VEHICLE", "Select Vehicle")}
          />
        </div>

        <div className="form-field wns-search-field">
          <CardLabel>{`${t("WT_DRIVER", "Driver")}`}</CardLabel>
          <TextInput
            className="form-field"
            value={driver?.name || driver || ""}
            disabled={true}
            t={t}
            name="driver"
          />
          {vehicle?.registrationNumber && vehicleSearchData && !vehicleSearchData?.vehicle?.[0]?.driverData && (
            <div style={{ marginTop: "10px", color: "red", fontSize: "14px" }}>
              {t("WT_DRIVER_NOT_MAPPED", "Please map the driver with the selected vehicle to proceed further - ")}
              <Link to="/digit-ui/employee/vendor/search-vendor" style={{ color: "#a82227", textDecoration: "underline", fontWeight: "bold" }}>
                {t("WT_CLICK_HERE", "click here")}
              </Link>
            </div>
          )}
        </div>
      </FormStep>
    </React.Fragment>
  );
};

export default EmergencyFixedPointDispatchDetails;
