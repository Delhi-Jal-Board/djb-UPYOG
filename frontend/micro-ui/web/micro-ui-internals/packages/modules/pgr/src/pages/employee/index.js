import React, { useState } from "react";
import { Switch, Route, useRouteMatch, useLocation } from "react-router-dom";
import {
  AppContainer,
  ModuleHeader,
  ArrowLeft,
  HomeIcon,
  LayoutWrapper,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Employee } from "../../constants/Routes";

const Complaint = () => {
  const match = useRouteMatch();
  const { t } = useTranslation();
  const location = useLocation();

  /* ── Dynamic breadcrumbs — exact HRMS pattern ─── */
  const getDynamicBreadcrumbs = () => {
    const crumbs = [
      { icon: HomeIcon, path: "/digit-ui/employee" },
      {
        label: t("CS_PGR_HEADER_COMPLAINT"),
        path: "/digit-ui/employee/module/details?moduleName=PGR",
      },
    ];

    const currentPath = location.pathname;

    if (currentPath.includes("/inbox")) {
      crumbs.push({ label: t("CS_COMMON_INBOX") });
    } else if (currentPath.includes("/complaint/create")) {
      crumbs.push({ label: t("CS_COMMON_INBOX"), path: `${match.url}/inbox` });
      crumbs.push({ label: t("CS_PGR_CREATE_COMPLAINT") });
    } else if (currentPath.includes("/complaint/details")) {
      crumbs.push({ label: t("CS_COMMON_INBOX"), path: `${match.url}/inbox` });
      crumbs.push({ label: t("CS_PGR_COMPLAINT_DETAILS") });
    } else if (currentPath.includes("/response")) {
      crumbs.push({ label: t("CS_COMMON_INBOX"), path: `${match.url}/inbox` });
      crumbs.push({ label: t("CS_PGR_RESPONSE") });
    } else if (currentPath.includes("/edit-complaint")) {
      crumbs.push({ label: t("CS_COMMON_INBOX"), path: `${match.url}/inbox` });
      crumbs.push({ label: t("CS_PGR_EDIT_APPLICATION") });
    } else {
      crumbs.push({ label: t("CS_PGR_HEADER_COMPLAINT") });
    }

    return crumbs;
  };

  const CreateComplaint = Digit?.ComponentRegistryService?.getComponent("PGRCreateComplaintEmp");
  const ComplaintDetails = Digit?.ComponentRegistryService?.getComponent("PGRComplaintDetails");
  const Inbox = Digit?.ComponentRegistryService?.getComponent("PGRInbox");
  const Response = Digit?.ComponentRegistryService?.getComponent("PGRResponseEmp");
  const EditApplication = Digit.ComponentRegistryService.getComponent("PGREditApplication");

  return (
    <Switch>
      <AppContainer>
        <div className="ground-container employee-app-container form-container">
          {/* Blue header bar — exact HRMS ModuleHeader */}
          <ModuleHeader
            leftContent={
              <React.Fragment>
                <ArrowLeft className="icon" />
                Back
              </React.Fragment>
            }
            onLeftClick={() => window.history.back()}
            breadcrumbs={getDynamicBreadcrumbs()}
          />

          <Route
            path={match.url + Employee.CreateComplaint}
            component={() => <CreateComplaint parentUrl={match.url} />}
          />
          <Route
            path={match.url + Employee.ComplaintDetails + ":id*"}
            component={() => <ComplaintDetails />}
          />
          <Route path={match.url + Employee.Inbox} component={Inbox} />
          <Route path={match.url + Employee.Response} component={Response} />
          <Route
            path={match.url + Employee.EditApplication + ":id*"}
            component={EditApplication}
          />
        </div>
      </AppContainer>
    </Switch>
  );
};

export default Complaint;
