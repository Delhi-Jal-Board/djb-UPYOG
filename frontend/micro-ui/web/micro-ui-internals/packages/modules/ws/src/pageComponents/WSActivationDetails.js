import { CardLabel, DatePicker, LabelFieldPair, TextInput } from "@djb25/digit-ui-react-components";
import React from "react";

const WSActivationDetails = ({ t, config, userType, formData, onSelect }) => {
  const initialData = Array.isArray(formData?.activationDetails) ? formData?.activationDetails?.[0] : formData?.activationDetails || {};

  const [activationDetails, setActivationDetails] = React.useState({
    meterId: initialData?.meterId || "",
    meterInstallationDate: initialData?.meterInstallationDate || "",
    meterInitialReading: "0",
    connectionExecutionDate: initialData?.connectionExecutionDate || "",
  });

  React.useEffect(() => {
    const actData = Array.isArray(formData?.activationDetails) ? formData?.activationDetails?.[0] : formData?.activationDetails;
    if (actData) {
      setActivationDetails((prev) => {
        const nextState = {
          meterId: actData.meterId !== undefined ? actData.meterId : prev.meterId,
          meterInstallationDate: actData.meterInstallationDate !== undefined ? actData.meterInstallationDate : prev.meterInstallationDate,
          meterInitialReading: "0",
          connectionExecutionDate: actData.connectionExecutionDate !== undefined ? actData.connectionExecutionDate : prev.connectionExecutionDate,
        };
        if (
          prev.meterId === nextState.meterId &&
          prev.meterInstallationDate === nextState.meterInstallationDate &&
          prev.meterInitialReading === nextState.meterInitialReading &&
          prev.connectionExecutionDate === nextState.connectionExecutionDate
        ) {
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
      <LabelFieldPair>
        <CardLabel>
          {`${t(`WS_METER_ID`)}`}
          <span className="check-page-link-button"> *</span>
        </CardLabel>
        <div className="field">
          <TextInput
            t={t}
            type="text"
            optionKey="i18nKey"
            name="meterId"
            value={activationDetails.meterId}
            placeholder={`${t(`WS_METER_ID_PLACEHOLDER`)}`}
            onChange={(ev) => {
              setActivationDetails({ ...activationDetails, meterId: ev.target.value });
            }}
          ></TextInput>
        </div>
      </LabelFieldPair>
      <LabelFieldPair>
        <CardLabel>
          {`${t(`WS_METER_INSTALLATION_DATE`)}`}
          <span className="check-page-link-button"> *</span>
        </CardLabel>
        <div className="field">
          <DatePicker
            date={activationDetails.meterInstallationDate}
            placeholder={`${t(`WS_METER_INSTALLATION_DATE_PLACEHOLDER`)}`}
            onChange={(date) => {
              setActivationDetails({ ...activationDetails, meterInstallationDate: date });
            }}
          ></DatePicker>
        </div>
      </LabelFieldPair>
      <LabelFieldPair>
        <CardLabel>
          {`${t(`WS_INIT_METER_READING`)}`}
          <span className="check-page-link-button"> *</span>
        </CardLabel>
        <div className="field">
          <TextInput
            value={activationDetails.meterInitialReading || "0"}
            disabled={true}
            disable={true}
            placeholder={`${t(`WS_INIT_METER_READING_PLACEHOLDER`)}`}
            onChange={(ev) => {
              setActivationDetails({ ...activationDetails, meterInitialReading: "0" });
            }}
          ></TextInput>
        </div>
      </LabelFieldPair>
      <LabelFieldPair>
        <CardLabel>
          {`${t(`WS_CONN_EXEC_DATE`)}`}
          <span className="check-page-link-button"> *</span>
        </CardLabel>
        <div className="field">
          <DatePicker
            date={activationDetails.connectionExecutionDate}
            placeholder={`${t(`WS_CONN_EXEC_DATE_PLACEHOLDER`)}`}
            onChange={(date) => {
              setActivationDetails({ ...activationDetails, connectionExecutionDate: date });
            }}
          ></DatePicker>
        </div>
      </LabelFieldPair>
    </React.Fragment>
  );
};

export default WSActivationDetails;
