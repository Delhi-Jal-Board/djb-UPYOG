import React, { useEffect, useState } from "react";
import { LabelFieldPair, CardLabel, TextInput, CardLabelError, Dropdown } from "@djb25/digit-ui-react-components";
import { useLocation } from "react-router-dom";
import { RadioButtons } from "@djb25/digit-ui-react-components";

const SelectPaymentType = ({ t, config, onSelect, formData = {}, userType, register, errors }) => {
  const stateId = Digit.ULBService.getStateId();
  const { data: paymentData, isLoading } = Digit.Hooks.fsm.useMDMS(stateId, "FSM", "PaymentType");
  const { pathname: url } = useLocation();
  const editScreen = url.includes("/modify-application/");
  const [paymentType, setPaymentType] = useState(null);

  const defaultPaymentOptions = [
    { code: "POST_PAY", name: "Pay Later", i18nKey: "CS_PAYMENT_POST_PAY" },
    { code: "PRE_PAY", name: "Pay Now", i18nKey: "CS_PAYMENT_PRE_PAY" },
  ];

  const paymentOptions = paymentData && paymentData.length > 0 ? paymentData : defaultPaymentOptions;

  const inputs = [
    {
      label: "ES_FSM_PAYMENT_PREFERENCE_LABEL",
      type: "RadioButton",
      name: "paymentPreference",
      options: paymentOptions,
      isMandatory: false,
    },
  ];

  useEffect(() => {
    const opts = paymentData && paymentData.length > 0 ? paymentData : defaultPaymentOptions;
    const currentCode = formData?.paymentPreference?.code || formData?.paymentPreference;
    const preFilledPaymentType = opts.find((pt) => pt.code === currentCode);
    const defaultOption = preFilledPaymentType || opts.find((i) => i.code === "POST_PAY") || opts[0];
    setPaymentType(defaultOption);
    if (!currentCode && defaultOption) {
      onSelect(config.key, defaultOption.code);
    }
  }, [formData?.paymentPreference, paymentData]);

  function selectPaymentType(value) {
    setPaymentType(value);
    onSelect(config.key, value.code);
  }

  return (
    <div>
      {inputs?.map((input, index) => (
        <React.Fragment key={index}>
          {formData?.tripData?.amountPerTrip !== 0 && input.type === "RadioButton" && (
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">
                {t(input.label) || "Payment Preference"}
                {input.isMandatory ? " * " : null}
              </CardLabel>
              <div className="field">
                <RadioButtons
                  selectedOption={paymentType}
                  onSelect={selectPaymentType}
                  style={{ display: "flex", marginBottom: 0 }}
                  innerStyles={{ marginLeft: "10px" }}
                  options={input.options}
                  optionsKey="i18nKey"
                  disabled={editScreen}
                />
              </div>
            </LabelFieldPair>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default SelectPaymentType;
