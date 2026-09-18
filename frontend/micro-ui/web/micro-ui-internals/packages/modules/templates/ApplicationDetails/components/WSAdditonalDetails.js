import React, { Fragment } from "react";
import { StatusTable, Row, CardSubHeader } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { getQueryStringParams } from "../../../ws/src/utils";

const cardSubHeaderStyles = () => {
  return { fontSize: "24px", marginBottom: "16px", marginTop: "32px" };
};

const WSAdditonalDetails = ({ wsAdditionalDetails, oldValue }) => {
  const { t } = useTranslation();

  let filters = getQueryStringParams(location.search);
  const isModify = filters?.mode;

  var { connectionDetails, plumberDetails, roadCuttingDetails, activationDetails } = wsAdditionalDetails?.additionalDetails || {
    connectionDetails: [],
    plumberDetails: [],
  };

  return (
    <React.Fragment>
      <div style={{ lineHeight: "19px", minWidth: "280px" }}>
        {wsAdditionalDetails?.additionalDetails?.connectionDetails && (
          <StatusTable>
            <CardSubHeader style={cardSubHeaderStyles()}>{t("WS_COMMON_CONNECTION_DETAIL")}</CardSubHeader>
            <div>
              <div className="connection-details-new-value-wrapper">
                {connectionDetails?.map((value, index) => {
                  return (
                    <div key={index}>
                      <Row
                        className="border-none"
                        key={`${value.title}`}
                        label={`${t(`${value.title}`)}`}
                        text={value?.oldValue ? value?.oldValue : value?.value ? value?.value : ""}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </StatusTable>
        )}

      </div>
    </React.Fragment>
  );
};

export default WSAdditonalDetails;
