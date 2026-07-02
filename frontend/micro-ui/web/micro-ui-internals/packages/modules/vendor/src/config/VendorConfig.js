import React from "react";
import { convertEpochToDate } from "../utils";
import { DatePicker } from "@djb25/digit-ui-react-components";
// const { DatePicker } = require("@djb25/digit-ui-react-components");

const VendorConfig = (t, disabled = false, formData = {}) => {
  const isEkyc = formData?.serviceType?.code === "EKYC";

  return [
    {
      head: "ES_VRNDOR_NEW_VENDOR_DETAILS",
      isCollapsible: true,
      isDefaultOpen: true,
      body: [
        {
          label: "ES_FSM_REGISTRY_NEW_VENDOR_NAME",
          isMandatory: true,
          type: "text",
          disable: disabled,
          populators: {
            name: "vendorName",
            validation: {
              required: true,
              pattern: /^[A-Za-z\s.,/]+$/,
            },
            error: t("FSM_REGISTRY_INVALID_NAME"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: "ES_FSM_REGISTRY_NEW_EMAIL",
          isMandatory: false,
          type: "text",
          key: "emailId",
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
          label: "ES_FSM_REGISTRY_NEW_VENDOR_PHONE",
          isMandatory: true,
          type: "mobileNumber",
          key: "phone",
          disable: disabled,
          populators: {
            name: "phone",
            validation: {
              required: true,
              pattern: /^[6-9]\d{9}$/,
            },
            labelStyle: { border: "1px solid black", borderRight: "none" },
            error: t("FSM_REGISTRY_INVALID_PHONE"),
            defaultValue: "",
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: "ES_VENDOR_REGISTRY_SERVICE_TYPE",
          isMandatory: true,
          type: "component",
          key: "serviceType",
          component: "SelectServiceType",
          disable: disabled,
          populators: {
            name: "serviceType",
            defaultValue: {
              code: "WT",
              name: "WT",
              i18nKey: "WT",
            },
          },
          texts: {
            header: "CS_COMMON_CHOOSE_SERVICE_TYPE",
            submitBarLabel: "CS_COMMON_NEXT",
          },
        },
        ...(isEkyc
          ? [
              {
                label: "ES_VENDOR_CONTRACT_START_DATE",
                isMandatory: true,
                type: "custom",
                key: "contractStartDate",
                populators: {
                  name: "contractStartDate",
                  validation: {
                    required: true,
                  },
                  component: (props, customProps) => <DatePicker onChange={props.onChange} date={props.value} {...customProps} />,
                },
              },
              {
                label: "ES_VENDOR_CONTRACT_END_DATE",
                isMandatory: true,
                type: "custom",
                key: "contractEndDate",
                populators: {
                  name: "contractEndDate",
                  validation: {
                    required: true,
                  },
                  component: (props, customProps) => <DatePicker onChange={props.onChange} date={props.value} {...customProps} />,
                },
              },
              {
                label: "ES_VENDOR_ZONE",
                isMandatory: true,
                type: "component",
                key: "zoneIds",
                component: "SelectEkycZones",
              },
              // {
              //   label: "ES_VENDOR_CLUSTER",
              //   isMandatory: true,
              //   type: "component",
              //   key: "clusterIds",
              //   component: "SelectEkycClusters",
              // },
              {
                label: "ES_FSM_REGISTRY_NEW_OWNER_NAME",
                isMandatory: true,
                type: "text",
                populators: {
                  name: "ownerName",
                  validation: {
                    required: true,
                    pattern: /^[A-Za-z\s.,/]+$/,
                  },
                  error: t("FSM_REGISTRY_INVALID_NAME"),
                  className: "payment-form-text-input-correction",
                },
              },
              {
                label: "ES_FSM_REGISTRY_NEW_GENDER",
                isMandatory: true,
                type: "component",
                key: "gender",
                component: "SelectEkycDropdown",
                populators: {
                  name: "gender",
                  options: [
                    { code: "MALE", name: "ES_COMMON_GENDER_MALE" },
                    { code: "FEMALE", name: "ES_COMMON_GENDER_FEMALE" },
                    { code: "OTHER", name: "ES_COMMON_GENDER_OTHER" },
                  ],
                  optionsKey: "name",
                },
              },
              {
                label: "ES_FSM_REGISTRY_NEW_DOB",
                isMandatory: true,
                type: "custom",
                key: "dob",
                populators: {
                  name: "dob",
                  validation: {
                    required: true,
                  },
                  component: (props, customProps) => (
                    <DatePicker
                      onChange={props.onChange}
                      date={props.value}
                      {...customProps}
                      max={convertEpochToDate(new Date().setFullYear(new Date().getFullYear()))}
                    />
                  ),
                },
              },
            ]
          : []),
      ],
    },
    {
      isCreateConnection: true,
      className: "new-application-card",
      body: [
        {
          type: "component",
          key: "propertyAddress",
          component: "PropertyLocationDetails",
          withoutLabel: true,
          props: {
            hidePropertySearch: true,
            hideZRO: true,
          },
          texts: {
            header: "PT_LOCATION_DETAILS",
          },
        },
      ],
    },
  ];
};

export default VendorConfig;
