import React from "react";
import { convertEpochToDate } from "../utils";
import { DatePicker } from "@djb25/digit-ui-react-components";
// const { DatePicker } = require("@djb25/digit-ui-react-components");

const VendorConfig = (t, module = "", genderMenu, update, addressHeader) => {
  const isEkyc = module?.toLocaleUpperCase() === "EKYC";

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
          disable: false,
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
          label: "ES_FSM_REGISTRY_NEW_VENDOR_PHONE",
          isMandatory: true,
          type: "mobileNumber",
          key: "phone",
          disable: false,
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
          label: "ES_FSM_REGISTRY_NEW_EMAIL",
          isMandatory: true,
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
          label: "ES_VENDOR_REGISTRY_SERVICE_TYPE",
          isMandatory: true,
          type: "component",
          key: "serviceType",
          component: "SelectServiceType",
          disable: update,
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
                // disable: update,
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
                  options: genderMenu,
                  optionsKey: "i18nKey",
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
                    validate: (value) => {
                      if (!value) return true;
                      const dob = new Date(value);
                      const today = new Date();
                      let age = today.getFullYear() - dob.getFullYear();
                      const m = today.getMonth() - dob.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                        age--;
                      }
                      return age >= 18 || t("ES_VENDOR_DOB_MIN_AGE_ERROR") || "Vendor must be 18 years or older";
                    },
                  },
                  component: (props, customProps) => (
                    <DatePicker
                      onChange={props.onChange}
                      date={props.value}
                      {...customProps}
                      isDOB={true}
                      minAge={18}
                      max={convertEpochToDate(new Date().setFullYear(new Date().getFullYear() - 18))}
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
            isVendor: true,
          },
          texts: {
            header: addressHeader,
          },
        },
      ],
    },
  ];
};

export default VendorConfig;
