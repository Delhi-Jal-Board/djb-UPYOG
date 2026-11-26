import React from "react";
import { useTranslation } from "react-i18next";
import { Card, KeyNote, SubmitBar } from "@djb25/digit-ui-react-components";
import { Link } from "react-router-dom";
import { getPropertyTypeLocale } from "../../../utils";

const MyApplication = ({ application }) => {
  const { t } = useTranslation();

  const getApplicationStatus = (status) => {
    if (!status) return "N/A";
    const fsmStatusKey = `CS_COMMON_FSM_${status}`;
    const commonStatusKey = `CS_COMMON_${status}`;
    if (t(fsmStatusKey) !== fsmStatusKey) return t(fsmStatusKey);
    if (t(commonStatusKey) !== commonStatusKey) return t(commonStatusKey);
    return status;
  };

  const getFormattedDate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  return (
    <Card>
      <KeyNote keyValue={t("CS_FSM_APPLICATION_APPLICATION_NO")} note={application?.applicationNo || "N/A"} />
      <KeyNote keyValue={t("CS_FSM_APPLICATION_SERVICE_CATEGORY")} note={application?.serviceCategory || t("CS_TITLE_FSM")} />
      {application?.citizen?.name && (
        <KeyNote keyValue={t("CS_APPLICATION_DETAILS_APPLICANT_NAME")} note={application?.citizen?.name} />
      )}
      {application?.propertyUsage && (
        <KeyNote
          keyValue={t("CS_APPLICATION_DETAILS_PROPERTY_TYPE")}
          note={t(getPropertyTypeLocale(application?.propertyUsage)) || application?.propertyUsage}
        />
      )}
      {application?.address?.locality?.name && (
        <KeyNote keyValue={t("CS_APPLICATION_DETAILS_MOHALLA")} note={application?.address?.locality?.name} />
      )}
      {application?.auditDetails?.createdTime && (
        <KeyNote keyValue={t("CS_APPLICATION_DETAILS_APPLICATION_DATE")} note={getFormattedDate(application?.auditDetails?.createdTime)} />
      )}
      <KeyNote keyValue={t("CS_FSM_APPLICATION_DETAIL_STATUS")} note={getApplicationStatus(application?.applicationStatus)} />
      <Link to={{ pathname: `/digit-ui/citizen/fsm/application-details/${application?.applicationNo}`, state: { tenantId: application?.tenantId } }}>
        <SubmitBar label={t("CS_COMMON_VIEW")} />
      </Link>
    </Card>
  );
};

export default MyApplication;
