import React from "react";
import { PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper, BackButton } from "@djb25/digit-ui-react-components";
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
import VendorDetailsCard from "../../components/VendorDetailsCard";
import EkycStatus from "./EkycStatus";

const CitizenApp = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { path } = useRouteMatch();
  const { data: { stateInfo } = {} } = Digit.Hooks.useStore.getInitData();

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
    } else if (pathname.includes("/inbox")) {
      crumbs.push({ label: t("EKYC_INBOX") });
    } else if (pathname.includes("/supervisor-dashboard")) {
      crumbs.push({ label: t("EKYC_SUPERVISOR_DASHBOARD") });
    } else if (pathname.includes("/surveyor-dashboard")) {
      crumbs.push({ label: t("EKYC_SURVEYOR_DASHBOARD") });
    } else if (pathname.includes("/vendor-dashboard")) {
      crumbs.push({ label: t("EKYC_VENDOR_DASHBOARD") || "Vendor Dashboard" });
    } else if (pathname.includes("/dashboard")) {
      crumbs.push({ label: t("EKYC_DASHBOARD") });
    } else if (pathname.includes("/assign")) {
      crumbs.push({ label: t("EKYC_ASSIGN") });
    } else if (pathname.includes("/status/") || /^\/digit-ui\/citizen\/ekyc\/[^/]+$/.test(pathname)) {
      const statusLabel = t("EKYC_STATUS");
      crumbs.push({ label: statusLabel === "EKYC_STATUS" || statusLabel === "STATUS" ? "eKYC Status" : statusLabel });
    }
    // home (exact path) → no child crumb

    return crumbs;
  };

  // const roles = Digit.SessionStorage.get("User")?.info?.roles.map((ele) => ele.code);
  // const isEkyAction = (!roles?.includes("EKYC_SURVEYOR") || roles?.includes("EMPLOYEE"))
  const isEkycHome = location.pathname === "/digit-ui/citizen/ekyc" || location.pathname === "/digit-ui/citizen/ekyc/";

  if (isEkycHome) {
    const isMobile = window.Digit.Utils.browser.isMobile();
    return (
      // <div className="moduleLinkHomePage">
      //   <img src={stateInfo?.bannerUrl} alt="noimagefound" />
      //   <BackButton className="moduleLinkHomePageBackButton" />
      //   {isMobile ? (
      //     <h4
      //       style={{
      //         top: "calc(16vw + 40px)",
      //         left: "1.5rem",
      //         position: "absolute",
      //         color: "white",
      //         width: "50px",
      //         fontSize: "15px",
      //         marginTop: "6px",
      //       }}
      //     >
      //       {t("MODULE_EKYC")}
      //     </h4>
      //   ) : (
      //     <h1 style={{ width: "230px", marginTop: "15px" }}>{t("MODULE_EKYC")}</h1>
      //   )}
      //   <div className="moduleLinkHomePageModuleLinks">
      //     <Home />
      //   </div>
      // </div>
      <div className="moduleLinkHomePage">
        <div style={{ position: "relative" }}>
          <img src={stateInfo?.bannerUrl} alt="noimagefound" />
          <BackButton className="moduleLinkHomePageBackButton" />
          <div className="moduleTitle">
            {isMobile ? <h4>{t("MODULE_EKYC")}</h4> : <h1>{t("MODULE_EKYC")}</h1>}
          </div>
        </div>

        <div className="moduleLinkHomePageModuleLinks">
          <Home />
        </div>
      </div>
    );
  }

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
            path={[`${path}/vendor-dashboard/:vendorId`, `${path}/vendor-dashboard`]}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <VendorDetailsCard />
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
            path={[`${path}/supervisor-dashboard/:id`, `${path}/supervisor-dashboard`]}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <SupervisorDetailsCard />
              </LayoutWrapper>
            )}
          />
          <PrivateRoute
            path={`${path}/:id`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <EkycStatus />
              </LayoutWrapper>
            )}
          />
        </Switch>
      </div>
    </React.Fragment>
  );
};

export default CitizenApp;
