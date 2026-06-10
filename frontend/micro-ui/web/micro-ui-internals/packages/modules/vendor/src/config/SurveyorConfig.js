import React from "react";
const { Dropdown, DatePicker } = require("@djb25/digit-ui-react-components");

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
        // {
        //   label: "ES_VENDOR_SURVEYOR_STAFF_CODE",
        //   isMandatory: true,
        //   type: "text",
        //   populators: {
        //     name: "employeeId",
        //     validation: {
        //       required: true,
        //     },
        //   },
        // },
        {
          label: t("ES_VENDOR_SURVEYOR_GENDER"),
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
    // {
    //   head: "ES_VENDOR_SURVEYOR_ROLE_ACCESS",
    //   body: [
    //     {
    //       label: "ES_VENDOR_SURVEYOR_ROLE",
    //       isMandatory: true,
    //       type: "custom",
    //       populators: {
    //         name: "role",
    //         component: (props, customProps) => (
    //           <Dropdown
    //             option={[{ code: "SURVEYOR", name: "Surveyor" }]}
    //             optionKey="name"
    //             select={props.onChange}
    //             selected={props.value}
    //             t={t}
    //             disable={true}
    //           />
    //         ),
    //         defaultValue: { code: "SURVEYOR", name: "Surveyor" },
    //       },
    //     },
    //     {
    //       label: "ES_VENDOR_SURVEYOR_AGENCY_NAME",
    //       isMandatory: true,
    //       type: "custom",
    //       populators: {
    //         name: "agencyName",
    //         component: (props, customProps) => <Dropdown option={agencies} optionKey="name" select={props.onChange} selected={props.value} t={t} />,
    //       },
    //     },
    //     {
    //       label: "ES_VENDOR_SURVEYOR_REPORTING_MANAGER",
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
    //   head: "ES_VENDOR_SURVEYOR_AREA_ASSIGNMENT",
    //   body: [
    //     {
    //       isMandatory: true,
    //       type: "component",
    //       key: "areaAssignment",
    //       component: "SupervisorAreaAssignment", // Reusing the same component as hierarchy is likely same
    //       withoutLabel: true,
    //     },
    //   ],
    // },
  ];
};

export default SurveyorConfig;
