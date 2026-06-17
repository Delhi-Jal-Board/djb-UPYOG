import React from "react";
const { DatePicker } = require("@djb25/digit-ui-react-components");

const SupervisorConfig = (t, agencies = [], reportingManagers = [], disabled = false) => {
  return [
    {
      head: t("ES_VENDOR_SUPERVISOR_BASIC_DETAILS"),
      body: [
        {
          label: t("ES_VENDOR_SUPERVISOR_FULL_NAME"),
          isMandatory: true,
          type: "text",
          disable: disabled,
          populators: {
            name: "fullName",
            validation: {
              required: true,
              pattern: {
                value: /^[A-Za-z\s]+$/,
                message: t("ES_VENDOR_INVALID_NAME"),
              },
            },
            error: t("ES_VENDOR_INVALID_NAME"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: t("ES_VENDOR_SUPERVISOR_MOBILE_NUMBER"),
          isMandatory: true,
          type: "mobileNumber",
          disable: disabled,
          populators: {
            name: "mobileNumber",
            validation: {
              required: true,
              pattern: /^[6-9]\d{9}$/,
            },
            error: t("ES_VENDOR_INVALID_MOBILE"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: t("ES_VENDOR_SUPERVISOR_EMAIL_ID"),
          isMandatory: true,
          type: "text",
          populators: {
            name: "emailId",
            validation: {
              required: true,
              pattern: /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/,
            },
            error: t("ES_VENDOR_INVALID_EMAIL"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },

        {
          label: t("ES_VENDOR_SUPERVISOR_GENDER"),
          isMandatory: true,
          type: "component",
          key: "gender",
          component: "SelectGender",
        },
        {
          label: t("ES_FSM_REGISTRY_NEW_DOB"),
          isMandatory: true,
          type: "custom",
          key: "dob",
          populators: {
            name: "dob",
            validation: { required: true },
            component: (props, customProps) => <DatePicker onChange={props.onChange} date={props.value} {...customProps} />,
          },
        },
        {
          label: t("ES_FSM_REGISTRY_NEW_CORRESPONDENCE_ADDRESS"),
          isMandatory: true,
          type: "text",
          populators: {
            name: "correspondenceAddress",
            validation: { required: true },
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: "ES_VENDOR_ZONE",
          isMandatory: true,
          type: "component",
          key: "zoneIds",
          props: { isMultiSelect: false },
          component: "SelectEkycZones",
        },
        {
          label: t("ES_VENDOR_SUPERVISOR_DESCRIPTION"),
          isMandatory: false,
          type: "text",
          populators: {
            name: "description",
            className: "payment-form-text-input-correction",
          },
        },
      ],
    },
  ];
};

export default SupervisorConfig;
