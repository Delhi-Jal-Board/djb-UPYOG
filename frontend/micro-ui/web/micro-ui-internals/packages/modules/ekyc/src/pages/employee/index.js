import { AppContainer, PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation } from "react-router-dom";
import Dashboard from "../../components/Dashboard";
import CeoDashboard from "../../components/CeoDashboard.jsx";
import VendorDetails from "../../components/VendorDetails.jsx";
import Inbox from "./Inbox";
import Mapping from "./Mapping";
import Create from "./Create";
import Review from "../../components/Review";
import EKYCForm from "./EKYCForm";
import SurveyorDetailsCard from "../../components/SurveyorDetailsCard.js";
import AssignEkyc from "../../components/AssignEkyc.js";

const EmployeeApp = ({ path }) => {
  const { t } = useTranslation();
  const location = useLocation();

  sessionStorage.removeItem("revalidateddone");

  const getBreadcrumbLabel = () => {
    const pathname = location.pathname;
    if (pathname.includes("/dashboard")) return "ES_COMMON_INBOX";
    if (pathname.includes("/create-kyc")) return "EKYC_CREATE_KYC";
    if (pathname.includes("/k-details")) return "EKYC_K_DETAILS";
    if (pathname.includes("/consumer-details")) return "EKYC_CONSUMER_DETAILS";
    if (pathname.includes("/address-details")) return "EKYC_ADDRESS_DETAILS";
    if (pathname.includes("/property-info")) return "EKYC_PROPERTY_INFO";
    if (pathname.includes("/meter-details")) return "EKYC_METER_DETAILS";
    if (pathname.includes("/review")) return "EKYC_REVIEW";
    return "ES_COMMON_INBOX";
  };

  const breadcrumbs = [{ icon: HomeIcon, path: "/digit-ui/employee" }, { label: t(getBreadcrumbLabel()) }];

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
          breadcrumbs={breadcrumbs}
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
              path={`${path}/vendors/:vendorId`}
              component={() => (
                <LayoutWrapper layoutClass="normal">
                  <VendorDetails />
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
