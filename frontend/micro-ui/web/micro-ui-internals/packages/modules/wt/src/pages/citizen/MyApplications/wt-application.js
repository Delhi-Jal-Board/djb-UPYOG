import { Card, KeyNote, SubmitBar } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { APPLICATION_PATH } from "../../../utils";

const WTApplication = ({ application, tenantId, buttonLabel }) => {
  const { t } = useTranslation();
  const safeTenantId =
    application?.tenantId ||
    tenantId ||
    Digit?.ULBService?.getCitizenCurrentTenant?.(true) ||
    Digit?.ULBService?.getCurrentTenantId?.();

  const bookingNo = application?.bookingNo || "";
  const bookingCode = bookingNo && typeof bookingNo === "string" ? bookingNo.split("-")[0]?.toUpperCase() : "";

  const renderBookingLink = () => {
    if (!bookingNo) return null;

    if (bookingCode === "MT") {
      return (
        <Link to={`${APPLICATION_PATH}/citizen/wt/booking/mobileToilet/${bookingNo}/${safeTenantId}`}>
          <SubmitBar label={buttonLabel} />
        </Link>
      );
    }

    if (bookingCode === "TP") {
      return (
        <Link to={`${APPLICATION_PATH}/citizen/wt/booking/treePruning/${bookingNo}/${safeTenantId}`}>
          <SubmitBar label={buttonLabel} />
        </Link>
      );
    }

    // Default to waterTanker for WT or any other prefix
    return (
      <Link to={`${APPLICATION_PATH}/citizen/wt/booking/waterTanker/${bookingNo}/${safeTenantId}`}>
        <SubmitBar label={buttonLabel} />
      </Link>
    );
  };

  return (
    <Card>
      <KeyNote keyValue={t("BOOKING_NO")} note={application?.bookingNo || "NA"} />
      <KeyNote keyValue={t("APPLICANT_NAME")} note={application?.applicantDetail?.name || "NA"} />
      <KeyNote keyValue={t("MOBILE_NUMBER")} note={application?.applicantDetail?.mobileNumber ? t(`${application.applicantDetail.mobileNumber}`) : "NA"} />
      <KeyNote keyValue={t("LOCALITY")} note={application?.localityCode ? t(`${application.localityCode}`) : "NA"} />
      <KeyNote keyValue={t("PT_COMMON_TABLE_COL_STATUS_LABEL")} note={application?.bookingStatus ? t(`${application.bookingStatus}`) : "NA"} />
      <div>{renderBookingLink()}</div>
    </Card>
  );
};

export default WTApplication;
