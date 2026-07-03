import React, { useEffect, useState, useCallback } from "react";
import { FormStep, CardLabel, Dropdown , Modal, CloseSvg, LabelFieldPair} from "@djb25/digit-ui-react-components";

/* This file is made for choosing the particular request type.  
    It provides a dropdown menu that allows users to select a service type, such as  
    "Water Tanker (WT)" or "Mobile Toilet". */
    
  
  const Heading = (props) => {
    return <h1 className="heading-m">{props.t("SERVICE_TYPE")}</h1>;
};

const ServiceTypes = ({ t, config, onSelect, userType, formData }) => {
const tenantId=Digit.ULBService.getStateId();
//Fetching service type data from MDMS
    const { data: serviceTypeData} = Digit.Hooks.useCustomMDMS(tenantId, "request-service", [{ name: "ServiceType" }], {
    select: (data) => {
      const formattedData = data?.["request-service"]?.["ServiceType"];
      return formattedData;
    },
  });
  
  const [serviceType, setServiceType] = useState(formData?.serviceType?.serviceType || "");


  // Function to proceed to the next step, updating selected service type in form data.
  const goNext = useCallback(() => {
    let serviceTypes = formData.serviceType;
    let ServiceType = { ...serviceTypes, serviceType };
   
    onSelect(config.key, ServiceType, false);
  }, [formData.serviceType, serviceType, onSelect, config.key]);

 
  useEffect(() => {
    if (userType === "citizen") {
      goNext();
    }
  }, [serviceType, userType, goNext]);

  return (
    <Modal
      headerBarMain={<Heading t={t}/>}
      headerBarEnd={<CloseSvg className="icon-bg-secondary" fill="#fff" onClick={() => window.history.back()} />}
      hideSubmit={true}
      formId="modal-action"
    >
    <React.Fragment>
      <FormStep
        config={config}
        onSelect={goNext}
        t={t}
        isDisabled={!serviceType}
        className="grid-1 ws-search-form"
      >
        <LabelFieldPair>
          <CardLabel>{`${t("REQUEST_TYPE")}`} <span className="astericColor">*</span></CardLabel>
          <Dropdown
            className="form-field"
            selected={serviceType}
            placeholder={"Select Service Type"}
            select={setServiceType}
            option={serviceTypeData}
            optionKey="i18nKey"
            t={t}
          />
        </LabelFieldPair>
      </FormStep>
    </React.Fragment>
    </Modal>
  );
};

export default ServiceTypes;