import React, { useState, useEffect } from "react";
import { CardLabel, Dropdown, LabelFieldPair, Loader } from "@djb25/digit-ui-react-components";

const SelectServiceType = ({ config, onSelect, t, userType, formData }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [serviceTypes, setserviceTypes] = useState(formData?.serviceType);
  const [formattedServiceTypes, setFormattedServiceTypes] = useState([]);

  const { data: ServiceType, isLoading } = Digit.Hooks.useCustomMDMS(tenantId, "tenant", [{ name: "citymodule" }], {
    select: (data) => data?.tenant?.citymodule,
  });

  // Transform ServiceType data when it changes
  useEffect(() => {
    if (ServiceType) {
      const transformedData = ServiceType.map((services) => ({
        i18nKey: `${services.code}`,
        code: `${services.code}`,
        value: `${services.name}`,
      }));
      setFormattedServiceTypes(transformedData);
      // Ensure "WT" is selected by default if nothing is selected or if it's the target default
      if (!serviceTypes || serviceTypes.code === "WT") {
        const defaultWT = transformedData.find((item) => item.code === "WT");
        if (defaultWT) {
          setserviceTypes(defaultWT);
          if (userType === "employee") {
            onSelect(config.key, defaultWT);
          }
        }
      }
    }
  }, [ServiceType]);

  const selectServiceType = (value) => {
    setserviceTypes(value);
    if (userType === "employee") {
      onSelect(config.key, value);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (userType === "employee") {
    return (
      <LabelFieldPair>
        <CardLabel>{t(config.label)}</CardLabel>
        <Dropdown
          className="payment-form-text-input-correction"
          isMandatory={config.isMandatory}
          selected={serviceTypes}
          option={formattedServiceTypes}
          select={selectServiceType}
          optionKey="i18nKey"
          disable={config.disable}
          t={t}
        />
      </LabelFieldPair>
    );
  }
};

export default SelectServiceType;
