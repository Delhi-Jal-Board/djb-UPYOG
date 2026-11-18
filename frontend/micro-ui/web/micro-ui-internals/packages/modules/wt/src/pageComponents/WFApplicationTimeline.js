import { CardSectionHeader, CheckPoint, ConnectingCheckPoints, Loader, SubmitBar } from "@djb25/digit-ui-react-components";
import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import WFCaption from "./WFCaption";
import { APPLICATION_PATH } from "../utils";

// This component WFApplicationTimeline displays the timeline of an application process.
const WFApplicationTimeline = (props) => {
  const { t } = useTranslation();
  const bookingNo = props?.application?.bookingNo || props?.id || "";
  const bookingCode = bookingNo && typeof bookingNo === "string" ? bookingNo.split("-")[0]?.toUpperCase() : "";

  const businessService =
    bookingCode === "WT"
      ? "watertanker"
      : bookingCode === "MT"
      ? "mobileToilet"
      : bookingCode === "TP"
      ? "treePruning"
      : "watertanker";

  const moduleName =
    bookingCode === "WT"
      ? "request-service.water_tanker"
      : bookingCode === "MT"
      ? "request-service.mobile_toilet"
      : bookingCode === "TP"
      ? "request-service.tree_pruning"
      : "request-service.water_tanker";

  const tenantId =
    props?.application?.tenantId ||
    props?.tenantId ||
    Digit?.ULBService?.getCitizenCurrentTenant?.(true) ||
    Digit?.ULBService?.getCurrentTenantId?.();

  const { isLoading, data } = Digit.Hooks.useWorkflowDetails({
    tenantId,
    id: bookingNo,
    moduleCode: businessService,
    config: {
      enabled: !!bookingNo && !!tenantId,
    },
  });

  if (!bookingNo) {
    return null;
  }

  function OpenImage(thumbnailsToShow) {
    if (thumbnailsToShow?.fullImage?.[0]) {
      window.open(thumbnailsToShow.fullImage[0], "_blank");
    }
  }

  const getTimelineCaptions = (checkpoint) => {
    if (!checkpoint) return null;

    if (checkpoint.state === "OPEN") {
      const caption = {
        date: checkpoint?.auditDetails?.lastModified,
        source: props?.application?.channel || "",
      };
      return <WFCaption data={caption} />;
    } else if (checkpoint.state) {
      const caption = {
        date: checkpoint?.auditDetails?.lastModified,
        name: checkpoint?.assignes?.[0]?.name,
        mobileNumber: checkpoint?.assignes?.[0]?.mobileNumber,
        comment: checkpoint?.comment ? t(checkpoint.comment) : "",
        wfComment: checkpoint?.wfComment,
        thumbnailsToShow: checkpoint?.thumbnailsToShow,
      };
      return <WFCaption data={caption} OpenImage={OpenImage} />;
    } else {
      const lastModified = props?.application?.auditDetails?.lastModified;
      const caption = {
        date: lastModified ? Digit.DateUtils.ConvertTimestampToDate(lastModified) : "",
        name: checkpoint?.assigner?.name || "",
        comment: checkpoint?.comment ? t(checkpoint.comment) : "",
      };
      return <WFCaption data={caption} />;
    }
  };

  const showNextActions = (nextActions) => {
    const nextAction = Array.isArray(nextActions) && nextActions.length > 0 ? nextActions[0] : null;
    switch (nextAction?.action) {
      case "PAY":
        return props?.userType === "citizen" ? (
          <div style={{ marginTop: "1em", bottom: "0px", width: "100%", marginBottom: "1.2em" }}>
            <Link
              to={{
                pathname: `${APPLICATION_PATH}/citizen/payment/my-bills/${moduleName}/${bookingNo}`,
                state: { tenantId, bookingNo },
              }}
            >
              <SubmitBar label={t("CS_APPLICATION_DETAILS_MAKE_PAYMENT")} />
            </Link>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {!isLoading && (
        <Fragment>
          {data?.timeline?.length > 0 && (
            <CardSectionHeader style={{ marginBottom: "16px", marginTop: "32px" }}>
              {t("CS_APPLICATION_DETAILS_APPLICATION_TIMELINE")}
            </CardSectionHeader>
          )}
          {data?.timeline && data?.timeline?.length === 1 ? (
            <CheckPoint
              isCompleted={true}
              label={t((data?.timeline[0]?.state && `${data.timeline[0].state}`) || "NA")}
              customChild={getTimelineCaptions(data?.timeline[0])}
            />
          ) : (
            <ConnectingCheckPoints>
              {data?.timeline &&
                data?.timeline.map((checkpoint, index) => {
                  const stateLabel =
                    data?.processInstances?.[index]?.state?.state ||
                    checkpoint?.state ||
                    "NA";

                  return (
                    <React.Fragment key={index}>
                      <CheckPoint
                        keyValue={index}
                        isCompleted={index === 0}
                        label={t(`${stateLabel}`)}
                        customChild={getTimelineCaptions(checkpoint)}
                      />
                    </React.Fragment>
                  );
                })}
            </ConnectingCheckPoints>
          )}
        </Fragment>
      )}
      {data && showNextActions(data?.nextActions)}
    </React.Fragment>
  );
};

export default WFApplicationTimeline;
