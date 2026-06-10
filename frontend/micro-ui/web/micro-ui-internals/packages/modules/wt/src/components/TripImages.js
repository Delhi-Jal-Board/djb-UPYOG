import React, { useState, useEffect } from "react";
import { ViewsIcon, Modal, Card } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const TripImages = ({ startFileStoreId, endFileStoreId }) => {
  const { t } = useTranslation();
  const [modalImage, setModalImage] = useState(null);
  const [startImageUrl, setStartImageUrl] = useState(null);
  const [endImageUrl, setEndImageUrl] = useState(null);
  const tenantId = Digit.ULBService.getCurrentTenantId();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        if (startFileStoreId) {
          const resStart = await Digit.UploadServices.Filefetch([startFileStoreId], tenantId);
          if (resStart?.data?.[startFileStoreId]) {
            setStartImageUrl(resStart.data[startFileStoreId].split(",")[0]);
          }
        }
        if (endFileStoreId) {
          const resEnd = await Digit.UploadServices.Filefetch([endFileStoreId], tenantId);
          if (resEnd?.data?.[endFileStoreId]) {
            setEndImageUrl(resEnd.data[endFileStoreId].split(",")[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching trip images", err);
      }
    };
    fetchImages();
  }, [startFileStoreId, endFileStoreId, tenantId]);

  if (!startFileStoreId && !endFileStoreId) return null;

  return (
    <div style={{ display: "flex", gap: "24px", marginTop: "16px", marginBottom: "16px" }}>
      {modalImage && (
        <Modal
          hideSubmit={true}
          popmoduleClassName="wt-trip-image-modal"
          headerBarMain={<h1 className="heading-m">{t("WT_TRIP_IMAGE")}</h1>}
          headerBarEnd={
            <div onClick={() => setModalImage(null)} style={{ cursor: "pointer", fontSize: "1.5rem" }}>
              &times;
            </div>
          }
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => setModalImage(null)}
          formId="modal-action"
        >
          <Card style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
            <img src={modalImage} alt="Trip Image" style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }} />
          </Card>
        </Modal>
      )}

      {startImageUrl && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "16px" }}>{t("WT_START_TRIP_IMAGE")}</p>
          <div style={{ position: "relative", width: "120px", height: "120px", border: "1px solid #ccc", borderRadius: "4px", overflow: "hidden" }}>
            <img src={startImageUrl} alt="Start Trip" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div
              onClick={() => setModalImage(startImageUrl)}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0,0,0,0.6)",
                borderRadius: "50%",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ViewsIcon fill="#ffffff" style={{ width: "24px", height: "24px" }} />
            </div>
          </div>
        </div>
      )}

      {endImageUrl && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "16px" }}>{t("WT_END_TRIP_IMAGE")}</p>
          <div style={{ position: "relative", width: "120px", height: "120px", border: "1px solid #ccc", borderRadius: "4px", overflow: "hidden" }}>
            <img src={endImageUrl} alt="End Trip" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div
              onClick={() => setModalImage(endImageUrl)}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0,0,0,0.6)",
                borderRadius: "50%",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ViewsIcon fill="#ffffff" style={{ width: "24px", height: "24px" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripImages;
