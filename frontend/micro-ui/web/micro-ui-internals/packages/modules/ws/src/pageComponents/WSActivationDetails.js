import { CardLabel, DatePicker, Dropdown, LabelFieldPair, TextInput, FieldLabelWithTooltip } from "@djb25/digit-ui-react-components";
import React from "react";
import _ from "lodash";

const METER_MAKES = [
  { name: "Anand Asahi", code: "ANAND_ASAHI", i18nKey: "WS_METER_MAKE_ANAND_ASAHI" },
  { name: "Arad", code: "ARAD", i18nKey: "WS_METER_MAKE_ARAD" },
  { name: "Baylan", code: "BAYLAN", i18nKey: "WS_METER_MAKE_BAYLAN" },
  { name: "Crescent", code: "CRESCENT", i18nKey: "WS_METER_MAKE_CRESCENT" },
  { name: "Dasmesh / DMB", code: "DASMESH", i18nKey: "WS_METER_MAKE_DASMESH" },
  { name: "Fedrel", code: "FEDREL", i18nKey: "WS_METER_MAKE_FEDREL" },
  { name: "Itron", code: "ITRON", i18nKey: "WS_METER_MAKE_ITRON" },
  { name: "Konark", code: "KONARK", i18nKey: "WS_METER_MAKE_KONARK" },
  { name: "Kranti", code: "KRANTI", i18nKey: "WS_METER_MAKE_KRANTI" },
  { name: "Teksan", code: "TEKSAN", i18nKey: "WS_METER_MAKE_TEKSAN" },
  { name: "Other", code: "OTHER", i18nKey: "WS_METER_MAKE_OTHER" },
];

const WSActivationDetails = ({ t, config, userType, formData, onSelect }) => {
  const initialData = Array.isArray(formData?.activationDetails) ? formData?.activationDetails?.[0] : formData?.activationDetails || {};
  const appData =
    formData?.formDetails?.applicationData ||
    formData?.connectionDetails?.[0]?.formDetails?.applicationData ||
    {};

  const findMeterMake = (val) => {
    if (!val) return null;
    if (typeof val === "object" && val?.name) return val;
    return METER_MAKES.find((m) => m.code === val || m.name === val) || { name: val, code: val };
  };

  const findMeterSize = (val) => {
    if (!val) return "";
    if (typeof val === "object") return val?.value || val?.name || val?.code || "";
    return String(val);
  };

  const findFerruleSize = (val) => {
    if (!val) return "";
    if (typeof val === "object") return val?.value || val?.name || val?.code || "";
    return String(val);
  };

  const [activationDetails, setActivationDetails] = React.useState({
    meterMake: findMeterMake(initialData?.meterMake || appData?.additionalDetails?.meterMake),
    meterNo: initialData?.meterNo || initialData?.meterId || appData?.meterId || "",
    meterId: initialData?.meterNo || initialData?.meterId || appData?.meterId || "",
    meterSize: findMeterSize(initialData?.meterSize || appData?.additionalDetails?.meterSize),
    ferruleSize: findFerruleSize(initialData?.ferruleSize || appData?.additionalDetails?.ferruleSize),
    meterInstallationDate: initialData?.meterInstallationDate || appData?.meterInstallationDate || "",
    meterInitialReading:
      initialData?.meterInitialReading !== undefined && initialData?.meterInitialReading !== null && initialData?.meterInitialReading !== "null"
        ? initialData.meterInitialReading
        : appData?.additionalDetails?.initialMeterReading !== undefined &&
          appData?.additionalDetails?.initialMeterReading !== null &&
          appData?.additionalDetails?.initialMeterReading !== "null"
        ? appData.additionalDetails.initialMeterReading
        : "0",
    connectionExecutionDate: initialData?.connectionExecutionDate || appData?.connectionExecutionDate || "",
  });

  React.useEffect(() => {
    const actData = Array.isArray(formData?.activationDetails) ? formData?.activationDetails?.[0] : formData?.activationDetails;
    if (actData) {
      setActivationDetails((prev) => {
        const nextState = {
          meterMake: actData.meterMake !== undefined ? findMeterMake(actData.meterMake) : prev.meterMake,
          meterNo: actData.meterNo !== undefined ? actData.meterNo : (actData.meterId !== undefined ? actData.meterId : prev.meterNo),
          meterId: actData.meterNo !== undefined ? actData.meterNo : (actData.meterId !== undefined ? actData.meterId : prev.meterId),
          meterSize: actData.meterSize !== undefined ? findMeterSize(actData.meterSize) : prev.meterSize,
          ferruleSize: actData.ferruleSize !== undefined ? findFerruleSize(actData.ferruleSize) : prev.ferruleSize,
          meterInstallationDate: actData.meterInstallationDate !== undefined ? actData.meterInstallationDate : prev.meterInstallationDate,
          meterInitialReading:
            actData.meterInitialReading !== undefined &&
            actData.meterInitialReading !== null &&
            actData.meterInitialReading !== "" &&
            actData.meterInitialReading !== "null"
              ? actData.meterInitialReading
              : prev.meterInitialReading || "0",
          connectionExecutionDate: actData.connectionExecutionDate !== undefined ? actData.connectionExecutionDate : prev.connectionExecutionDate,
        };
        if (_.isEqual(prev, nextState)) {
          return prev;
        }
        return nextState;
      });
    }
  }, [formData?.activationDetails]);

  React.useEffect(() => {
    if (onSelect && config?.key) {
      onSelect(config.key, [activationDetails]);
    }
  }, [activationDetails]);

  return (
    <React.Fragment>
      {/* 1. Meter make/brand name Drop down */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_METER_MAKE_LABEL")}
          isMandatory={true}
          infoText={t("WS_METER_MAKE_INFO_MSG")}
        />
        <div className="field">
          <Dropdown
            className="form-field"
            selected={activationDetails.meterMake}
            disable={false}
            option={METER_MAKES}
            placeholder={t("WS_METER_MAKE_PLACEHOLDER")}
            select={(val) => {
              setActivationDetails({ ...activationDetails, meterMake: val });
            }}
            optionKey="name"
            t={t}
          />
        </div>
      </LabelFieldPair>

      {/* 2. Meter No (instead Meter Id) */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_METER_NO_LABEL")}
          isMandatory={true}
          infoText={t("WS_METER_NO_INFO_MSG")}
        />
        <div className="field">
          <TextInput
            t={t}
            type="text"
            name="meterNo"
            value={activationDetails.meterNo}
            placeholder={t("WS_METER_NO_PLACEHOLDER")}
            onChange={(ev) => {
              const val = ev.target.value;
              setActivationDetails({ ...activationDetails, meterNo: val, meterId: val });
            }}
          />
        </div>
      </LabelFieldPair>

      {/* 3. Meter Size Text Field */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_METER_SIZE_LABEL")}
          isMandatory={true}
          infoText={t("WS_METER_SIZE_INFO_MSG")}
        />
        <div className="field">
          <TextInput
            t={t}
            type="text"
            name="meterSize"
            value={typeof activationDetails.meterSize === "object" ? (activationDetails.meterSize?.name || activationDetails.meterSize?.value || "") : (activationDetails.meterSize || "")}
            placeholder={t("WS_METER_SIZE_PLACEHOLDER")}
            onChange={(ev) => {
              const val = ev.target.value;
              setActivationDetails({ ...activationDetails, meterSize: val });
            }}
          />
        </div>
      </LabelFieldPair>

      {/* 4. Ferrule Size Text Field */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_FERRULE_SIZE_LABEL")}
          isMandatory={true}
          infoText={t("WS_FERRULE_SIZE_INFO_MSG")}
        />
        <div className="field">
          <TextInput
            t={t}
            type="text"
            name="ferruleSize"
            value={typeof activationDetails.ferruleSize === "object" ? (activationDetails.ferruleSize?.name || activationDetails.ferruleSize?.value || "") : (activationDetails.ferruleSize || "")}
            placeholder={t("WS_FERRULE_SIZE_PLACEHOLDER")}
            onChange={(ev) => {
              const val = ev.target.value;
              setActivationDetails({ ...activationDetails, ferruleSize: val });
            }}
          />
        </div>
      </LabelFieldPair>

      {/* 5. Meter installation date */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_METER_INSTALLATION_DATE")}
          isMandatory={true}
          infoText={t("WS_METER_INSTALLATION_DATE_INFO_MSG")}
        />
        <div className="field">
          <DatePicker
            date={activationDetails.meterInstallationDate}
            placeholder={t("WS_METER_INSTALLATION_DATE_PLACEHOLDER")}
            onChange={(date) => {
              setActivationDetails({ ...activationDetails, meterInstallationDate: date });
            }}
          />
        </div>
      </LabelFieldPair>

      {/* 6. Initial Meter Reading */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_INIT_METER_READING")}
          isMandatory={true}
          infoText={t("WS_INIT_METER_READING_INFO_MSG")}
        />
        <div className="field">
          <TextInput
            type="text"
            disabled={true}
            disable={true}
            value={
              activationDetails.meterInitialReading !== undefined &&
              activationDetails.meterInitialReading !== null &&
              activationDetails.meterInitialReading !== "null"
                ? activationDetails.meterInitialReading
                : "0"
            }
            placeholder={t("WS_INIT_METER_READING_PLACEHOLDER")}
            onChange={(ev) => {
              setActivationDetails({ ...activationDetails, meterInitialReading: ev.target.value });
            }}
          />
        </div>
      </LabelFieldPair>

      {/* 7. Connection Date */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_CONN_EXEC_DATE")}
          isMandatory={true}
          infoText={t("WS_CONN_EXEC_DATE_INFO_MSG")}
        />
        <div className="field">
          <DatePicker
            date={activationDetails.connectionExecutionDate}
            placeholder={t("WS_CONN_EXEC_DATE_PLACEHOLDER")}
            onChange={(date) => {
              setActivationDetails({ ...activationDetails, connectionExecutionDate: date });
            }}
          />
        </div>
      </LabelFieldPair>
    </React.Fragment>
  );
};

export default WSActivationDetails;
