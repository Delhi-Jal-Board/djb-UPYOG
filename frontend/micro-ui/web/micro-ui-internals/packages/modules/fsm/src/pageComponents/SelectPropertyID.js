import React, { useState, useEffect } from "react";
import { TextArea, LabelFieldPair, CardLabel, TextInput } from "@djb25/digit-ui-react-components";
import FormStep from "../../../../react-components/src/molecules/FormStep"
import Timeline from "../components/TLTimelineInFSM";
const SelectPropertyID = ({ t, config, onSelect, formData, userType, isInline, setError: setFormError, clearErrors: clearFormErrors }) => {
const [propertyID, setPropertyID] = useState(formData?.propertyID?.propertyID || formData?.additionalDetails?.propertyID || "");
const [disable,setDisable]=useState(false)
const [error, setError] = useState("");
const inputs = [
  {
    type: "text",
    name: "propertyID",
    placeholder:"Enter a valid property ID",
    validation: {
    maxLength: 256,
    
    },
  },
  ];
  const goNext=()=>{
    onSelect(config.key, { ...formData[config.key], ...data })
  }
  useEffect(() => {
    if (formData?.additionalDetails?.propertyID !== undefined) {
      setPropertyID(formData?.additionalDetails?.propertyID);
    }
  }, [formData?.additionalDetails?.propertyID]);
  function onChange(e) {
    setPropertyID(e.target.value);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], propertyID: e.target.value });
    }
  }
  if (userType === "employee") {
    const textInput = (
      <TextInput
        className="form-field"
        id="propertyID"
        value={propertyID}
        placeholder={t("Enter a valid property ID")}
        onChange={onChange}
        t={t}
      />
    );
    if (!isInline && config?.label) {
      return (
        <LabelFieldPair>
          <CardLabel className="card-label-smaller">
            {t(config.label)}
            {config.isMandatory ? <span className="check-page-link-button"> * </span> : null}
          </CardLabel>
          <div className="field">{textInput}</div>
        </LabelFieldPair>
      );
    }
    return textInput;
  }
  const onSkip = () => onSelect();
    return (
      <React.Fragment>
        <Timeline currentStep={1} flow="APPLY" />
        <FormStep
         t={t}
         config={{ ...config, inputs }}
         value={propertyID}
         onSelect={(data) => onSelect(config.key, { ...formData[config.key], ...data })}
         placeholder={inputs.placeholder}
         onChange={onChange}
         onSkip={onSkip}
         forcedError={t(error)}
         isDisabled={false}
       ></FormStep>
      </React.Fragment>
    );
};
export default SelectPropertyID;
