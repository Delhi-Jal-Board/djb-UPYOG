import React, { Fragment } from "react";
import { Card, CardHeader, SubmitBar, CitizenInfoLabel, CardText, Loader, CardSubHeader, BackButton, BreadCrumb, Header, CardLabel, CardSectionHeader, CardCaption, ActionBar } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";

const WSDisconnectionDocsRequired = ({ userType }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();
  const tenantId = Digit.ULBService.getStateId();
  const goNext = () => {
  }


  if (userType === "citizen") {
    return (
      <Fragment>
        <Card>
          <CardHeader>{t(`WS_COMMON_APPLICATION_DISCONNECTION`)}</CardHeader>
          <CitizenInfoLabel style={{ margin: "0px" }} textStyle={{ color: "#0B0C0C", paddingLeft: "40px", paddingRight: "40px" }} text={t(`WS_DOCS_REQUIRED_TIME`)} showInfo={false} />
          <CardText style={{ color: "#0B0C0C", marginTop: "12px" }}>{t(`WS_NEW_CONNECTION_TEST_1`)}</CardText>
          <CardText style={{ color: "#0B0C0C", marginTop: "12px" }}>{t(`WS_NEW_CONNECTION_TEST_2`)}</CardText>
          <CardSubHeader>{t("WS_DOC_REQ_SCREEN_LABEL")}</CardSubHeader>
          <CardText style={{ color: "#0B0C0C", marginTop: "12px" }}>{t(`WS_NEW_CONNECTION_TEST_3`)}</CardText>
          <SubmitBar label={t(`CS_COMMON_NEXT`)} onSubmit={() => {
                history.push(`${match.path.replace("docsrequired", "application-form")}${location.search}`);
                history.push(`${match.path.replace("docsrequired", "k-number")}${location.search}`);
              }} />
        </Card>
      </Fragment>
    );
  }

  return (
    <div>
      {/* <Header styles={{fontSize: "32px", marginLeft: "18px"}}>{t("WS_WATER_AND_SEWERAGE_DISCONNECTION")}</Header> */}
      <Card >

        <ActionBar style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline" }}>
          {
            <SubmitBar
              label={t("ACTION_TEST_APPLY")}
              onSubmit={() => {
                history.push(`${match.path.replace("docsrequired", "application-form")}${location.search}`);
                history.push(`${match.path.replace("docsrequired", "k-number")}${location.search}`);
              }}
              style={{ margin: "10px 10px 0px 0px" }}

            />}
        </ActionBar>
      </Card>
    </div>
  )
};

export default WSDisconnectionDocsRequired;
