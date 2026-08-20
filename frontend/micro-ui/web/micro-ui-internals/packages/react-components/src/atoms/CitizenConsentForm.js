import React, { useState, useEffect } from "react";
import { Loader } from "./Loader";
import Modal from "../hoc/Modal";

const Heading = (props) => {
  return (
    <h1 style={{ marginLeft: "22px" }} className="heading-m BPAheading-m">
      {props.label}
    </h1>
  );
};

const Close = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#0B0C0C" />
  </svg>
);

const CloseBtn = (props) => {
  return (
    <div className="icon-bg-secondary" onClick={props.onClick} style={{ backgroundColor: "#FFFFFF" }}>
      <Close />
    </div>
  );
};

const CitizenConsentForm = ({ t, styles, mdmsConfig = "", setMdmsConfig, labels }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (mdmsConfig && !showModal) setShowModal(true);
  }, [mdmsConfig]);

  const closeModal = () => {
    setShowModal(false);
    setMdmsConfig("");
  };

  const url = labels?.filter((data) => data.linkId == mdmsConfig)?.[0]?.[Digit.StoreData.getCurrentLanguage()];

  return (
    <div style={styles ? styles : {}}>
      {showModal ? (
        <Modal
          headerBarMain={
            <Heading
              label={
                mdmsConfig && url
                  ? t(labels?.find((data) => data.linkId === mdmsConfig)?.link || `CCF_${mdmsConfig?.toUpperCase()}_HEADER`)
                  : ""
              }
            />
          }
          headerBarEnd={<CloseBtn onClick={closeModal} />}
          actionCancelOnSubmit={closeModal}
          formId="modal-action"
          style={{ minHeight: "45px", height: "auto", width: "160px" }}
          hideSubmit={true}
          headerBarMainStyle={{ margin: "0px", height: "35px" }}
        >
          {url ? (
            <div style={{ width: "100%", height: "75vh" }}>
              <iframe
                style={{ border: "none", width: "100%", height: "100%" }}
                src={`${url}`}
                title="Citizen Consent Form"
              ></iframe>
            </div>
          ) : (
            <div style={{ width: "100%", height: "100px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {t("COMMON_URL_NOT_FOUND")}
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
};

export default CitizenConsentForm;
