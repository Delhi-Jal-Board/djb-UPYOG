import React from "react";
const { Dropdown, DatePicker } = require("@djb25/digit-ui-react-components");

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
        // {
        //   label: t("ES_VENDOR_SUPERVISOR_EMPLOYEE_ID"),
        //   isMandatory: true,
        //   type: "text",
        //   populators: {
        //     name: "employeeId",
        //     validation: {
        //       required: true,
        //     },
        //     defaultValue: "",
        //     className: "payment-form-text-input-correction",
        //   },
        // },
        {
          label: t("ES_VENDOR_SUPERVISOR_GENDER"),
          isMandatory: true,
          type: "component",
          key: "gender",
          component: "SelectGender",
        },
        {
          label: t("ES_FSM_REGISTRY_NEW_FATHER_NAME"),
          isMandatory: true,
          type: "text",
          populators: {
            name: "fatherOrHusbandName",
            validation: { required: true },
            className: "payment-form-text-input-correction",
          },
        },
        {
          label: t("ES_FSM_REGISTRY_NEW_RELATIONSHIP"),
          isMandatory: true,
          type: "component",
          key: "relationship",
          component: "SelectEkycDropdown",
          populators: {
            name: "relationship",
            options: [
              { code: "FATHER", name: "ES_COMMON_RELATION_FATHER" },
              { code: "HUSBAND", name: "ES_COMMON_RELATION_HUSBAND" },
              { code: "OTHER", name: "ES_COMMON_RELATION_OTHER" },
            ],
            optionsKey: "name",
          },
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
          label: t("ES_VENDOR_SUPERVISOR_ASSIGNED_ZONE"),
          isMandatory: true,
          type: "component",
          key: "assignedZone",
          component: "SelectEkycDropdown",
          populators: {
            name: "assignedZone",
            options: [
              { code: "ZONE-01", name: "ZONE-01" },
              { code: "ZONE-02", name: "ZONE-02" },
              { code: "ZONE-03", name: "ZONE-03" },
              { code: "ZONE-04", name: "ZONE-04" },
              { code: "ZONE-05", name: "ZONE-05" },
            ],
            optionsKey: "name",
          },
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
    // {
    //   head: t("ES_VENDOR_SUPERVISOR_ROLE_ACCESS"),
    //   body: [
    //     {
    //       label: t("ES_VENDOR_SUPERVISOR_ROLE"),
    //       isMandatory: true,
    //       type: "custom",
    //       populators: {
    //         name: "role",
    //         component: (props, customProps) => (
    //           <Dropdown
    //             option={[{ code: "SUPERVISOR", name: "Supervisor" }]}
    //             optionKey="name"
    //             select={props.onChange}
    //             selected={props.value}
    //             t={t}
    //             disable={true}
    //           />
    //         ),
    //         defaultValue: { code: "SUPERVISOR", name: "Supervisor" },
    //       },
    //     },
    //     {
    //       label: t("ES_VENDOR_SUPERVISOR_AGENCY_NAME"),
    //       isMandatory: true,
    //       type: "custom",
    //       populators: {
    //         name: "agencyName",
    //         component: (props, customProps) => <Dropdown option={agencies} optionKey="name" select={props.onChange} selected={props.value} t={t} />,
    //       },
    //     },
    //     {
    //       label: t("ES_VENDOR_SUPERVISOR_REPORTING_MANAGER"),
    //       isMandatory: false,
    //       type: "custom",
    //       populators: {
    //         name: "reportingManager",
    //         component: (props, customProps) => (
    //           <Dropdown option={reportingManagers} optionKey="name" select={props.onChange} selected={props.value} t={t} />
    //         ),
    //       },
    //     },
    //   ],
    // },
    // {
    //   head: t("ES_VENDOR_SUPERVISOR_AREA_ASSIGNMENT"),
    //   body: [
    //     {
    //       type: "component",
    //       component: "SupervisorAreaAssignment",
    //       key: "areaAssignment",
    //       withoutLabel: true,
    //     },
    //   ],
    // },
  ];
};

export default SupervisorConfig;
