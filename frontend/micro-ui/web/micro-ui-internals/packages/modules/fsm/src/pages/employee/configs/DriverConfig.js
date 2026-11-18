import React from "react";
import { DatePicker } from "@djb25/digit-ui-react-components";
import SelectGender from "../../../pageComponents/SelectGender";
import { convertEpochToDate } from "../../../utils";

const DriverConfig = (t, disabled = false) => {
  return [
    {
      head: "ES_FSM_REGISTRY_DRIVER_DETAILS",
      body: [
        {
          label: "ES_FSM_REGISTRY_DRIVER_NAME",
          isMandatory: true,
          type: "text",
          disable: disabled,
          populators: {
            name: "driverName",
            validation: {
              required: true,
              pattern: /^[A-Za-z]/,
            },
            error: t("FSM_REGISTRY_INVALID_NAME"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: "ES_FSM_REGISTRY_DRIVER_LICENSE",
          isMandatory: true,
          type: "text",
          key: "license",
          populators: {
            name: "license",
            validation: {
              required: true,
              pattern: /^[a-zA-Z-]{0,}[- ]{0,1}[ 0-9]{1,}/,
            },
            error: t("FSM_REGISTRY_INVALID_DRIVER_LICENSE"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
      ],
    },
    {
      head: "ES_FSM_REGISTRY_PERSONAL_DETAILS",
      body: [
        {
          label: "ES_FSM_REGISTRY_DRIVER_MOBILE",
          isMandatory: true,
          type: "mobileNumber",
          key: "mobileNumber",
          disable: disabled,
          populators: {
            name: "mobileNumber",
            validation: {
              required: true,
              pattern: /^[6-9]\d{9}$/,
            },
            labelStyle: { border: "1px solid black", borderRight: "none" },
            error: t("ES_FSM_REGISTRY_INVALID_MOBILE_NO"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: "ES_FSM_REGISTRY_NEW_GENDER",
          isMandatory: true,
          type: "component",
          route: "select-gender",
          hideInEmployee: false,
          key: "selectGender",
          component: SelectGender,
          withoutLabel: true,
          colSpan: "span 1",
          texts: {
            headerCaption: "",
            header: "CS_COMMON_CHOOSE_GENDER",
            cardText: "CS_COMMON_SELECT_GENDER",
            submitBarLabel: "CS_COMMON_NEXT",
            skipText: "CORE_COMMON_SKIP_CONTINUE",
          },
        },
        {
          label: "ES_FSM_REGISTRY_NEW_DOB",
          isMandatory: false,
          type: "custom",
          key: "dob",
          populators: {
            name: "dob",
            validation: {
              required: false,
            },
            component: (props, customProps) => {
              const Picker = DatePicker || window?.Digit?.ComponentRegistryService?.getComponent("DatePicker");
              if (!Picker) {
                return (
                  <input
                    type="date"
                    className="payment-form-text-input-correction employee-card-input"
                    value={props.value || ""}
                    onChange={(e) => props.onChange(e.target.value)}
                  />
                );
              }
              return (
                <Picker
                  onChange={props.onChange}
                  date={props.value}
                  isDOB={true}
                  {...customProps}
                  max={convertEpochToDate(new Date().setFullYear(new Date().getFullYear()))}
                />
              );
            },
          },
        },
        {
          label: "ES_FSM_REGISTRY_NEW_EMAIL",
          isMandatory: false,
          type: "text",
          key: "emailId",
          colSpan: "span 2",
          populators: {
            name: "emailId",
            validation: {
              required: false,
              pattern: /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/,
            },
            error: t("FSM_REGISTRY_INVALID_EMAIL"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: "ES_FSM_REGISTRY_NEW_VENDOR_ADDITIONAL_DETAILS",
          isMandatory: false,
          type: "textarea",
          key: "additionalDetails",
          colSpan: "span 2",
          populators: {
            name: "additionalDetails",
            className: "payment-form-text-input-correction",
          },
        },
      ],
    },
  ];
};

export default DriverConfig;
