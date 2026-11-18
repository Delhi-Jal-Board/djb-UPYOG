import React, { useState, useEffect, useRef } from "react";
import { CardLabel, Dropdown, LabelFieldPair, Loader } from "@djb25/digit-ui-react-components";

const defaultServiceOptions = [
  { i18nKey: "FSM", code: "FSM", value: "FSM" },
  { i18nKey: "WT", code: "WT", value: "WT" },
  { i18nKey: "EKYC", code: "EKYC", value: "EKYC" },
];

const SelectServiceType = ({ config, onSelect, t, userType, formData }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();
  const [serviceTypes, setserviceTypes] = useState(formData?.serviceType);
  const [formattedServiceTypes, setFormattedServiceTypes] = useState([]);
  const initialized = useRef(false);

  const { data: ServiceType, isLoading } = Digit.Hooks.useCustomMDMS(tenantId || stateId, "tenant", [{ name: "citymodule" }], {
    select: (data) => data?.tenant?.citymodule,
  });

  // Keep state in sync if external formData changes
  useEffect(() => {
    if (formData?.serviceType && formData.serviceType.code !== serviceTypes?.code) {
      setserviceTypes(formData.serviceType);
    }
  }, [formData?.serviceType]);

  // Transform ServiceType data when it changes
  useEffect(() => {
    const isFsm = window.location.pathname.includes("/fsm/");
    const targetCode = isFsm ? "FSM" : "WT";

    if (ServiceType && Array.isArray(ServiceType) && ServiceType.length > 0) {
      const transformedData = ServiceType.map((services) => ({
        i18nKey: `${services.code}`,
        code: `${services.code}`,
        value: `${services.name}`,
      }));
      setFormattedServiceTypes(transformedData);

      if (!initialized.current) {
        initialized.current = true;
        const currentCode = formData?.serviceType?.code;
        const defaultMatch =
          transformedData.find((item) => item.code === (currentCode || targetCode)) ||
          transformedData.find((item) => item.code === targetCode) ||
          transformedData[0];
        if (defaultMatch) {
          setserviceTypes(defaultMatch);
          onSelect(config.key, defaultMatch);
        }
      }
    } else if (!initialized.current && !isLoading) {
      initialized.current = true;
      const currentCode = formData?.serviceType?.code;
      const defaultMatch =
        defaultServiceOptions.find((item) => item.code === (currentCode || targetCode)) ||
        defaultServiceOptions.find((item) => item.code === targetCode) ||
        defaultServiceOptions[0];
      setserviceTypes(defaultMatch);
      onSelect(config.key, defaultMatch);
    }
  }, [ServiceType, isLoading]);

  const selectServiceType = (value) => {
    setserviceTypes(value);
    onSelect(config.key, value);
  };

  if (isLoading) {
    return <Loader />;
  }

  const options = formattedServiceTypes && formattedServiceTypes.length > 0 ? formattedServiceTypes : defaultServiceOptions;

  return (
    <Dropdown
      className="payment-form-text-input-correction"
      isMandatory={config.isMandatory}
      selected={serviceTypes}
      option={options}
      select={selectServiceType}
      optionKey="i18nKey"
      disable={config.disable}
      t={t}
    />
  );
};

export default SelectServiceType;
