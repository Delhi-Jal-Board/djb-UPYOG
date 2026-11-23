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

const METER_SIZES = [
  { name: '15 mm (1/2")', code: "15_MM", value: "15 mm" },
  { name: '20 mm (3/4")', code: "20_MM", value: "20 mm" },
  { name: '25 mm (1")', code: "25_MM", value: "25 mm" },
  { name: '40 mm (1.5")', code: "40_MM", value: "40 mm" },
  { name: '50 mm (2")', code: "50_MM", value: "50 mm" },
  { name: '80 mm (3")', code: "80_MM", value: "80 mm" },
  { name: '100 mm (4")', code: "100_MM", value: "100 mm" },
  { name: '150 mm (6")', code: "150_MM", value: "150 mm" },
];

const FERRULE_SIZES = [
  { name: "10 mm", code: "10_MM", value: "10 mm" },
  { name: "12 mm", code: "12_MM", value: "12 mm" },
  { name: "15 mm", code: "15_MM", value: "15 mm" },
  { name: "20 mm", code: "20_MM", value: "20 mm" },
  { name: "25 mm", code: "25_MM", value: "25 mm" },
  { name: "32 mm", code: "32_MM", value: "32 mm" },
  { name: "40 mm", code: "40_MM", value: "40 mm" },
  { name: "50 mm", code: "50_MM", value: "50 mm" },
];

const WSActivationDetails = ({ t, config, userType, formData, onSelect }) => {
  const getTrans = (key, defaultVal) => {
    const val = t(key);
    return val && val !== key ? val : defaultVal;
  };

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
    meterInitialReading: initialData?.meterInitialReading || appData?.additionalDetails?.initialMeterReading || "0",
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
          meterInitialReading: actData.meterInitialReading !== undefined && actData.meterInitialReading !== "" ? actData.meterInitialReading : prev.meterInitialReading,
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
          label={getTrans("WS_METER_MAKE_LABEL", "Meter make/brand name")}
          isMandatory={true}
          infoText={t("WS_METER_MAKE_INFO_MSG", "Select approved meter manufacturer or brand name")}
        />
        <div className="field">
          <Dropdown
            className="form-field"
            selected={activationDetails.meterMake}
            disable={false}
            option={METER_MAKES}
            placeholder={getTrans("WS_METER_MAKE_PLACEHOLDER", "Select approved meter name")}
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
          label={getTrans("WS_METER_NO_LABEL", "Meter No")}
          isMandatory={true}
          infoText={t("WS_METER_NO_INFO_MSG", "Enter Serial Number or Meter No engraved on the meter")}
        />
        <div className="field">
          <TextInput
            t={t}
            type="text"
            name="meterNo"
            value={activationDetails.meterNo}
            placeholder={getTrans("WS_METER_NO_PLACEHOLDER", "Enter Meter No")}
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
          label={getTrans("WS_METER_SIZE_LABEL", "Meter Size")}
          isMandatory={true}
          infoText={t("WS_METER_SIZE_INFO_MSG", "Enter diameter / size of the water meter")}
        />
        <div className="field">
          <TextInput
            t={t}
            type="text"
            name="meterSize"
            value={typeof activationDetails.meterSize === "object" ? (activationDetails.meterSize?.name || activationDetails.meterSize?.value || "") : (activationDetails.meterSize || "")}
            placeholder={getTrans("WS_METER_SIZE_PLACEHOLDER", "Enter Meter Size")}
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
          label={getTrans("WS_FERRULE_SIZE_LABEL", "Ferrule Size")}
          isMandatory={true}
          infoText={t("WS_FERRULE_SIZE_INFO_MSG", "Enter size of ferrule connection")}
        />
        <div className="field">
          <TextInput
            t={t}
            type="text"
            name="ferruleSize"
            value={typeof activationDetails.ferruleSize === "object" ? (activationDetails.ferruleSize?.name || activationDetails.ferruleSize?.value || "") : (activationDetails.ferruleSize || "")}
            placeholder={getTrans("WS_FERRULE_SIZE_PLACEHOLDER", "Enter Ferrule Size")}
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
          label={getTrans("WS_METER_INSTALLATION_DATE", "Meter Installation Date")}
          isMandatory={true}
          infoText={t("WS_METER_INSTALLATION_DATE_INFO_MSG", "Select date when the meter was physically installed")}
        />
        <div className="field">
          <DatePicker
            date={activationDetails.meterInstallationDate}
            placeholder={getTrans("WS_METER_INSTALLATION_DATE_PLACEHOLDER", "DD/MM/YYYY")}
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
          label={getTrans("WS_INIT_METER_READING", "Initial Meter Reading")}
          isMandatory={true}
          infoText={t("WS_INIT_METER_READING_INFO_MSG", "Enter the initial reading shown on the meter dial")}
        />
        <div className="field">
          <TextInput
            type="text"
            value={activationDetails.meterInitialReading !== undefined ? activationDetails.meterInitialReading : "0"}
            placeholder={getTrans("WS_INIT_METER_READING_PLACEHOLDER", "0")}
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
          label={getTrans("WS_CONN_EXEC_DATE", "Connection Date")}
          isMandatory={true}
          infoText={t("WS_CONN_EXEC_DATE_INFO_MSG", "Select the date when connection was activated/executed")}
        />
        <div className="field">
          <DatePicker
            date={activationDetails.connectionExecutionDate}
            placeholder={getTrans("WS_CONN_EXEC_DATE_PLACEHOLDER", "DD/MM/YYYY")}
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
