import React, { useEffect } from "react";

import PopUp from "../atoms/PopUp";
import HeaderBar from "../atoms/HeaderBar";
import ButtonSelector from "../atoms/ButtonSelector";
import Toast from "../atoms/Toast";
import ActionBar from "../atoms/ActionBar";
import SubmitBar from "../atoms/SubmitBar";

const Modal = ({
  headerBarMain,
  headerBarEnd,
  children,
  actionCancelLabel,
  actionCancelOnSubmit,
  actionSaveLabel,
  actionSaveOnSubmit,
  actionSingleLabel,
  actionSingleSubmit,
  error,
  setError,
  formId,
  isDisabled,
  hideSubmit,
  style = {},
  headerBarMainStyle,
  actionClearLabel,
  actionClearOnSubmit,
  popupModuleActionBarStyles = {},
}) => {
  /**
   * TODO: It needs to be done from the desgin changes
   */
  const mobileView = Digit.Utils.browser.isMobile() ? true : false;

  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);
  return (
    <PopUp>
      <style>{`
        @keyframes digit-modal-appear {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div className="popup-module">
        <HeaderBar
          main={headerBarMain}
          end={headerBarEnd}
          style={{
            borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
            background: "linear-gradient(180deg, #ffffff 0%, #f5faff 100%)",
            padding: mobileView ? "12px 12px 10px" : "14px 20px",
            ...(headerBarMainStyle || {}),
          }}
        />
        <div className="popup-module-main">
          {children}
          <div className="popup-module-action-bar" style={{ ...popupModuleActionBarStyles }}>
            {actionCancelLabel ? <ButtonSelector theme="border" label={actionCancelLabel} onSubmit={actionCancelOnSubmit} style={style} /> : null}
            {actionClearLabel ? <ButtonSelector theme="border" label={actionClearLabel} onSubmit={actionClearOnSubmit} style={style} /> : null}
            {!hideSubmit ? (
              <ButtonSelector label={actionSaveLabel} onSubmit={actionSaveOnSubmit} formId={formId} isDisabled={isDisabled} style={style} />
            ) : null}
            {actionSingleLabel ? (
              <ActionBar
                style={{
                  position: mobileView ? "absolute" : "relative",
                  boxShadow: "none",
                  minWidth: mobileView ? "100%" : "240px",
                  maxWidth: mobileView ? "100%" : "360px",
                  margin: mobileView ? "8px 0 0" : "16px",
                }}
              >
                <div style={{ width: "100%" }}>
                  <SubmitBar style={{ width: "100%" }} label={actionSingleLabel} onSubmit={actionSingleSubmit} />
                </div>
              </ActionBar>
            ) : null}
          </div>
        </div>
      </div>
      {error && <Toast label={error} onClose={() => setError(null)} error />}
    </PopUp>
  );
};

export default Modal;
