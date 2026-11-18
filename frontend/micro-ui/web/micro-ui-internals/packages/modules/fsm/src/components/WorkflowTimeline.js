import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardSubHeader } from "@djb25/digit-ui-react-components";

// Icons
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline className="clock-hands2" points="12 6 12 12 16 14"></polyline>
  </svg>
);

const WorkflowTimeline = ({ workflowDetails, hideTimeline, setHideTimeline }) => {
  const { t } = useTranslation();

  const timeline = workflowDetails?.data?.processInstances?.length > 0
    ? workflowDetails?.data?.processInstances
    : workflowDetails?.data?.timeline;

  if (!timeline || timeline.length === 0) {
    return null;
  }

  const getStatusClass = (index, checkpoint) => {
    const state = checkpoint?.state?.state || checkpoint?.status;
    const isTerminal =
      checkpoint?.state?.isTerminateState ||
      state === "COMPLETED" ||
      state === "DISPOSED" ||
      state === "CANCELED" ||
      state === "REJECTED";
    if (index === 0 && !isTerminal) return "current2";
    return "completed2";
  };

  // Epoch → Date + Time
  const convertEpochToDateTime = (epoch) => {
    if (!epoch) return "N/A";

    const date = new Date(epoch);
    if (isNaN(date.getTime())) return typeof epoch === "string" ? epoch : "N/A";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Card className="workflow-timeline-card2 digit-form-composer" style={{ background: "#fff", padding: "16px", height: hideTimeline ? "100%" : "" }}>
      <div className={`timeline-header-wrapper ${hideTimeline ? "collapsed" : ""}`}>
        <CardSubHeader
          style={{
            marginBottom: "0",
            fontSize: "16px",
            fontWeight: "700",
            color: "#374151",
          }}
          className={hideTimeline ? "hidden-content" : ""}
        >
          {t("WORKFLOW_TIMELINE")}
        </CardSubHeader>
      </div>

      <div className={hideTimeline ? "hidden-content" : "timeline-container2"}>
        {timeline.map((checkpoint, index) => {
          const statusClass = getStatusClass(index, checkpoint);
          const showLine = index !== timeline.length - 1 && timeline.length > 1;

          const epochTime =
            checkpoint?.auditDetails?.lastModifiedTime ||
            checkpoint?.auditDetails?.createdTime ||
            checkpoint?.auditDetails?.lastModified ||
            checkpoint?.auditDetails?.created;

          const stateCode = checkpoint?.state?.state || checkpoint?.status;
          const appStatus = checkpoint?.state?.applicationStatus || checkpoint?.state?.state || checkpoint?.status;

          const title =
            t(`CS_COMMON_FSM_${checkpoint?.performedAction === "UPDATE" ? "UPDATE_" : ""}${stateCode}`) ||
            t(`WF_${stateCode}`) ||
            t(`CS_COMMON_${stateCode}`) ||
            stateCode;

          const statusTag =
            t(`CS_COMMON_FSM_${appStatus}`) ||
            t(`CS_COMMON_${appStatus}`) ||
            t(`WF_${appStatus}`) ||
            appStatus;

          let comment = checkpoint?.comment;
          if (comment && comment.includes("~")) {
            const [reason, reasonComment] = comment.split("~");
            comment = `${t(`ES_ACTION_REASON_${reason}`) || reason}${reasonComment ? `: ${reasonComment}` : ""}`;
          }

          const assigneeName = checkpoint?.assigner?.name || checkpoint?.assignes?.[0]?.name;

          return (
            <div key={index} className={`timeline-item2 ${statusClass}`}>
              <div className="timeline-marker2">
                <div className="timeline-circle2">{statusClass === "completed2" ? <CheckIcon /> : <ClockIcon />}</div>
                {showLine && <div className="timeline-line2"></div>}
              </div>

              <div className="timeline-content2">
                <div className="timeline-header2">
                  <div className="timeline-title2">{title}</div>
                  <span className="timeline-date2">{convertEpochToDateTime(epochTime)}</span>
                </div>

                <div className="timeline-body2">
                  <div className={`timeline-status-tag2 status-${statusClass}`}>
                    {statusTag}
                  </div>
                  {comment && <div className="timeline-comment2">{comment}</div>}
                  {checkpoint?.numberOfTrips && (
                    <div className="timeline-comment2" style={{ marginTop: "4px" }}>
                      {t("NUMBER_OF_TRIPS")}: {checkpoint.numberOfTrips}
                    </div>
                  )}
                </div>

                {assigneeName && (
                  <div className="timeline-footer2">
                    <span>
                      {t("ES_COMMON_ASSIGNED_TO")}: <strong>{assigneeName}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WorkflowTimeline;
