import { AppContainer, PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation } from "react-router-dom";
import Dashboard from "../../components/Dashboard";
import CeoDashboard from "../../components/CeoDashboard.jsx";
import VendorDetailsCard from "../../components/VendorDetailsCard.js";
import Inbox from "./Inbox";
import Mapping from "./Mapping";
import Create from "./Create";
import Review from "../../components/Review";
import EKYCForm from "./EKYCForm";
import SurveyorDetailsCard from "../../components/SurveyorDetailsCard.js";
import AssignEkyc from "../../components/AssignEkyc.js";
import AdminDashboard from "../../components/AdminDashboard.js";

const EmployeeApp = ({ path }) => {
  const { t } = useTranslation();
  const location = useLocation();

  sessionStorage.removeItem("revalidateddone");

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    // Parent crumb — always present and clickable → redirects to eKYC inbox
    const crumbs = [
      { icon: HomeIcon, path: "/digit-ui/employee" },
      { label: t("ACTION_TEST_EKYC"), path: `/digit-ui/employee/module/details` },
    ];

    // Child crumb — only appended when on a sub-page (not inbox/dashboard itself)
    if (pathname.includes("/create-kyc")) {
      crumbs.push({ label: t("EKYC_CREATE_KYC") });
    } else if (pathname.includes("/consumer-details")) {
      crumbs.push({ label: t("EKYC_CONSUMER_DETAILS") });
    } else if (pathname.includes("/address-details")) {
      crumbs.push({ label: t("EKYC_ADDRESS_DETAILS") });
    } else if (pathname.includes("/property-info")) {
      crumbs.push({ label: t("EKYC_PROPERTY_INFO") });
    } else if (pathname.includes("/meter-details")) {
      crumbs.push({ label: t("EKYC_METER_DETAILS") });
    } else if (pathname.includes("/review")) {
      crumbs.push({ label: t("EKYC_INBOX"), path: `/digit-ui/employee/ekyc/inbox` });
      crumbs.push({ label: t("EKYC_REVIEW") });
    } else if (pathname.includes("/assign/surveyor-details")) {
      crumbs.push({ label: t("EKYC_ASSIGN"), path: `/digit-ui/employee/ekyc/assign` });
      crumbs.push({ label: t("EKYC_SURVEYOR_DETAILS") });
    } else if (pathname.includes("/assign")) {
      crumbs.push({ label: t("EKYC_ASSIGN") });
    } else if (pathname.includes("/ceo-dashboard")) {
      crumbs.push({ label: t("CEO_M.F_DOR_FINANCE_VIEW") });
    } else if (pathname.includes("/admin-dashboard")) {
      crumbs.push({ label: t("EKYC_ADMIN_DASHBOARD") || "Admin Dashboard" });
    } else if (pathname.includes("/vendors/")) {
      crumbs.push({ label: t("EKYC_VENDOR_DETAILS") });
    } else if (pathname.includes("/mapping")) {
      crumbs.push({ label: t("EKYC_MAPPING") });
    } else if (pathname.includes("/dashboard")) {
      crumbs.push({ label: t("EKYC_DASHBOARD") });
    } else if (pathname.includes("/inbox")) {
      crumbs.push({ label: t("EKYC_INBOX") });
    }
    // dashboard & inbox → no child crumb (only "eKYC Admin" shown)

    return crumbs;
  };

  const formStepRoutes = ["consumer-details", "address-details", "property-info", "meter-details"];

  return (
    <AppContainer>
      <div className="ground-container employee-app-container form-container">
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

        <div className="employee-form">
          <Switch>
            <PrivateRoute
              path={`${path}/dashboard`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <Dashboard parentRoute={path} businessService="EKYC" moduleCode="EKYC" isInbox={true} />
                </LayoutWrapper>
              )}
            />
            <PrivateRoute
              path={`${path}/inbox`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <Inbox parentRoute={path} businessService="EKYC" moduleCode="EKYC" isInbox={true} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/create-kyc`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <Create />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/mapping`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <Mapping />
                </LayoutWrapper>
              )}
            />
            <PrivateRoute
              path={`${path}/assign`}
              exact
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <AssignEkyc />
                </LayoutWrapper>
              )}
            />
            <PrivateRoute
              path={`${path}/assign/surveyor-details/:id`}
              exact
              component={() => (
                <LayoutWrapper layoutClass="action">
                  <SurveyorDetailsCard />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={formStepRoutes.map((route) => `${path}/${route}`)}
              component={(props) => (
                <LayoutWrapper layoutClass="normal">
                  <EKYCForm {...props} path={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/review/:kno`}
              component={() => (
                <LayoutWrapper layoutClass="action">
                  <Review />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/ceo-dashboard`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <CeoDashboard />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/admin-dashboard`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <AdminDashboard />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/vendors/:vendorId`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <VendorDetailsCard />
                </LayoutWrapper>
              )}
            />

            {/* <PrivateRoute
                path={`${path}/`}
                component={() => <Inbox parentRoute={path} businessService="EKYC" moduleCode="EKYC" isInbox={true} />}
              /> */}
          </Switch>
        </div>
      </div>
    </AppContainer>
  );
};

export default EmployeeApp;
