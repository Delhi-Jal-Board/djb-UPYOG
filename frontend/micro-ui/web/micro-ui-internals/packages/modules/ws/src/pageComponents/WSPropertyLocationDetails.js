import React, { useState } from "react";
import { FormStep } from "@djb25/digit-ui-react-components";
import Timeline from "../components/Timeline";

const WSPropertyLocationDetails = (props) => {
  const { t, config, onSelect, userType } = props;
  const [data, setData] = useState({});

  const goNext = () => {
    onSelect(config.key, data);
  };

  const onSkip = () => onSelect();

  const PropertyLocationDetails =
    Digit.ComponentRegistryService.getComponent("PropertyLocationDetails");

  // Guard: if the CommonPT module hasn't registered PropertyLocationDetails yet, render nothing
  if (!PropertyLocationDetails) {
    return null;
  }

  if (userType === "citizen") {
    return (
      <div>
        <Timeline currentStep={2} />
        <FormStep t={t} config={config} onSelect={goNext} onSkip={onSkip} isDisabled={false}>
          <div style={{ marginTop: "-30px", marginBottom: "-30px" }}>
            <PropertyLocationDetails
              {...props}
              onSelect={(key, details) => {
                setData(details);
              }}
            />
          </div>
        </FormStep>
      </div>
    );
  }

  return <PropertyLocationDetails {...props} />;
};

export default WSPropertyLocationDetails;

