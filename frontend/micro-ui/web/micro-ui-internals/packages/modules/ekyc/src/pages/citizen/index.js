import React from "react";
import { PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Switch, useLocation, useRouteMatch } from "react-router-dom";
import AadhaarVerification from "../../components/AadhaarVerification";
import PropertyInfo from "../../components/PropertyInfo";
import MeterDetails from "../../components/MeterDetails";
import Review from "../../components/Review";
import Home from "./Home";
import Inbox from "./Inbox";
import AssignEkyc from "../../components/AssignEkyc";
import SurveyorDetailsCard from "../../components/SurveyorDetailsCard";
import SupervisorDetailsCard from "../../components/SupervisorDetailsCard";
import VendorDetails from "../../components/VendorDetails";

const CitizenApp = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { path } = useRouteMatch();

  sessionStorage.removeItem("revalidateddone");

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    // Parent crumb — always present and clickable → redirects to eKYC citizen home
    const crumbs = [
      { icon: HomeIcon, path: "/digit-ui/citizen" },
      { label: t("EKYC_MODULE_NAME"), path: `/digit-ui/citizen/ekyc` },
    ];

    // Child crumb — only appended when on a sub-page
    if (pathname.includes("/create-kyc")) {
      crumbs.push({ label: t("EKYC_CREATE_KYC") });
    } else if (pathname.includes("/aadhaar-verification")) {
      crumbs.push({ label: t("EKYC_AADHAAR_VERIFICATION") });
    } else if (pathname.includes("/address-details")) {
      crumbs.push({ label: t("EKYC_ADDRESS_DETAILS") });
    } else if (pathname.includes("/property-info")) {
      crumbs.push({ label: t("EKYC_PROPERTY_INFO") });
    } else if (pathname.includes("/meter-details")) {
      crumbs.push({ label: t("EKYC_METER_DETAILS") });
    } else if (pathname.includes("/review")) {
      crumbs.push({ label: t("EKYC_INBOX"), path: `/digit-ui/citizen/ekyc/inbox` });
      crumbs.push({ label: t("EKYC_REVIEW") });
    } else if (pathname.includes("/assign/surveyor-details")) {
      crumbs.push({ label: t("EKYC_ASSIGN"), path: `/digit-ui/citizen/ekyc/assign` });
      crumbs.push({ label: t("EKYC_SURVEYOR_DETAILS") });
    } else if (pathname.includes("/assign")) {
      crumbs.push({ label: t("EKYC_ASSIGN") });
    } else if (pathname.includes("/surveyor-dashboard")) {
      crumbs.push({ label: t("EKYC_SURVEYOR_DASHBOARD") });
    } else if (pathname.includes("/dashboard")) {
      crumbs.push({ label: t("EKYC_DASHBOARD") });
    } else if (pathname.includes("/inbox")) {
      crumbs.push({ label: t("EKYC_INBOX") });
    } else if (pathname.includes("/status/")) {
      crumbs.push({ label: t("EKYC_STATUS") });
    } else if (pathname.includes("/supervisor-dashboard")) {
      crumbs.push({ label: t("EKYC_SUPERVISOR_DASHBOARD") });
    }
    // home (exact path) → no child crumb

    return crumbs;
  };

  // const roles = Digit.SessionStorage.get("User")?.info?.roles.map((ele) => ele.code);
  // const isEkyAction = (!roles?.includes("EKYC_SURVEYOR") || roles?.includes("EMPLOYEE"))
  return (
    <React.Fragment>
      <div className="ground-container form-container">
        <ModuleHeader
          leftContent={
            <React.Fragment>
              <ArrowLeft className="icon" />
              {t("CS_COMMON_BACK")}
            </React.Fragment>
          }
          onLeftClick={() => window.history.back()}
          breadcrumbs={getDynamicBreadcrumbs()}
        />

        <Switch>
          <PrivateRoute
            exact
            path={`${path}`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <Home />
              </LayoutWrapper>
            )}
          />
          <PrivateRoute
            path={`${path}/dashboard`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <VendorDetails />
              </LayoutWrapper>
            )}
          />
          <PrivateRoute
            path={`${path}/inbox`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <Inbox />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/aadhaar-verification`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <AadhaarVerification />
              </LayoutWrapper>
            )}
          />

          {/* <PrivateRoute
            path={`${path}/address-details`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <AddressDetails />
              </LayoutWrapper>
            )}
          /> */}

          <PrivateRoute
            path={`${path}/property-info`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <PropertyInfo />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/meter-details`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <MeterDetails />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/review`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <Review />
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
            path={`${path}/surveyor-dashboard/:id`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <SurveyorDetailsCard />
              </LayoutWrapper>
            )}
          />
          <PrivateRoute
            path={`${path}/surveyor-dashboard`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <SurveyorDetailsCard />
              </LayoutWrapper>
            )}
          />
          <PrivateRoute
            path={`${path}/status/:applicationId`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <Review />
              </LayoutWrapper>
            )}
          />
          <PrivateRoute
            path={`${path}/supervisor-dashboard`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <SupervisorDetailsCard />
              </LayoutWrapper>
            )}
          />
        </Switch>
      </div>
    </React.Fragment>
  );
};

export default CitizenApp;
