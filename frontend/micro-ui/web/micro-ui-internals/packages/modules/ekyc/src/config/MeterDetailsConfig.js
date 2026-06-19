import React from "react";
import { UploadFile, Dropdown } from "@djb25/digit-ui-react-components";

const MeterDetailsConfig = (t, formData = {}, uploadPhoto, meterPhoto, meterPhotoId, setMeterPhoto, setMeterPhotoId) => {
  const meterStatus = formData?.meterStatus?.name || formData?.meterStatus;
  const lastBillReceived = formData?.lastBillReceived?.name || formData?.lastBillReceived;
  const sewerConnection = formData?.sewerConnection?.name || formData?.sewerConnection;

  const isFrozen = meterStatus === "Can not be identified";

  // Generate Month-Year Options (1998–2026)
  const monthYearOptions = [];
  for (let y = 1998; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      monthYearOptions.push({ name: `${m}/${y}` });
    }
  }

  const yesNo = [{ name: "Yes" }, { name: "No" }];

  const fields = [
    {
      label: t("Connection Category"),
      isMandatory: true,
      type: "text",
      populators: {
        name: "connectionCategory",
        validation: { required: true },
      },
    },
    {
      label: t("SA Type"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "saType",
      },
    },
    {
      label: t("Status"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "status",
      },
    },
    {
      label: t("MR Code"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "mrCode",
      },
    },
    {
      label: t("Area Code"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "areaCode",
      },
    },
    {
      label: t("MR Key"),
      isMandatory: false,
      type: "text",
      populators: {
        name: "mrKey",
      },
    },
  ];

  // 🔹 Non-frozen fields
  if (!isFrozen) {
    fields.push(
      {
        label: t("Meter Number"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "meterNumber",
        },
      },
      {
        label: t("Meter Maker"),
        isMandatory: false,
        type: "text",
        populators: {
          name: "meterMaker",
        },
      },
      {
        label: t("Meter Condition"),
        isMandatory: false,
        type: "custom",
        key: "meterCondition",
        populators: {
          name: "meterCondition",
          component: (props) => (
            <Dropdown
              option={[{ name: "Damaged" }, { name: "Not-Damaged" }]}
              optionKey="name"
              selected={props.value}
              select={props.onChange}
            />
          ),
        },
      }
    );

    if (meterStatus === "Metered") {
      fields.push({
        label: t("Meter Photo *"),
        isMandatory: true,
        type: "custom",
        key: "meterPhoto",
        populators: {
          name: "meterPhoto",
          component: (props) => (
            <div>
              <UploadFile
                onUpload={(e) => uploadPhoto(e, props.onChange)}
                onDelete={() => {
                  props.onChange(null);
                  setMeterPhoto(null);
                  setMeterPhotoId(null);
                }}
                message={meterPhotoId ? t("Uploaded") : t("No file selected")}
              />
              {meterPhoto && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={meterPhoto}
                    alt="preview"
                    style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                  />
                </div>
              )}
            </div>
          ),
        },
      });
    }
  }

  // 🔹 Standard fields after the conditional section
  fields.push(
    {
      label: t("Meter Status"),
      isMandatory: true,
      type: "custom",
      key: "meterStatus",
      populators: {
        name: "meterStatus",
        component: (props) => (
          <Dropdown
            option={[{ name: "Metered" }, { name: "Unmetered" }, { name: "Can not be identified" }]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Meter Location"),
      isMandatory: true,
      type: "custom",
      key: "meterLocation",
      populators: {
        name: "meterLocation",
        component: (props) => (
          <Dropdown
            option={[{ name: "Inside" }, { name: "Outside" }]}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Last Bill Received"),
      isMandatory: true,
      type: "custom",
      key: "lastBillReceived",
      populators: {
        name: "lastBillReceived",
        component: (props) => (
          <Dropdown
            option={yesNo}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    }
  );

  // 🔹 Bill-received fields
  if (lastBillReceived === "Yes") {
    fields.push({
      label: t("When was the last bill received *"),
      isMandatory: true,
      type: "custom",
      key: "billMonthYear",
      populators: {
        name: "billMonthYear",
        component: (props) => (
          <Dropdown
            option={monthYearOptions}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    });
  } else if (lastBillReceived === "No") {
    fields.push({
      label: t("Reason *"),
      isMandatory: true,
      type: "text",
      populators: {
        name: "reason",
        validation: { required: true },
      },
    });
  }

  fields.push(
    {
      label: t("Access to Meter"),
      isMandatory: false,
      type: "custom",
      key: "accessToMeter",
      populators: {
        name: "accessToMeter",
        component: (props) => (
          <Dropdown
            option={yesNo}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    },
    {
      label: t("Sewer Connection"),
      isMandatory: true,
      type: "custom",
      key: "sewerConnection",
      populators: {
        name: "sewerConnection",
        component: (props) => (
          <Dropdown
            option={yesNo}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    }
  );

  if (sewerConnection === "No") {
    fields.push({
      label: t("Septic Tank"),
      isMandatory: true,
      type: "custom",
      key: "septicTank",
      populators: {
        name: "septicTank",
        component: (props) => (
          <Dropdown
            option={yesNo}
            optionKey="name"
            selected={props.value}
            select={props.onChange}
          />
        ),
      },
    });
  }

  return [
    {
      head: t("EKYC_METER_DETAILS"),
      body: fields,
    },
  ];
};

export default MeterDetailsConfig;
