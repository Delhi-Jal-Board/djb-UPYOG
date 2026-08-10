import { Loader, LinkButton } from "@djb25/digit-ui-react-components";
import React, { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import WSWFCaption from "./WSWFCaption";

const safeDate = (ts) => {
  if (!ts || isNaN(Number(ts)) || Number(ts) <= 0) return null;
  try {
    return Digit.DateUtils.ConvertTimestampToDate(Number(ts));
  } catch {
    return null;
  }
};

const TOKEN = {
  surface: "#f8faff",
  surfaceHov: "#eef4ff",
  border: "#dde4f0",
  borderAct: "#0284c7",
  active: "#0284c7",
  done: "#16a34a",
  textPri: "#1e293b",
  textSec: "#475569",
  textMut: "#94a3b8",
  accent: "linear-gradient(135deg,#7c3aed,#0284c7)",
};

const StatusPill = ({ label, isActive }) => (
  <span style={{
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "2px 10px",
    borderRadius: "999px",
    background: isActive ? "rgba(0,195,255,0.15)" : "rgba(0,230,118,0.12)",
    color: isActive ? TOKEN.active : TOKEN.done,
    border: `1px solid ${isActive ? TOKEN.active : TOKEN.done}`,
    lineHeight: "18px",
  }}>
    {label}
  </span>
);

const StepCard = ({ checkpoint, index, isActive, t, getTimelineCaptions }) => {
  const [expanded, setExpanded] = useState(isActive); /* active=open, done=collapsed */
  const stateLabel = checkpoint.state ? t(`CS_${checkpoint.state}`) : "NA";

  const dotColor = isActive ? TOKEN.active : TOKEN.done;
  const glowColor = isActive ? "0 0 14px rgba(0,195,255,0.5)" : "0 0 10px rgba(0,230,118,0.35)";
  const borderClr = isActive ? TOKEN.active : TOKEN.done;

  return (
    <div style={{ display: "flex", gap: "0", alignItems: "flex-start", position: "relative" }}>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "36px", flexShrink: 0 }}>
        <div style={{
          width: "18px", height: "18px", borderRadius: "50%",
          background: dotColor,
          boxShadow: glowColor,
          border: `2px solid ${dotColor}`,
          zIndex: 1, flexShrink: 0,
          marginTop: "16px",
        }} />
        {/* line below dot – always render */}
        <div style={{
          width: "2px",
          flex: 1,
          minHeight: "24px",
          background: `linear-gradient(to bottom, ${dotColor}, ${TOKEN.border})`,
          marginTop: "2px",
        }} />
      </div>

      <div style={{
        flex: 1,
        marginLeft: "12px",
        marginBottom: "16px",
        borderRadius: "12px",
        border: `1px solid ${expanded ? TOKEN.borderAct : TOKEN.border}`,
        background: TOKEN.surface,
        boxShadow: expanded ? `0 2px 12px rgba(2,132,199,0.10)` : "0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}>

        {/* card header */}
        <div
          onClick={() => setExpanded(v => !v)}
          style={{
            padding: "12px 16px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{
              fontWeight: 600,
              fontSize: "13px",
              color: TOKEN.textPri,
              letterSpacing: "0.01em",
            }}>
              {stateLabel}
            </span>
            {safeDate(checkpoint?.auditDetails?.lastModified) && (
              <span style={{ fontSize: "11px", color: TOKEN.textSec }}>
                {safeDate(checkpoint?.auditDetails?.lastModified)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <StatusPill label={isActive ? "Active" : "Done"} isActive={isActive} />
            <span style={{
              color: TOKEN.textMut, fontSize: "16px",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s",
              lineHeight: 1,
              userSelect: "none",
            }}>▾</span>
          </div>
        </div>

        {expanded && (
          <div style={{
            padding: "0 16px 14px",
            borderTop: `1px solid ${TOKEN.border}`,
            background: "#fff",
          }}>
            <div style={{ paddingTop: "12px" }}>
              {getTimelineCaptions(checkpoint)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionButton = ({ label, to, state }) => (
  <Link to={{ pathname: to, state }}>
    <button style={{
      width: "100%",
      marginTop: "8px",
      padding: "13px 20px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      background: TOKEN.accent,
      color: "#fff",
      fontWeight: 700,
      fontSize: "14px",
      letterSpacing: "0.04em",
      boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
      transition: "opacity 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {label}
    </button>
  </Link>
);


const WSWFApplicationTimeline = (props) => {
  const { t } = useTranslation();
  const businessService = props.application?.applicationNo.split("_")[0];
  const { isLoading, data } = Digit.Hooks.useWorkflowDetails({
    tenantId: props.application?.tenantId,
    id: props.id,
    moduleCode: businessService,
    config: { enabled: !!props.id },
  });

  const [showAllTimeline, setShowAllTimeline] = useState(true);

  /* ── original helpers ── */
  function OpenImage(imageSource, index, thumbnailsToShow) {
    window.open(thumbnailsToShow?.fullImage?.[0], "_blank");
  }

  const getTimelineCaptions = (checkpoint) => {
    if (checkpoint.state === "OPEN") {
      const caption = {
        date: safeDate(props.application?.auditDetails?.createdTime),
        source: props.application?.channel || "",
      };
      return <WSWFCaption data={caption} />;
    } else if (checkpoint.status === "ACTIVE") {
      return (
        <div>
          <Link to={`/digit-ui/citizen/commonpt/view-property?propertyId=${props?.application?.propertyId}&tenantId=${props?.application?.tenantId}`}>
            <span style={{ color: TOKEN.active, fontSize: "13px", textDecoration: "underline", cursor: "pointer" }}>
              {t("PT_VIEW_PROPERTY_DETAILS")}
            </span>
          </Link>
        </div>
      );
    } else {
      const caption = {
        source: props.application?.channel || "",
        date: checkpoint?.auditDetails?.lastModified,
        name: checkpoint?.assignes?.[0]?.name,
        mobileNumber: checkpoint?.assignes?.[0]?.mobileNumber,
        comment: t(checkpoint?.comment),
        wfComment: checkpoint.wfComment,
        thumbnailsToShow: checkpoint?.thumbnailsToShow,
      };
      return <WSWFCaption data={caption} OpenImage={OpenImage} />;
    }
  };

  const isMutation = props.application?.applicationType?.includes("MUTATION");
  const payBusinessService = isMutation
    ? (props.application?.serviceType === "SEWERAGE" || props.application?.service === "SEWERAGE" ? "SW.MUTATION" : "WS.MUTATION")
    : businessService;

  const showNextActions = (nextActions) => {
    if (!nextActions?.length) return null;
    let nextAction = nextActions[0];
    const next = nextActions.map((action) => action.action);
    if (next.includes("PAY") || next.includes("EDIT")) {
      let currentIndex = next.indexOf("EDIT") || next.indexOf("PAY");
      currentIndex = currentIndex !== -1 ? currentIndex : next.indexOf("PAY");
      nextAction = nextActions[currentIndex];
    }
    switch (nextAction?.action) {
      case "PAY":
        if (props?.paymentbuttonenabled !== false)
          return (
            <ActionButton
              label={t("CS_APPLICATION_DETAILS_MAKE_PAYMENT")}
              to={`/digit-ui/citizen/payment/collect/${payBusinessService}/${props.id}?consumerCode=${props.id}&&workflow=WNS`}
              state={{ tenantId: props.application.tenantId }}
            />
          );
        break;
      case "EDIT":
        return businessService !== "PT.MUTATION" ? (
          <ActionButton
            label={t("CS_APPLICATION_DETAILS_EDIT")}
            to={`/digit-ui/citizen/pt/property/edit-application/action=edit-${businessService}/${props.id}`}
            state={{ tenantId: props.application.tenantId }}
          />
        ) : null;
      case "SUBMIT_FEEDBACK":
        return (
          <ActionButton
            label={t("CS_APPLICATION_DETAILS_RATE")}
            to={`/digit-ui/citizen/fsm/rate/${props.id}`}
          />
        );
      default:
        return null;
    }
  };

  /* ── loading state ── */
  if (isLoading) return <Loader />;

  const visibleTimeline = data?.timeline
    ? data.timeline.slice(0, showAllTimeline ? data.timeline.length : 2)
    : [];

  /* ── render ── */
  return (
    <Fragment>
      {!isLoading && (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

          {/* section heading */}
          {data?.timeline?.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "20px",
            }}>
              {/* accent bar */}
              <div style={{
                width: "4px", height: "22px", borderRadius: "2px",
                background: TOKEN.accent,
                flexShrink: 0,
              }} />
              <span style={{
                fontWeight: 700,
                fontSize: "15px",
                color: TOKEN.textPri,
                letterSpacing: "0.02em",
              }}>
                {t("CS_APPLICATION_DETAILS_APPLICATION_TIMELINE")}
              </span>
            </div>
          )}

          {/* single item */}
          {data?.timeline?.length === 1 && (
            <StepCard
              checkpoint={data.timeline[0]}
              index={0}
              isActive={true}
              t={t}
              getTimelineCaptions={getTimelineCaptions}
            />
          )}

          {/* multiple items */}
          {data?.timeline?.length > 1 && (
            <div style={{ position: "relative" }}>
              {visibleTimeline.map((checkpoint, index) => (
                <StepCard
                  key={index}
                  checkpoint={checkpoint}
                  index={index}
                  isActive={index === 0}
                  t={t}
                  getTimelineCaptions={getTimelineCaptions}
                />
              ))}
            </div>
          )}

          {/* expand / collapse toggle */}
          {data?.timeline?.length > 2 && (
            <div
              onClick={() => setShowAllTimeline(prev => !prev)}
              style={{
                marginTop: "4px",
                marginBottom: "4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                color: TOKEN.active,
                letterSpacing: "0.04em",
                padding: "6px 0",
                userSelect: "none",
              }}
            >
              <span style={{
                display: "inline-block",
                transform: showAllTimeline ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s",
                lineHeight: 1,
              }}>▾</span>
              {showAllTimeline ? t("COLLAPSE") : t("VIEW_TIMELINE")}
            </div>
          )}

          {/* next action CTA */}
          {data && showNextActions(data?.nextActions)}
        </div>
      )}
    </Fragment>
  );
};

export default WSWFApplicationTimeline;
