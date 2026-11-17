import React, { useState } from "react";
import {
  Card,
  CardHeader,
  SubmitBar,
  CitizenInfoLabel,
  CardText,
  Loader,
  CardSubHeader,
  ActionBar,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch } from "react-router-dom";

const WSDocsRequired = ({ onSelect, userType, onSkip, config }) => {
  const history = useHistory();
  const match = useRouteMatch();
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getStateId();
  const goNext = () => {
    onSelect("DocsReq", "");
  };
 


  sessionStorage.removeItem("Digit.PT_CREATE_EMP_WS_NEW_FORM");
  sessionStorage.removeItem("IsDetailsExists");
  sessionStorage.removeItem("FORMSTATE_ERRORS");

  const { isLoading: wsDocsLoading, data: wsDocs } = Digit.Hooks.ws.WSSearchMdmsTypes.useWSServicesMasters(tenantId);

  if (userType === "citizen") {
    return (
      <React.Fragment>
        <Card>
          <CardHeader>{t(`WS_COMMON_APPL_NEW_CONNECTION`)}</CardHeader>
          <CitizenInfoLabel
            style={{ margin: "0px", textAlign: "center" }}
            textStyle={{ color: "#0B0C0C" }}
            text={t(`WS_DOCS_REQUIRED_TIME`)}
            showInfo={false}
          />
          <CardText style={{ color: "#0B0C0C", marginTop: "12px" }}>{t(`WS_NEW_CONNECTION_TEST_1`)}</CardText>
          <CardText style={{ color: "#0B0C0C", marginTop: "12px" }}>{t(`WS_NEW_CONNECTION_TEST_2`)}</CardText>
          <CardSubHeader>{t("WS_DOC_REQ_SCREEN_LABEL")}</CardSubHeader>
          <CardText style={{ color: "#0B0C0C", marginTop: "12px" }}>{t(`WS_NEW_CONNECTION_TEST_3`)}</CardText>
          {wsDocsLoading ? (
            <Loader />
          ) : (
            <React.Fragment>
              {wsDocs?.Documents?.map((doc, index) => (
                <div key={index}>
                  <div style={{ fontWeight: 700, marginBottom: "8px" }} key={index}>
                    <div style={{ display: "flex" }}>
                      <div>{`${index + 1}.`}&nbsp;</div>
                      <div>{` ${t(doc?.code.replace(".", "_"))}`}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px", marginLeft: "18px" }}>
                    {doc?.dropdownData?.map((value, index) =>
                      doc?.dropdownData?.length !== index + 1 ? (
                        <span key={index}>{`${t(value?.i18nKey)}, `}</span>
                      ) : (
                        <span key={index}>{`${t(value?.i18nKey)}`}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </React.Fragment>
          )}
          <SubmitBar label={t(`CS_COMMON_NEXT`)} onSubmit={goNext} />
        </Card>
      </React.Fragment>
    );
  }


  return (
    <div className="employee-form-content-with-action-bar">
      <div style={{ width: "100%", height: "auto" }}>
        {wsDocsLoading ? (
          <Loader />
        ) : (
          <div id="documents-div" className="ws-docs-container">
            {wsDocs?.Documents?.map((doc, index) => (
              <Card key={index} className="ws-doc-card">
                {/* Header */}
                <div className="ws-doc-header">
                  <div className="ws-doc-title">
                    {index + 1}. {t(doc?.i18nKey)}
                  </div>

                  {doc?.required && <span className="ws-doc-required">{t("CS_COMMON_REQUIRED")}</span>}
                </div>

                {/* Description */}
                {doc?.description && <div className="ws-doc-description">{t(doc?.description)}</div>}

                {/* Document Options */}
                <div className="ws-doc-options">
                  {doc?.dropdownData?.map((value, idx) => (
                    <div key={idx} className="ws-doc-option">
                      <span className="ws-doc-bullet">{idx + 1}.</span>
                      <span>{t(value?.i18nKey)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
        <ActionBar style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline" }}>
          {
            <SubmitBar
              label={t("ACTION_TEST_APPLY")}
              onSubmit={() => {
                history.push(match.path.replace("create-application", "new-application"));
              }}
            />
          }
        </ActionBar>
      </div>
    </div>
  );
};

export default WSDocsRequired;
