import React from "react";
import { useTranslation } from "react-i18next";
import { TelePhone, DisplayPhotos } from "@djb25/digit-ui-react-components";

const TOKEN = {
  textPri:  "#1e293b",
  textSec:  "#475569",
  textMut:  "#94a3b8",
  active:   "#0284c7",
  border:   "#dde4f0",
  surface:  "#f0f9ff",
  quote:    "#eff6ff",
};

const MetaRow = ({ icon, children }) =>
  children ? (
    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
      <span style={{ fontSize: "14px", opacity: 0.6 }}>{icon}</span>
      <span style={{ fontSize: "12px", color: TOKEN.textSec }}>{children}</span>
    </div>
  ) : null;

const WSWFCaption = ({ data, OpenImage }) => {
  const { t } = useTranslation();
  if (!data) return null;

  const hasComments = data?.wfComment?.length > 0;
  const hasThumbs   = data?.thumbnailsToShow?.thumbs?.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

      {/* ── meta rows ── */}
      {data.date && (
        <MetaRow icon="🕐">
          {typeof data.date === "number"
            ? (() => {
                try { return Digit.DateUtils.ConvertTimestampToDate(data.date); } catch { return null; }
              })()
            : data.date}
        </MetaRow>
      )}

      {data.name && <MetaRow icon="👤">{data.name}</MetaRow>}

      {data.mobileNumber && (
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
          <span style={{ fontSize: "14px", opacity: 0.6 }}>📞</span>
          <span style={{ fontSize: "12px", color: TOKEN.textSec }}>
            <TelePhone mobile={data.mobileNumber} />
          </span>
        </div>
      )}

      {data.source && (
        <MetaRow icon="📡">
          {t("ES_APPLICATION_DETAILS_APPLICATION_CHANNEL_" + data.source.toUpperCase())}
        </MetaRow>
      )}

      {data.comment && (
        <p style={{ margin: "0 0 6px", fontSize: "12px", color: TOKEN.textSec }}>
          {data.comment}
        </p>
      )}

      {hasComments && (
        <div style={{ marginTop: "8px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            marginBottom: "6px",
          }}>
            <div style={{
              width: "3px", height: "14px", borderRadius: "2px",
              background: TOKEN.active, flexShrink: 0,
            }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: TOKEN.active,
            }}>
              {t("WF_COMMON_COMMENTS")}
            </span>
          </div>

          {data.wfComment.map((comment, i) => (
            <div key={i} style={{
              position: "relative",
              background: TOKEN.quote,
              border: `1px solid ${TOKEN.border}`,
              borderLeft: `3px solid ${TOKEN.active}`,
              borderRadius: "0 8px 8px 0",
              padding: "8px 12px",
              marginBottom: "6px",
              overflowX: "auto",
            }}>
              <span style={{
                position: "absolute",
                top: "4px",
                left: "6px",
                fontSize: "22px",
                opacity: 0.15,
                lineHeight: 1,
                color: TOKEN.active,
                userSelect: "none",
              }}>"</span>
              <p style={{
                margin: "0",
                fontSize: "12px",
                color: TOKEN.textPri,
                lineHeight: "1.6",
                paddingLeft: "8px",
                wordBreak: "break-word",
              }}>
                {comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {hasThumbs && (
        <div style={{ marginTop: "10px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            marginBottom: "8px",
          }}>
            <div style={{
              width: "3px", height: "14px", borderRadius: "2px",
              background: "#ff9800", flexShrink: 0,
            }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#ff9800",
            }}>
              {t("CS_COMMON_ATTACHMENTS")}
            </span>
          </div>
          <div style={{
            background: TOKEN.surface,
            border: `1px solid ${TOKEN.border}`,
            borderRadius: "8px",
            padding: "8px",
          }}>
            <DisplayPhotos
              srcs={data.thumbnailsToShow.thumbs}
              onClick={(src, index) => OpenImage?.(src, index, data.thumbnailsToShow)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WSWFCaption;
