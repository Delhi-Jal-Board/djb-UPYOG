import React from "react";
import { UploadFile, CheckBox, Dropdown } from "@djb25/digit-ui-react-components";

const AadhaarVerificationConfig = (t, formData = {}, uploadFile, setDocumentId, documentId) => {
  const consumerType = formData?.consumerType?.name || formData?.consumerType;
  const occupantType = formData?.occupantType?.name || formData?.occupantType;
  const informantIsConsumer = formData?.informantIsConsumer ?? true;

  const fields = [
    {
      label: t("Consumer Type"),
      isMandatory: true,
      type: "custom",
      key: "consumerType",
      populators: {
        name: "consumerType",
        component: (props) => (
          <Dropdown
            option={[{ name: "Individual" }, { name: "Govt" }, { name: "Company_Society_Org" }]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Occupant Type"),
      isMandatory: true,
      type: "custom",
      key: "occupantType",
      populators: {
        name: "occupantType",
        component: (props) => (
          <Dropdown
            option={[{ name: "Self" }, { name: "Tenanted" }]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Category Type"),
      isMandatory: true,
      type: "custom",
      key: "categoryType",
      populators: {
        name: "categoryType",
        component: (props) => (
          <Dropdown
            option={[{ name: "Bulk" }, { name: "Non-Bulk" }]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("First Name"),
      isMandatory: true,
      type: "text",
      populators: {
        name: "firstName",
        validation: { required: true },
      },
    },
    {
      label: t("Middle Name"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "middleName",
      },
    },
    {
      label: t("Last Name"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "lastName",
      },
    },
    {
      label: t("Gender"),
      isMandatory: false,
      type: "custom",
      key: "gender",
      populators: {
        name: "gender",
        component: (props) => (
          <Dropdown
            option={[{ name: "Male" }, { name: "Female" }, { name: "Others" }, { name: "Not prefer to say" }]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Parent/Spouse Name"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "parentSpouseName",
      },
    },
    {
      label: t("Mobile"),
      isMandatory: true,
      type: "text",
      populators: {
        name: "mobile",
        validation: {
          required: true,
          pattern: /^[6-9]\d{9}$/,
        },
        error: t("Invalid mobile number"),
      },
    },
    {
      label: t("WhatsApp"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "whatsapp",
      },
    },
    {
      label: t("Email"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "email",
        validation: {
          pattern: /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/,
        },
        error: t("Invalid email address"),
      },
    },
    {
      label: t("No. of Residents"),
      isMandatory: true,
      type: "text",
      populators: {
        name: "residents",
        validation: {
          required: true,
          min: 1,
        },
      },
    },
    {
      label: t("Type of Identity"),
      isMandatory: true,
      type: "custom",
      key: "identityType",
      populators: {
        name: "identityType",
        component: (props) => (
          <Dropdown
            option={[{ name: "Aadhaar Card" }, { name: "Driving License" }, { name: "Passport" }, { name: "Voter ID" }]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Proof of Identity"),
      isMandatory: false,
      type: "custom",
      key: "idFile",
      populators: {
        name: "idFile",
        component: (props) => (
          <UploadFile
            onUpload={(e) => uploadFile(e, props.onChange)}
            onDelete={() => {
              props.onChange(null);
              setDocumentId(null);
            }}
            message={props.value ? t("Uploaded") : t("No file selected")}
          />
        ),
      },
    },
    {
      label: t("Document Number"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "documentNumber",
      },
    },
    {
      label: t("Informant Is Consumer"),
      isMandatory: false,
      type: "custom",
      key: "informantIsConsumer",
      populators: {
        name: "informantIsConsumer",
        component: (props) => (
          <CheckBox
            label={t("Yes, the informant is the consumer")}
            checked={props.value ?? true}
            onChange={(e) => props.onChange(e.target.checked)}
          />
        ),
      },
    },
  ];

  // Informant conditional fields
  if (!informantIsConsumer) {
    fields.push(
      {
        label: t("Informant Name"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "informantName",
        },
      },
      {
        label: t("Informant Relation"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "informantRelation",
        },
      }
    );
  }

  // Tenant conditional fields
  if (occupantType === "Tenanted") {
    fields.push({
      label: t("Document Proof"),
      isMandatory: false,
      type: "custom",
      key: "documentProof",
      populators: {
        name: "documentProof",
        component: (props) => (
          <UploadFile
            onUpload={(e) => uploadFile(e, props.onChange)}
            onDelete={() => {
              props.onChange(null);
              setDocumentId(null);
            }}
            message={props.value ? t("Uploaded") : t("No file selected")}
          />
        ),
      },
    });

    if (!documentId) {
      fields.push(
        {
          label: t("Owner Mobile"),
          isMandatory: true,
          type: "text",
          populators: {
            name: "ownerMobile",
            validation: {
              required: true,
              pattern: /^[6-9]\d{9}$/,
            },
          },
        },
        {
          label: t("Tenant Verification"),
          isMandatory: false,
          type: "text",
          populators: {
            name: "tenantVerification",
          },
        }
      );
    }
  }

  // Govt conditional fields
  if (consumerType === "Govt") {
    fields.push(
      {
        label: t("Designation"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "designation",
        },
      },
      {
        label: t("Department"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "department",
        },
      },
      {
        label: t("Employee ID"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "employeeId",
        },
      }
    );
  }

  // Company / Society / Org conditional fields
  if (consumerType === "Company_Society_Org") {
    fields.push(
      {
        label: t("Entity Name"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "entityName",
        },
      },
      {
        label: t("Contact Person"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "contactPerson",
        },
      }
    );
  }

  // Consent checkbox field
  fields.push({
    label: t("Consent"),
    isMandatory: true,
    type: "custom",
    key: "consent",
    populators: {
      name: "consent",
      validation: { required: true },
      component: (props) => (
        <CheckBox
          label={t("I hereby consent to verify my Aadhaar details.")}
          checked={props.value ?? false}
          onChange={(e) => props.onChange(e.target.checked)}
        />
      ),
    },
  });

  return [
    {
      head: t("EKYC_CONSUMER_CONNECTION"),
      body: fields,
    },
  ];
};

export default AadhaarVerificationConfig;
