import React from "react";
const { DatePicker } = require("@djb25/digit-ui-react-components");

const SurveyorConfig = (t, agencies = [], reportingManagers = [], disabled = false) => {
  return [
    {
      head: "ES_VENDOR_SURVEYOR_BASIC_DETAILS",
      body: [
        {
          label: "ES_VENDOR_SURVEYOR_FULL_NAME",
          isMandatory: true,
          type: "text",
          populators: {
            name: "fullName",
            validation: {
              required: true,
              pattern: /^[A-Za-z\s]+$/,
            },
            error: t("ES_VENDOR_INVALID_NAME"),
          },
        },
        {
          label: "ES_VENDOR_SURVEYOR_MOBILE_NUMBER",
          isMandatory: true,
          type: "mobileNumber",
          populators: {
            name: "mobileNumber",
            validation: {
              required: true,
              pattern: /^[6-9]\d{9}$/,
            },
            error: t("ES_VENDOR_INVALID_MOBILE"),
          },
        },
        {
          label: "ES_VENDOR_SURVEYOR_EMAIL_ID",
          isMandatory: true,
          type: "text",
          populators: {
            name: "emailId",
            validation: {
              required: true,
              pattern: /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/,
            },
            error: t("ES_VENDOR_INVALID_EMAIL"),
          },
        },
        {
          label: t("ES_VENDOR_SURVEYOR_GENDER"),
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
          label: t("ES_VENDOR_SURVEYOR_DESCRIPTION"),
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

export default SurveyorConfig;
