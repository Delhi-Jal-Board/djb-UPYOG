import React from "react";
import { PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Switch, useLocation, useRouteMatch } from "react-router-dom";
import AadhaarVerification from "../../components/AadhaarVerification";
import PropertyInfo from "../../components/PropertyInfo";
import MeterDetails from "../../components/MeterDetails";
import Review from "../../components/Review";
import Home from "./Home";
import Dashboard from "../../components/Dashboard";
import Inbox from "./Inbox";
import AddressDetails from "../../components/AddressDetails";
import AssignEkyc from "../../components/AssignEkyc";
import SurveyorDetailsCard from "../../components/SurveyorDetailsCard";
import VendorDetails from "../../components/VendorDetails";

const CitizenApp = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { path } = useRouteMatch();

  sessionStorage.removeItem("revalidateddone");

  const getBreadcrumbLabel = () => {
    const pathname = location.pathname;
    if (pathname.includes("/create-kyc")) return "EKYC_CREATE_KYC";
    if (pathname.includes("/aadhaar-verification")) return "EKYC_AADHAAR_VERIFICATION";
    if (pathname.includes("/address-details")) return "EKYC_ADDRESS_DETAILS";
    if (pathname.includes("/property-info")) return "EKYC_PROPERTY_INFO";
    if (pathname.includes("/meter-details")) return "EKYC_METER_DETAILS";
    if (pathname.includes("/review")) return "EKYC_REVIEW";
    return "EKYC_HOME";
  };

  const breadcrumbs = [{ icon: HomeIcon, path: "/digit-ui/citizen" }, { label: t(getBreadcrumbLabel()) }];

  const roles = Digit.SessionStorage.get("User")?.info?.roles.map((ele) => ele.code);
  const isEkyAction = (!roles?.includes("EKYC_SURVEYOR") || roles?.includes("EMPLOYEE"))
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
          breadcrumbs={breadcrumbs}
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

          <PrivateRoute
            path={`${path}/address-details`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <AddressDetails />
              </LayoutWrapper>
            )}
          />

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
        </Switch>
      </div>
    </React.Fragment>
  );
};

export default CitizenApp;
